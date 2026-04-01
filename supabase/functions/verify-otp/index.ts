import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export default async function handler(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with the Service Role key to bypass RLS for the OTP table
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, type, otp } = await req.json()

    if (!email || !type) {
      return new Response(JSON.stringify({ error: 'Email and type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (otp) {
      // ==========================================
      // VERIFY OTP
      // ==========================================
      const { data: otpData, error: otpError } = await supabaseClient
        .from('otp_verifications')
        .select('*')
        .eq('email', email)
        .eq('type', type)
        .eq('otp', otp)
        .eq('verified', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (otpError || !otpData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Mark as verified
      await supabaseClient
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', otpData.id)

      // Generate a login session for the user
      // If it's a signup, we might need to create the user first if they don't exist
      if (type === 'signup') {
        const { data: user, error: userError } = await supabaseClient.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: { signup_via_otp: true }
        })
        if (userError && !userError.message.includes('already registered')) {
          console.error('User Creation Error:', userError)
          return new Response(JSON.stringify({ error: 'Failed to create user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } else if (type === 'reset') {
        // For reset, verify user exists
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserByEmail(email)
        if (userError || !userData.user) {
          return new Response(JSON.stringify({ error: 'User not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      // Generate a recovery or signup link to get a session
      const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
        type: type === 'signup' ? 'signup' : 'recovery',
        email: email,
      })

      if (linkError || !linkData) {
        console.error('Link Generation Error:', linkError)
        return new Response(JSON.stringify({ error: 'Failed to generate session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // The link contains a hashed token. We can use verifyOtp to get a session
      // Wait, verifyOtp with type='recovery' or 'signup' works!
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.verifyOtp({
        email,
        token: linkData.hashed_token,
        type: type === 'signup' ? 'signup' : 'recovery',
      })

      if (sessionError || !sessionData.session) {
        console.error('Session Error:', sessionError)
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        session: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
          user: sessionData.session.user
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } else {
      // ==========================================
      // GENERATE AND SEND OTP
      // ==========================================
      
      // Generate 8-digit OTP
      const generatedOtp = Math.floor(10000000 + Math.random() * 90000000).toString()
      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      // Store OTP in database
      const { error: dbError } = await supabaseClient
        .from('otp_verifications')
        .insert({
          email,
          otp: generatedOtp,
          type,
          expires_at: expiresAt,
          verified: false
        })

      if (dbError) {
        console.error('Database Error:', dbError)
        throw new Error('Failed to store OTP')
      }

      // Send email via Brevo API
      const brevoApiKey = Deno.env.get('BREVO_API_KEY')
      if (!brevoApiKey) {
        throw new Error('BREVO_API_KEY is not set')
      }

      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify({
          sender: { name: 'ExamVibe', email: 'noreply@examvibe.com' },
          to: [{ email }],
          subject: 'Your ExamVibe Verification Code',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333; text-align: center;">Your Verification Code</h2>
              <p style="color: #555; font-size: 16px;">Please use the following 8-digit code to complete your ${type === 'signup' ? 'sign up' : 'password reset'} process:</p>
              <div style="background-color: #f4f6f8; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 30px 0; color: #2563eb;">
                ${generatedOtp}
              </div>
              <p style="color: #ef4444; font-weight: bold; text-align: center;">Warning: This code will expire in 5 minutes.</p>
              <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
            </div>
          `
        })
      })

      if (!brevoResponse.ok) {
        const errText = await brevoResponse.text()
        console.error('Brevo API Error:', errText)
        throw new Error('Failed to send email')
      }

      return new Response(JSON.stringify({ success: true, message: 'OTP sent successfully' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

// Serve the handler
Deno.serve(handler)
