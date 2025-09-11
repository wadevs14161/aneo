-- Supabase Database Setup Script
-- Run this in Supabase SQL Editor

-- 1. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  date_of_birth date,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to bypass RLS for triggers and functions
CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 2. Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  thumbnail_url text,
  video_url text,
  cloudfront_key text, -- For private videos
  price decimal(10,2) NOT NULL DEFAULT 0,
  instructor_name text,
  instructor_bio text,
  duration_minutes integer,
  difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  is_published boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

-- 3. Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE,
  stripe_payment_intent_id text,
  amount_paid decimal(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  purchased_at timestamp DEFAULT now(),
  
  UNIQUE(user_id, course_id)
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Users can only see their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Create course access table (for granular access control)
CREATE TABLE IF NOT EXISTS course_access (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  access_type text DEFAULT 'purchased' CHECK (access_type IN ('purchased', 'gifted', 'promotional', 'admin')),
  expires_at timestamp, -- NULL for lifetime access
  granted_at timestamp DEFAULT now(),
  granted_by uuid REFERENCES profiles(id),
  
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_access ENABLE ROW LEVEL SECURITY;

-- Users can only see their own access
CREATE POLICY "Users can view own access" ON course_access
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_phone TEXT;
  user_dob DATE;
BEGIN
  -- Safely extract phone (handle null values)
  user_phone := CASE 
    WHEN NEW.raw_user_meta_data->>'phone' = 'null' OR NEW.raw_user_meta_data->>'phone' = '' 
    THEN NULL 
    ELSE NEW.raw_user_meta_data->>'phone' 
  END;
  
  -- Safely extract and convert date of birth
  user_dob := CASE 
    WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NULL 
      OR NEW.raw_user_meta_data->>'date_of_birth' = 'null' 
      OR NEW.raw_user_meta_data->>'date_of_birth' = '' 
    THEN NULL
    ELSE 
      -- Try to convert to date, fallback to NULL if invalid
      CASE 
        WHEN NEW.raw_user_meta_data->>'date_of_birth' ~ '^\d{4}-\d{2}-\d{2}$'
        THEN (NEW.raw_user_meta_data->>'date_of_birth')::date
        ELSE NULL
      END
  END;

  INSERT INTO public.profiles (id, email, full_name, phone, date_of_birth)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_phone,
    user_dob
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it with new data if provided
    UPDATE public.profiles 
    SET 
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      phone = COALESCE(user_phone, phone),
      date_of_birth = COALESCE(user_dob, date_of_birth),
      updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Insert sample courses data
INSERT INTO courses (id, title, description, category, thumbnail_url, video_url, cloudfront_key, price, instructor_name, difficulty_level) VALUES
('11111111-1111-1111-1111-111111111111', 'Karaoke for Beginners', 'Learn the fundamentals of Karaoke including song selection, microphone techniques, and stage presence. Perfect for beginners who want to start singing confidently in front of an audience.', 'Party', '/courses/thumbnail_ktv.png', 'https://d36ld0px64xgzw.cloudfront.net/karaoke.mp4', 'karaoke.mp4', 99.99, 'John Smith', 'beginner'),
('22222222-2222-2222-2222-222222222222', 'Tennis Basics', 'Learn the fundamentals of Tennis including rules, techniques, and strategies. Perfect for beginners who want to start playing confidently.', 'Sport', '/courses/thumbnail_tennis_women.png', 'https://d36ld0px64xgzw.cloudfront.net/tennis.mp4', 'tennis.mp4', 149.99, 'Sarah Johnson', 'beginner'),
('33333333-3333-3333-3333-333333333333', 'Tennis Advanced Techniques', 'Take your Tennis skills to the next level with advanced techniques and strategies.', 'Sport', '/courses/thumbnail_tennis_men.png', 'https://d36ld0px64xgzw.cloudfront.net/tennis-advanced.mp4', 'tennis-advanced.mp4', 199.99, 'Mike Chen', 'advanced'),
('44444444-4444-4444-4444-444444444444', 'Dog Training 101', 'Learn the basics of dog training including obedience, commands, and behavior modification. Perfect for new dog owners.', 'Life', '/courses/thumbnail_dog.png', 'https://d36ld0px64xgzw.cloudfront.net/dog.mp4', 'dog.mp4', 99.99, 'Emily Davis', 'beginner');

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_course_id ON purchases(course_id);
CREATE INDEX IF NOT EXISTS idx_course_access_user_id ON course_access(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);