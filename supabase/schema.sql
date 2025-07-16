-- Create trips table for MVP
CREATE TABLE trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id VARCHAR(12) UNIQUE NOT NULL,
  trip_description TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  emergency_contact TEXT,
  
  -- Generated content
  safety_info JSONB,
  trip_data JSONB, -- Parsed trip details from AI
  ai_response_log JSONB, -- Full AI response for debugging/auditing
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Create index for share_id lookups
CREATE INDEX idx_trips_share_id ON trips(share_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read trips (for sharing)
CREATE POLICY "Trips are viewable by anyone" ON trips
  FOR SELECT USING (true);

-- Only allow inserts through the API (no auth required for MVP)
CREATE POLICY "Anyone can create trips" ON trips
  FOR INSERT WITH CHECK (true);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_trip_views(trip_share_id VARCHAR)
RETURNS void AS $$
BEGIN
  UPDATE trips 
  SET view_count = view_count + 1 
  WHERE share_id = trip_share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;