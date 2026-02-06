-- =====================================================
-- BESTIE SYSTEM MIGRATION
-- Adds friendship requests, notifications, and friend counts
-- =====================================================

-- 1. EXTEND PROFILES TABLE
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS friends_count INTEGER DEFAULT 0;

-- 2. BEST FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS best_friend_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- 3. BEST FRIENDS TABLE
CREATE TABLE IF NOT EXISTS best_friends (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 4. RLS POLICIES
ALTER TABLE best_friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE best_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requests View" ON best_friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Requests Insert" ON best_friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Requests Update" ON best_friend_requests FOR UPDATE USING (auth.uid() = receiver_id);

CREATE POLICY "Friends View" ON best_friends FOR SELECT USING (true);
CREATE POLICY "Friends Manage" ON best_friends FOR ALL USING (auth.uid() = user_id);

-- 5. NOTIFICATION TYPES
-- Ensure 'bestie_request' and 'bestie_accept' are supported
-- (Assuming notifications table has a check constraint or is flexible)

-- 6. TRIGGERS & FUNCTIONS

-- Function to handle Bestie Request Notifications
CREATE OR REPLACE FUNCTION handle_bestie_request()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (user_id, actor_id, type, reference_id)
    VALUES (NEW.receiver_id, NEW.sender_id, 'tag', NEW.id); -- Using 'tag' as a placeholder or update notification types
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending') THEN
    -- Create Best Friend entries
    INSERT INTO best_friends (user_id, friend_id) VALUES (NEW.sender_id, NEW.receiver_id);
    INSERT INTO best_friends (user_id, friend_id) VALUES (NEW.receiver_id, NEW.sender_id);
    
    -- Increment friend counts
    UPDATE profiles SET friends_count = friends_count + 1 WHERE id = NEW.sender_id;
    UPDATE profiles SET friends_count = friends_count + 1 WHERE id = NEW.receiver_id;
    
    -- Notify original sender
    INSERT INTO notifications (user_id, actor_id, type, reference_id)
    VALUES (NEW.sender_id, NEW.receiver_id, 'tag', NEW.id);
    
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bestie_request_change
  AFTER INSERT OR UPDATE ON best_friend_requests
  FOR EACH ROW EXECUTE FUNCTION handle_bestie_request();

-- 7. UPDATE NOTIFICATION TYPES IN RLS OR CHECK CONSTRAINTS IF NECESSARY
-- (Skipping if notifications table type column is simple TEXT)

-- 8. GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE ON best_friend_requests TO authenticated;
GRANT SELECT, INSERT, DELETE ON best_friends TO authenticated;
