-- Needed for the Google Calendar sync upsert (ON CONFLICT (google_event_id)).
-- Partial: most events have no google_event_id, and NULLs must not collide.
create unique index events_google_event_id_idx on events (google_event_id)
  where google_event_id is not null;
