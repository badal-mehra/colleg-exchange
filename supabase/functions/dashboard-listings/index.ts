import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json().catch(() => ({}))
    const qs = body.queryString || ''
    const params = Object.fromEntries(new URLSearchParams(qs))

    let campusId = params.campusId as string | undefined
    let limit = parseInt((params.limit as string) || '24')

    if (campusId === 'undefined' || campusId === 'null' || !campusId) {
      campusId = undefined
    }

    console.log(`Dashboard listings request - campus: ${campusId}, limit: ${limit}`)

    let baseQuery = supabase
      .from('items')
      .select(`
        id, title, description, price, images, category_id, seller_id,
        ad_type, status, is_sold, created_at, views, location, condition,
        is_negotiable, ad_priority,
        profiles!items_seller_id_fkey(user_id, full_name, university, trust_seller_badge),
        categories(id, name, icon)
      `)
      .in('status', ['active', 'available'])
      .eq('is_sold', false)

    if (campusId) {
      baseQuery = baseQuery.eq('profiles.university', campusId)
    }

    const { data: allItems, error } = await baseQuery
      .order('ad_priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Dashboard query error:', error)
      throw error
    }

    const items = (allItems || []).map(item => ({
      ...item,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      categories: Array.isArray(item.categories) ? item.categories[0] : item.categories
    }))

    const uniqueItems = items.slice(0, limit)

    console.log(`Returning ${uniqueItems.length} dashboard listings`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: uniqueItems,
        count: uniqueItems.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: unknown) {
    console.error('Dashboard listings error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
