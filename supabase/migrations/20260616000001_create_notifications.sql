CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view and update their own notifications
CREATE POLICY "Users can manage their own notifications" 
ON notifications FOR ALL USING (auth.uid()::text = user_id);

-- Enable realtime broadcasts for this table
alter publication supabase_realtime add table notifications;
