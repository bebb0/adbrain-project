import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { accessToken } = await req.json()
    
    if (!accessToken) {
      throw new Error('Missing access token')
    }

    // Fetch ad accounts from Meta API
    const metaResponse = await fetch(
      'https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,currency,timezone_name',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!metaResponse.ok) {
      const error = await metaResponse.json()
      throw new Error(`Meta API error: ${JSON.stringify(error)}`)
    }

    const metaAccounts = await metaResponse.json()
    console.log('Fetched accounts from Meta:', metaAccounts)

    // Transform Meta accounts to our format
    const transformedAccounts = metaAccounts.data.map((account: any) => ({
      meta_account_id: account.id.replace('act_', ''),
      name: account.name,
      currency: account.currency,
      timezone: account.timezone_name,
      updated_at: new Date().toISOString()
    }))

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user ID from the authorization header
    const authHeader = req.headers.get('authorization')?.split(' ')[1]
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Add user_id to each account record
    const accountsWithUserId = transformedAccounts.map(account => ({
      ...account,
      user_id: user.id
    }))

    // Upsert accounts in Supabase
    const { error: upsertError } = await supabaseClient
      .from('ad_accounts')
      .upsert(
        accountsWithUserId,
        { 
          onConflict: 'meta_account_id',
          ignoreDuplicates: false 
        }
      )

    if (upsertError) {
      throw upsertError
    }

    console.log(`Successfully synced ${transformedAccounts.length} ad accounts`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${transformedAccounts.length} ad accounts` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in sync-ad-accounts function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
