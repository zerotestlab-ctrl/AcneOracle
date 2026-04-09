-- Acne Oracle - Supabase Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- PROFILES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    age INTEGER,
    gender TEXT,
    skin_type TEXT,
    skin_concerns TEXT[] DEFAULT '{}',
    goals TEXT[] DEFAULT '{}',
    lifestyle TEXT[] DEFAULT '{}',
    current_products TEXT[] DEFAULT '{}',
    custom_products TEXT,
    monthly_spending DECIMAL(10,2) DEFAULT 0,
    monthly_spending_range TEXT,
    oracle_profile_summary TEXT,
    oracle_motivational_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- DAILY LOGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    acne_score INTEGER CHECK (acne_score >= 0 AND acne_score <= 100),
    morning_routine_completed TEXT[] DEFAULT '{}',
    evening_routine_completed TEXT[] DEFAULT '{}',
    products_used TEXT[] DEFAULT '{}',
    diet TEXT,
    water_intake INTEGER,
    sleep_hours INTEGER,
    stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own daily logs" ON public.daily_logs
    FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PHOTOS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    captured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own photos" ON public.photos
    FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ANALYSES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    acne_score INTEGER DEFAULT 50,
    severity TEXT DEFAULT 'mild',
    inflammation_level INTEGER DEFAULT 5,
    progress_percent INTEGER DEFAULT 0,
    detected_issues TEXT[] DEFAULT '{}',
    ai_summary TEXT DEFAULT '',
    recommendations TEXT DEFAULT '',
    raw_analysis JSONB DEFAULT '{}',
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analyses" ON public.analyses
    FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- CHAT MESSAGES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id TEXT NOT NULL DEFAULT 'main',
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat messages" ON public.chat_messages
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS chat_messages_user_session_idx
    ON public.chat_messages(user_id, session_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROUTINES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    morning_steps JSONB DEFAULT '[]',
    evening_steps JSONB DEFAULT '[]',
    custom_notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own routines" ON public.routines
    FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKET (run in Supabase Dashboard > Storage)
-- ─────────────────────────────────────────────────────────────────────────────
-- Create a bucket named 'user-photos' with public access:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-photos', 'user-photos', true);
--
-- Add storage RLS policies:
-- CREATE POLICY "Users can upload own photos" ON storage.objects
--     FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Photos are publicly accessible" ON storage.objects
--     FOR SELECT USING (bucket_id = 'user-photos');
-- CREATE POLICY "Users can delete own photos" ON storage.objects
--     FOR DELETE USING (auth.uid()::text = (storage.foldername(name))[1]);
