-- Migration to update Homies list members to be polymorphic

-- Add member_type column
ALTER TABLE homies_list_members 
ADD COLUMN IF NOT EXISTS member_type VARCHAR(50) DEFAULT 'user';

-- Drop existing unique constraint (it was implicitly created on list_id, member_id)
ALTER TABLE homies_list_members 
DROP CONSTRAINT IF EXISTS homies_list_members_list_id_member_id_key;

-- Drop foreign key to users (since member_id can now be other entities)
ALTER TABLE homies_list_members 
DROP CONSTRAINT IF EXISTS homies_list_members_member_id_fkey;

-- Add new unique constraint including member_type
ALTER TABLE homies_list_members 
ADD CONSTRAINT homies_list_members_list_id_member_id_type_key 
UNIQUE (list_id, member_id, member_type);
