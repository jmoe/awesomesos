-- Add ai_response_log column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'trips' 
        AND column_name = 'ai_response_log'
    ) THEN
        ALTER TABLE trips 
        ADD COLUMN ai_response_log JSONB;
        
        -- Add index for querying by AI provider
        CREATE INDEX IF NOT EXISTS idx_trips_ai_provider 
        ON trips ((ai_response_log->>'provider'));
        
        -- Comment on the column
        COMMENT ON COLUMN trips.ai_response_log IS 'Full AI response including provider, model, raw response, and metadata';
    END IF;
END $$;