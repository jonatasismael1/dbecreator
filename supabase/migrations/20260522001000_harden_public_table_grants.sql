-- DBE Creator - Harden public table grants
-- RLS protects row-level access, but TRUNCATE/REFERENCES/TRIGGER/MAINTAIN are not needed
-- by browser roles and should not be available on exposed public tables.

revoke all privileges on all tables in schema public from anon;
revoke truncate, references, trigger, maintain on all tables in schema public from authenticated;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke truncate, references, trigger, maintain on tables from authenticated;
