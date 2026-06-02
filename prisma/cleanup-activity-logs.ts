/**
 * Script: cleanup-activity-logs.ts
 *
 * Tugas:
 *  1. Membersihkan entri ActivityLog lama yang mengandung ID mentah dan/atau emoji
 *  2. Menerapkan ulang fungsi trigger detect_vote_tampering() yang sudah diperbaiki
 *     langsung ke database aktif (tanpa perlu reset migrations)
 *
 * Jalankan dengan:
 *   pnpm tsx prisma/cleanup-activity-logs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Regex untuk mendeteksi pola ID mentah CUID/UUID ─────────────────────────
// Contoh pola: (ID: cmpe0khzt000lmjzss7c7v29m) atau ID yang panjang alfanumerik
const RAW_ID_PATTERN = /\(ID:\s*[a-z0-9]{20,}\)/gi;

// ─── Pola emoji yang perlu dihapus ────────────────────────────────────────────
const EMOJI_PATTERN = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}⚠️]/gu;

// ─── Frasa yang perlu dihapus ────────────────────────────────────────────────
const PHRASES_TO_REMOVE = [" tanpa melalui API", "tanpa melalui API"];

function cleanDescription(desc: string): string {
  let cleaned = desc;

  // 1. Hapus emoji
  cleaned = cleaned.replace(EMOJI_PATTERN, "").trim();

  // 2. Hapus pola ID mentah seperti "(ID: cmpe0khzt...)"
  cleaned = cleaned.replace(RAW_ID_PATTERN, "").trim();

  // 3. Hapus frasa spesifik yang tidak perlu
  for (const phrase of PHRASES_TO_REMOVE) {
    cleaned = cleaned.split(phrase).join("");
  }

  // 4. Bersihkan spasi ganda atau koma ganda yang mungkin tersisa
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  cleaned = cleaned.replace(/\.\s*\./g, ".").trim();

  return cleaned;
}

async function cleanupActivityLogs() {
  console.log("=== CLEANUP ACTIVITY LOG ===\n");

  // Cari semua log yang mengandung ID mentah atau emoji
  const logsToFix = await prisma.activityLog.findMany({
    where: {
      OR: [
        { description: { contains: "(ID:" } },
        { description: { contains: "⚠️" } },
        { description: { contains: "tanpa melalui API" } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (logsToFix.length === 0) {
    console.log("Tidak ada log yang perlu dibersihkan.");
    return;
  }

  console.log(`Ditemukan ${logsToFix.length} entri yang perlu dibersihkan:\n`);

  let updatedCount = 0;

  for (const log of logsToFix) {
    const newDesc = cleanDescription(log.description ?? "");

    if (newDesc !== log.description) {
      console.log(`  [BEFORE] ${log.description}`);
      console.log(`  [AFTER]  ${newDesc}`);
      console.log(`  ---`);

      await prisma.activityLog.update({
        where: { id: log.id },
        data: { description: newDesc },
      });
      updatedCount++;
    }
  }

  console.log(`\nSelesai. ${updatedCount} entri berhasil diperbaiki.`);
}

async function reapplyTrigger() {
  console.log("\n=== RE-APPLY TRIGGER FUNCTION ===\n");

  // Terapkan ulang fungsi PL/pgSQL yang sudah diperbaiki (tanpa ID, tanpa emoji)
  const triggerSQL = `
    CREATE OR REPLACE FUNCTION detect_vote_tampering()
    RETURNS TRIGGER AS $$
    DECLARE
      v_id     TEXT;
      v_type   "ActivityType";
      v_desc   TEXT;
      v_voter_name TEXT;
      v_session_title TEXT;
    BEGIN
      IF (TG_OP = 'DELETE') THEN
        v_id   := OLD.id;
        v_type := 'DATA_DELETED'::"ActivityType";

        SELECT "fullName" INTO v_voter_name FROM "User" WHERE id = OLD."userId";
        SELECT title INTO v_session_title FROM "VotingSession" WHERE id = OLD."votingSessionId";

        IF (v_voter_name IS NOT NULL AND v_session_title IS NOT NULL) THEN
          v_desc := 'PERINGATAN: Integritas rusak! Data suara dari pemilih ' || v_voter_name || ' pada sesi "' || v_session_title || '" telah DIHAPUS secara paksa dari database.';
        ELSE
          v_desc := 'PERINGATAN: Integritas rusak! Data suara telah DIHAPUS secara paksa dari database.';
        END IF;

      ELSIF (TG_OP = 'UPDATE') THEN
        v_id   := NEW.id;
        v_type := 'DATA_UPDATED'::"ActivityType";

        SELECT "fullName" INTO v_voter_name FROM "User" WHERE id = NEW."userId";
        SELECT title INTO v_session_title FROM "VotingSession" WHERE id = NEW."votingSessionId";

        IF (v_voter_name IS NOT NULL AND v_session_title IS NOT NULL) THEN
          v_desc := 'PERINGATAN: Integritas rusak! Data suara dari pemilih ' || v_voter_name || ' pada sesi "' || v_session_title || '" telah DIUBAH secara paksa dari database.';
        ELSE
          v_desc := 'PERINGATAN: Integritas rusak! Data suara telah DIUBAH secara paksa dari database.';
        END IF;
      END IF;

      INSERT INTO "ActivityLog" (id, type, description, metadata, "createdAt")
      VALUES (
        gen_random_uuid()::TEXT,
        v_type,
        v_desc,
        jsonb_build_object(
          'operation',   TG_OP,
          'detectedAt',  NOW()::TEXT,
          'table',       TG_TABLE_NAME
        ),
        NOW()
      );

      IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await prisma.$executeRawUnsafe(triggerSQL);
  console.log("Fungsi trigger detect_vote_tampering() berhasil diperbarui di database.");

  // Pastikan trigger masih aktif
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_vote_tampering ON "VoteRecord";
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER trg_vote_tampering
    AFTER UPDATE OR DELETE ON "VoteRecord"
    FOR EACH ROW
    EXECUTE FUNCTION detect_vote_tampering();
  `);
  console.log("Trigger trg_vote_tampering berhasil dipasang ulang pada tabel VoteRecord.");

  // Pastikan trigger spam lama tidak aktif
  await prisma.$executeRawUnsafe(`
    DROP TRIGGER IF EXISTS trg_audit_voterecord ON "VoteRecord";
  `);
  console.log("Trigger spam trg_audit_voterecord dihapus (jika ada).");
}

async function main() {
  await cleanupActivityLogs();
  await reapplyTrigger();
  console.log("\n=== SELESAI ===");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("ERROR:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
