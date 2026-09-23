-- account_members_account_user_key enforced the same uniqueness on the same
-- columns as the primary key, so every insert maintained two identical
-- indexes. The member upserts (onConflict: 'account_id, user_id') are served
-- by the primary key alone.
ALTER TABLE public.account_members DROP CONSTRAINT account_members_account_user_key;
