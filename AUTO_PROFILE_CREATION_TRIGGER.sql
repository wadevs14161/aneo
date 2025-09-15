-- AUTO PROFILE CREATION TRIGGER
-- Add this to your Supabase SQL Editor to automatically create profiles when users sign up

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'User'),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just return
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table (this may require superuser privileges)
-- If this doesn't work, we'll use a different approach
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Alternative: RLS policy that allows profile creation
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to create their own profile
CREATE POLICY "Users can create own profile" ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy for users to read their own profile  
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USE (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);