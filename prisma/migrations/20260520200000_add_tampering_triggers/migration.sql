-- ============================================================
-- Migration: add_tampering_triggers
-- Tujuan: Mendeteksi manipulasi paksa pada tabel VoteRecord
--         (UPDATE / DELETE yang dilakukan langsung ke database,
--          mem-bypass API) dan mencatatnya ke ActivityLog.
-- ============================================================

-- CreateFunction: detect_vote_tampering()
-- Fungsi PL/pgSQL yang menjadi handler untuk trigger di bawah.
-- Setiap kali ada perintah UPDATE atau DELETE pada "VoteRecord",
-- fungsi ini otomatis menyisipkan baris peringatan ke "ActivityLog".
CREATE OR REPLACE FUNCTION detect_vote_tampering()
RETURNS TRIGGER AS $$
DECLARE
  v_type   "ActivityType";
  v_desc   TEXT;
  v_voter_name TEXT;
  v_session_title TEXT;
BEGIN
  -- Tentukan tipe aktivitas
  IF (TG_OP = 'DELETE') THEN
    v_type := 'DATA_DELETED'::"ActivityType";
    
    -- Cari nama pemilih dan judul sesi voting
    SELECT "fullName" INTO v_voter_name FROM "User" WHERE id = OLD."userId";
    SELECT title INTO v_session_title FROM "VotingSession" WHERE id = OLD."votingSessionId";
    
    IF (v_voter_name IS NOT NULL AND v_session_title IS NOT NULL) THEN
      v_desc := 'PERINGATAN: Integritas rusak! Data suara dari pemilih ' || v_voter_name || ' pada sesi "' || v_session_title || '" telah DIHAPUS secara paksa dari database.';
    ELSE
      v_desc := 'PERINGATAN: Integritas rusak! Data suara telah DIHAPUS secara paksa dari database.';
    END IF;

  ELSIF (TG_OP = 'UPDATE') THEN
    v_type := 'DATA_UPDATED'::"ActivityType";
    
    -- Cari nama pemilih dan judul sesi voting
    SELECT "fullName" INTO v_voter_name FROM "User" WHERE id = NEW."userId";
    SELECT title INTO v_session_title FROM "VotingSession" WHERE id = NEW."votingSessionId";
    
    IF (v_voter_name IS NOT NULL AND v_session_title IS NOT NULL) THEN
      v_desc := 'PERINGATAN: Integritas rusak! Data suara dari pemilih ' || v_voter_name || ' pada sesi "' || v_session_title || '" telah DIUBAH secara paksa dari database.';
    ELSE
      v_desc := 'PERINGATAN: Integritas rusak! Data suara telah DIUBAH secara paksa dari database.';
    END IF;
  END IF;

  -- Sisipkan log peringatan ke ActivityLog
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

  -- Untuk DELETE kembalikan OLD agar operasi tetap berlanjut (trigger AFTER)
  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger: trg_vote_tampering
-- Trigger AFTER INSERT OR UPDATE OR DELETE pada tabel VoteRecord.
-- Hanya bereaksi pada UPDATE dan DELETE (INSERT adalah operasi normal via API).
DROP TRIGGER IF EXISTS trg_vote_tampering ON "VoteRecord";

CREATE TRIGGER trg_vote_tampering
AFTER UPDATE OR DELETE ON "VoteRecord"
FOR EACH ROW
EXECUTE FUNCTION detect_vote_tampering();

-- Hapus trigger audit umum (spam) pada tabel VoteRecord agar tidak menumpuk log audit yang tidak perlu
DROP TRIGGER IF EXISTS trg_audit_voterecord ON "VoteRecord";
