-- Validates a username/password combination against the hashed password
-- stored in the users table. Returns the basic profile and only succeeds
-- when bcrypt verification passes.
create or replace function public.validate_user_password(
  p_username text,
  p_password text
)
returns table (
  id bigint,
  created_at timestamptz,
  name text,
  username text,
  email text,
  admin boolean
)
language sql
security definer
set search_path = public, extensions
as $$
  select id, created_at, name, username, email, admin
  from users
  where username = p_username
    and password = crypt(p_password, password)
  limit 1;
$$;

grant execute on function public.validate_user_password(text, text) to anon, authenticated;
