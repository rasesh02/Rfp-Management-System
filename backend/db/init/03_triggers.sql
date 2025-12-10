-- 03_triggers.sql
-- trigger to auto-update updated_at on rfps table
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON rfps;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON rfps
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
