-- Create the otp_verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('signup', 'reset')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add an index for faster lookups during verification
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_type ON public.otp_verifications(email, type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Since this table is only accessed via the Edge Function (using the Service Role Key),
-- we don't need to create any public policies. The Service Role bypasses RLS.
