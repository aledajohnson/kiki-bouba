# Kiki or Bouba?

A live, persistent voting board for the [kiki-bouba effect](https://en.wikipedia.org/wiki/Bouba/kiki_effect) — visitors submit words and vote on whether each one feels more "kiki" (sharp) or "bouba" (round). No build step: plain HTML/CSS/JS + Supabase, deployed on GitHub Pages.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor** > New query, paste in the contents of [`supabase-schema.sql`](supabase-schema.sql), and run it. This creates the `words` table, the vote-counting function, RLS policies, and enables realtime on the table.
3. Go to **Settings > API** and copy your **Project URL** and **anon public key**.

## 2. Configure the site

Edit [`config.js`](config.js) and paste in your values:

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxxxxxx.supabase.co",
  anonKey: "eyJ...",
};
```

The anon key is meant to be public — it only allows what the RLS policies in the schema permit (read all words, insert new words, vote only through the `cast_vote` function).

## 3. Try it locally

Open `index.html` directly in a browser, or serve the folder with any static server, e.g.:

```sh
npx serve .
```

## 4. Deploy to GitHub Pages

1. Push this folder to a GitHub repo (as the repo root).
2. In the repo, go to **Settings > Pages**, set **Source** to **Deploy from a branch**, and pick branch `main`, folder `/ (root)`.
3. GitHub builds and serves the site at `https://<username>.github.io/<repo>/`. Check the **Actions** tab (Pages uses a built-in `pages-build-deployment` workflow) for progress.

Every subsequent push to `main` redeploys automatically — no workflow file needed since this is a plain static site with no build step. No environment variables needed either, since the Supabase anon key is meant to ship in the client bundle — just make sure `config.js` has your real values committed before pushing.

## How voting works

- Each word has a `kiki_votes` and `bouba_votes` counter in Supabase.
- Votes are cast via the `cast_vote` Postgres function (atomic increment, avoids race conditions on concurrent votes).
- The board subscribes to Supabase Realtime changes on the `words` table, so every connected visitor sees vote counts and new word submissions update live, with no refresh.
- Each browser remembers (via `localStorage`) which words it already voted on and disables those buttons — this discourages accidental double-voting but isn't a hard security boundary (anyone can clear their storage or use another browser).

## Customizing

- Starter words live at the bottom of `supabase-schema.sql`.
- Colors/theme are in `style.css` (`--kiki` and `--bouba` CSS variables).
- Max word length is 40 characters, enforced both client-side (`app.js`) and in the database (`words_length` constraint).
