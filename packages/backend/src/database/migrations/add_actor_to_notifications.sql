-- Add actor and entity tracking to notifications
ALTER TABLE notifications 
ADD COLUMN actor_id UUID REFERENCES users(id),
ADD COLUMN entity_id UUID,
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Index for performance
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX idx_notifications_entity_id ON notifications(entity_id);
