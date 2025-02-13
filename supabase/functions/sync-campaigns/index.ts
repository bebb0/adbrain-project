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
    const { adAccountId, accessToken } = await req.json()
    
    if (!adAccountId || !accessToken) {
      throw new Error('Missing required parameters')
    }

    // Fetch campaigns from Meta API
    const metaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,status,daily_budget,start_time,end_time,objective`,
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

    const metaCampaigns = await metaResponse.json()
    console.log('Fetched campaigns from Meta:', metaCampaigns)

    // Transform Meta campaigns to our format
    const transformedCampaigns = metaCampaigns.data.map((campaign: any) => ({
      meta_campaign_id: campaign.id,
      name: campaign.name,
      status: campaign.status === 'ACTIVE' ? 'ACTIVE' : 
             campaign.status === 'PAUSED' ? 'PAUSED' : 'ARCHIVED',
      daily_budget: campaign.daily_budget ? Number(campaign.daily_budget) / 100 : null, // Convert from cents
      start_date: campaign.start_time,
      end_date: campaign.end_time,
      objective: campaign.objective,
      ad_account_id: adAccountId,
      updated_at: new Date().toISOString()
    }))

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upsert campaigns in Supabase
    const { error: upsertError } = await supabaseClient
      .from('campaigns')
      .upsert(
        transformedCampaigns,
        { 
          onConflict: 'meta_campaign_id',
          ignoreDuplicates: false 
        }
      )

    if (upsertError) {
      throw upsertError
    }

    console.log(`Successfully synced ${transformedCampaigns.length} campaigns`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully synced ${transformedCampaigns.length} campaigns` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in sync-campaigns function:', error)
    
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
