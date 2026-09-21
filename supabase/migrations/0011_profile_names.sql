alter table profiles add column first_name text;
alter table profiles add column last_name text;

-- Backfill from the existing display_name / auth email so nothing regresses.
update profiles set first_name = split_part(coalesce(display_name, ''), ' ', 1)
where first_name is null and display_name is not null and display_name <> '';
