# iqac-web

A web app for the IQAC of Jyothi Engineering College to streamline the internal exam question paper process.

## Supabase setup

1. Fill in `SUPABASE_DATABASE_URL` in [.env](.env) with the database connection string from Supabase.
2. Run `npm run supabase:setup` to create the `users` and `uploads` tables automatically from [supabase/schema.sql](supabase/schema.sql).
3. Create a storage bucket that matches `VITE_SUPABASE_STORAGE_BUCKET` in [.env](.env).
4. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in [.env](.env).
5. If email confirmation is enabled, the register page will create the Supabase Auth user and the `auth.users` trigger in the schema will populate `public.users` automatically.
