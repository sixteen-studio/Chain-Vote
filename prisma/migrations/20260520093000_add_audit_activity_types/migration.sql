ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DATA_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'DATA_DELETED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BLOCKCHAIN_UPDATED';
ALTER TYPE "ActivityType" ADD VALUE IF NOT EXISTS 'BLOCKCHAIN_DELETED';

CREATE OR REPLACE FUNCTION public.audit_chainvote_data_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  row_id text;
  activity_type "ActivityType";
  operation_label text;
BEGIN
  IF current_setting('application_name', true) = 'chainvote_app' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  row_id := COALESCE(
    (to_jsonb(NEW)->>'id'),
    (to_jsonb(OLD)->>'id'),
    (to_jsonb(NEW)->>'key'),
    (to_jsonb(OLD)->>'key'),
    'unknown'
  );

  IF TG_OP = 'DELETE' THEN
    operation_label := 'delete';
  ELSIF TG_OP = 'UPDATE' THEN
    operation_label := 'update';
  ELSE
    operation_label := 'insert';
  END IF;

  IF TG_TABLE_NAME = 'ContractLog' OR TG_TABLE_NAME = 'VotingSession' THEN
    activity_type := CASE WHEN TG_OP = 'DELETE' THEN 'BLOCKCHAIN_DELETED'::"ActivityType" ELSE 'BLOCKCHAIN_UPDATED'::"ActivityType" END;
  ELSE
    activity_type := CASE WHEN TG_OP = 'DELETE' THEN 'DATA_DELETED'::"ActivityType" ELSE 'DATA_UPDATED'::"ActivityType" END;
  END IF;

  INSERT INTO "ActivityLog" ("id", "type", "description", "metadata", "createdAt")
  VALUES (
    concat('audit_', md5(random()::text || clock_timestamp()::text)),
    activity_type,
    concat('Perubahan data terdeteksi pada ', TG_TABLE_NAME, ' melalui operasi ', upper(TG_OP), '.'),
    jsonb_build_object(
      'source', 'db_trigger',
      'table', TG_TABLE_NAME,
      'operation', operation_label,
      'rowId', row_id
    ),
    now()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Semua trigger audit generik TIDAK dipasang karena menghasilkan log
-- "Perubahan data terdeteksi..." yang tidak informatif dan menampilkan
-- aksi internal admin ke pengguna.
-- Pendeteksian tampering VoteRecord ditangani secara khusus oleh
-- trg_vote_tampering (migration 20260520200000_add_tampering_triggers).
DROP TRIGGER IF EXISTS trg_audit_votingsession ON "VotingSession";
DROP TRIGGER IF EXISTS trg_audit_contractlog ON "ContractLog";
DROP TRIGGER IF EXISTS trg_audit_candidate ON "Candidate";
DROP TRIGGER IF EXISTS trg_audit_voterecord ON "VoteRecord";
DROP TRIGGER IF EXISTS trg_audit_user ON "User";
