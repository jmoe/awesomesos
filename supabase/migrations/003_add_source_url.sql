-- Add source_url column to trips table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add index for source_url for potential future analytics
CREATE INDEX IF NOT EXISTS idx_trips_source_url ON trips(source_url);