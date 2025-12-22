
-- Fix missing created_by in conversations
UPDATE conversations c
SET created_by = (
    SELECT user_id 
    FROM conversation_participants 
    WHERE conversation_id = c.id 
    ORDER BY joined_at ASC 
    LIMIT 1
)
WHERE conversation_type = 'group' AND created_by IS NULL;

-- Ensure creators are admins in conversation_participants
UPDATE conversation_participants cp
SET role = 'admin'
FROM conversations c
WHERE cp.conversation_id = c.id 
  AND c.conversation_type = 'group' 
  AND cp.user_id = c.created_by
  AND cp.role = 'member';

-- If a group has NO admins at all, make the oldest participant an admin
UPDATE conversation_participants cp
SET role = 'admin'
WHERE id IN (
    SELECT cp2.id
    FROM conversation_participants cp2
    JOIN conversations c2 ON cp2.conversation_id = c2.id
    WHERE c2.conversation_type = 'group'
    AND NOT EXISTS (
        SELECT 1 FROM conversation_participants cp3
        WHERE cp3.conversation_id = c2.id AND cp3.role = 'admin'
    )
    AND cp2.id = (
        SELECT cp4.id 
        FROM conversation_participants cp4 
        WHERE cp4.conversation_id = c2.id 
        ORDER BY joined_at ASC 
        LIMIT 1
    )
);
