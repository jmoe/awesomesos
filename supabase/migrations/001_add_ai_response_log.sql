-- Add column to store full AI response for debugging and auditing
ALTER TABLE trips 
ADD COLUMN ai_response_log JSONB;

-- Add index for querying by AI provider if needed in future
CREATE INDEX idx_trips_ai_provider ON trips ((ai_response_log->>'provider'));

-- Comment on the column
COMMENT ON COLUMN trips.ai_response_log IS 'Full AI response including provider, model, raw response, and metadata';