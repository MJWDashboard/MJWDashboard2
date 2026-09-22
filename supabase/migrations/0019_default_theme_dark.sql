-- Reverting 0018: the navy dark theme reads as the more premium, on-brand
-- default (direct user feedback on the light canvas) — dark goes back to
-- being the default for brand-new accounts. Existing users' stored
-- preference is untouched either way.
alter table profiles alter column theme set default 'dark';
