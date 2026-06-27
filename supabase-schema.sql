-- Kiki/Bouba voting site — Supabase schema
-- Run this once in your Supabase project's SQL editor (Dashboard > SQL Editor > New query).

create extension if not exists pgcrypto;

create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  normalized_text text not null,
  kiki_votes integer not null default 0,
  bouba_votes integer not null default 0,
  created_at timestamptz not null default now(),
  constraint words_length check (char_length(text) between 1 and 40),
  constraint words_normalized_unique unique (normalized_text)
);

-- Keep normalized_text in sync so "Kiki", "kiki", " kiki " all collide as duplicates.
create or replace function set_normalized_text()
returns trigger as $$
begin
  new.normalized_text := lower(trim(new.text));
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_normalized_text on words;
create trigger trg_set_normalized_text
  before insert or update on words
  for each row execute function set_normalized_text();

-- Atomic, race-safe vote increment. Runs as the function owner (security definer),
-- so anonymous clients can cast votes without being granted direct UPDATE on the table —
-- that keeps vote counts safe from arbitrary REST PATCH calls.
create or replace function cast_vote(word_id uuid, vote_type text)
returns void as $$
begin
  if vote_type = 'kiki' then
    update words set kiki_votes = kiki_votes + 1 where id = word_id;
  elsif vote_type = 'bouba' then
    update words set bouba_votes = bouba_votes + 1 where id = word_id;
  else
    raise exception 'invalid vote_type: %', vote_type;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

alter table words enable row level security;

create policy "Anyone can read words"
  on words for select
  using (true);

create policy "Anyone can submit a word"
  on words for insert
  with check (true);

-- No update/delete policy for anon — direct table writes are blocked.
-- Voting only happens through cast_vote(), which is security definer.

grant execute on function cast_vote(uuid, text) to anon;

-- Enable realtime change broadcasts for the words table.
alter publication supabase_realtime add table words;

-- A few starter words so the board isn't empty.
insert into words (text) values
  ('pixel'), ('velvet'), ('zebra'), ('pogo'), ('quartz'),
  ('bamboo'), ('cosmo'), ('tulip'), ('gasket'), ('spore')
on conflict (normalized_text) do nothing;
