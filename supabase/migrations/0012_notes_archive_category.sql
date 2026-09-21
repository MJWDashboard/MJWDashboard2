alter table notes add column archived boolean not null default false;
alter table notes add column category text not null default 'note'
  check (category in ('note', 'recipe', 'song', 'message', 'idea'));
