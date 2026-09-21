-- Vorexa Core's canonical presentation is a light canvas with a dark navy
-- sidebar (dark mode is still available as a user toggle, just no longer
-- the default for brand-new accounts). Existing users' stored preference
-- is untouched.
alter table profiles alter column theme set default 'light';
