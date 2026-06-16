CREATE TABLE profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text UNIQUE NOT NULL, -- Clerk User ID
  name text,
  avatar_url text,
  course text,
  semester int,
  bio text,
  is_public boolean DEFAULT true,
  notifications_email boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  deleted_at timestamp -- Soft delete implementation
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Only show public profiles that are not soft-deleted, or the user's own profile even if soft-deleted (for recovery maybe)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (
  (is_public = true AND deleted_at IS NULL) OR auth.uid()::text = user_id
);

-- Users can update their own profile, if not soft-deleted
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid()::text = user_id AND deleted_at IS NULL);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Soft delete policy logic can be handled by API layer with service role, 
-- or we can allow users to update their own deleted_at.
