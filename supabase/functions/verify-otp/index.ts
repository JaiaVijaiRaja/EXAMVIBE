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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ERROR] Missing Supabase environment variables')
      return new Response(JSON.stringify({ error: 'Server configuration error: Missing Supabase keys' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const { email, type, otp } = body

    console.log(`[LOG] Request: ${type} for ${email}, OTP: ${!!otp}`)

    if (!email || !type) {
      return new Response(JSON.stringify({ error: 'Email and type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (otp) {
      // ==========================================
      // VERIFY OTP AND GENERATE SESSION
      // ==========================================
      console.log('[LOG] Verifying OTP in database...')
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
        console.error('[ERROR] OTP Verification Failed:', otpError)
        return new Response(JSON.stringify({ error: 'Invalid or expired OTP. Please request a new one.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Mark as verified
      await supabaseClient
        .from('otp_verifications')
        .update({ verified: true })
        .eq('id', otpData.id)

      console.log('[LOG] OTP verified. Ensuring user exists and is confirmed...')

      // Get existing user if any
      const { data: userData } = await supabaseClient.auth.admin.getUserByEmail(email)
      let user = userData?.user

      if (type === 'signup') {
        if (!user) {
          console.log('[LOG] Creating new user...')
          const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { signup_via_otp: true }
          })
          if (createError) {
            console.error('[ERROR] User Creation Error:', createError)
            return new Response(JSON.stringify({ error: `Auth Error: ${createError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
          user = newUser.user
        } else if (!user.email_confirmed_at) {
          console.log('[LOG] Confirming existing user...')
          const { error: confirmError } = await supabaseClient.auth.admin.updateUserById(user.id, {
            email_confirm: true
          })
          if (confirmError) {
            console.error('[ERROR] User Confirmation Error:', confirmError)
            return new Response(JSON.stringify({ error: `Failed to confirm user: ${confirmError.message}` }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }
        }
      } else if (type === 'reset') {
        if (!user) {
          console.error('[ERROR] User not found for reset')
          return new Response(JSON.stringify({ error: 'Account not found for this email.' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      }

      // Generate a session link
      let linkType: 'signup' | 'recovery' | 'magiclink' = type === 'signup' ? 'signup' : 'recovery'
      let actualLinkType: 'signup' | 'recovery' | 'magiclink' = linkType
      
      console.log(`[LOG] Generating link of type: ${linkType}`)
      let { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
        type: linkType,
        email: email,
      })

      // Fallback if user is already confirmed or other link issues
      if (linkError && (linkError.message.includes('already confirmed') || type === 'signup')) {
        console.log('[LOG] Signup/Recovery link failed, falling back to magiclink')
        const result = await supabaseClient.auth.admin.generateLink({
          type: 'magiclink',
          email: email,
        })
        linkData = result.data
        linkError = result.error
        actualLinkType = 'magiclink'
      }

      if (linkError || !linkData || !linkData.properties?.email_otp) {
        console.error('[ERROR] Link Generation Error:', linkError)
        return new Response(JSON.stringify({ 
          error: `Session link failed: ${linkError?.message || 'Unknown error'}. Please try logging in normally.` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Exchange token for session
      console.log(`[LOG] Exchanging token for session (Type: ${actualLinkType})...`)
      const { data: sessionData, error: sessionError } = await supabaseClient.auth.verifyOtp({
        email,
        token: linkData.properties.email_otp,
        type: actualLinkType,
      })

      if (sessionError || !sessionData.session) {
        console.error('[ERROR] Session Exchange Error:', sessionError)
        return new Response(JSON.stringify({ error: `Session creation failed: ${sessionError?.message || 'Unknown error'}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('[LOG] Session created successfully')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Verified successfully',
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
      console.log('[LOG] Generating new OTP...')
      
      const generatedOtp = Math.floor(10000000 + Math.random() * 90000000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      console.log('[LOG] Storing OTP...')
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
        console.error('[ERROR] DB Insert Error:', dbError)
        return new Response(JSON.stringify({ error: `Database error: ${dbError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const brevoApiKey = Deno.env.get('BREVO_API_KEY')
      const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
      const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'ExamVibe'

      if (!brevoApiKey) {
        console.error('[ERROR] BREVO_API_KEY is missing')
        return new Response(JSON.stringify({ error: 'Email service not configured (Missing API Key)' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!senderEmail) {
        console.error('[ERROR] BREVO_SENDER_EMAIL is missing')
        return new Response(JSON.stringify({ error: 'Email service not configured (Missing Sender Email)' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log(`[LOG] Sending Brevo email to ${email} from ${senderEmail}...`)
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email }],
          subject: 'Your ExamVibe Verification Code',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333; text-align: center;">Your Verification Code</h2>
              <p style="color: #555; font-size: 16px;">Please use the following 8-digit code to complete your ${type === 'signup' ? 'sign up' : 'password reset'} process:</p>
              <div style="background-color: #f4f6f8; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 30px 0; color: #2563eb;">
                ${generatedOtp}
              </div>
              <p style="color: #ef4444; font-weight: bold; text-align: center;">Warning: This code will expire in 10 minutes.</p>
              <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
            </div>
          `
        })
      })

      if (!brevoResponse.ok) {
        const errText = await brevoResponse.text()
        console.error('[ERROR] Brevo API Error:', errText)
        return new Response(JSON.stringify({ 
          error: `Email delivery failed. Please check if the sender email is verified in Brevo.` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('[LOG] OTP sent successfully')
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
