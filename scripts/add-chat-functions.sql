-- Create function to increment unread count
CREATE OR REPLACE FUNCTION increment_unread(conversation_id UUID, field TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
BEGIN
  IF field = 'customer_unread' THEN
    UPDATE conversations 
    SET customer_unread = customer_unread + 1 
    WHERE id = conversation_id
    RETURNING customer_unread INTO current_count;
  ELSIF field = 'provider_unread' THEN
    UPDATE conversations 
    SET provider_unread = provider_unread + 1 
    WHERE id = conversation_id
    RETURNING provider_unread INTO current_count;
  END IF;
  
  RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_total_unread_count(user_id UUID, user_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
BEGIN
  IF user_type = 'customer' THEN
    SELECT COALESCE(SUM(customer_unread), 0) INTO total_count
    FROM conversations 
    WHERE customer_id = user_id;
  ELSIF user_type = 'provider' THEN
    SELECT COALESCE(SUM(provider_unread), 0) INTO total_count
    FROM conversations 
    WHERE provider_id = user_id;
  END IF;
  
  RETURN total_count;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better chat performance
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_unread ON conversations(customer_id, customer_unread);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_unread ON conversations(provider_id, provider_unread);
