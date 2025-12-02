import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse params from URL or body
    const url = new URL(req.url)
    let campusId = url.searchParams.get('campusId')
    let limit = parseInt(url.searchParams.get('limit') || '24')

    // Try to get from body if POST request
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        if (body.queryString) {
          const bodyParams = new URLSearchParams(body.queryString)
          campusId = bodyParams.get('campusId') || campusId
          limit = parseInt(bodyParams.get('limit') || '24')
        }
      } catch (_e) {
        // No body or invalid JSON
      }
    }

    console.log(`Dashboard listings request - campus: ${campusId}, limit: ${limit}`)

    // Calculate split: 60% random, 40% priority
    const randomLimit = Math.ceil(limit * 0.6)
    const priorityLimit = Math.ceil(limit * 0.4)

    // Get count of all active items
    const { count } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('is_sold', false)
      .in('status', ['active', 'available'])
    
    const totalItems = count || 0
    console.log(`Total active items: ${totalItems}`)

    // Fetch random listings
    let randomItems: any[] = []
    if (totalItems > 0) {
      const randomOffset = Math.floor(Math.random() * Math.max(1, totalItems - randomLimit))
      
      const { data: randomData, error: randomError } = await supabase
        .from('items')
        .select(`
          id, title, description, price, images, category_id, seller_id,
          ad_type, status, is_sold, created_at, views, location, condition,
          is_negotiable, ad_priority,
          profiles!items_seller_id_fkey(user_id, full_name, university, trust_seller_badge),
          categories(id, name, icon)
        `)
        .eq('is_sold', false)
        .in('status', ['active', 'available'])
        .order('created_at', { ascending: false })
        .range(randomOffset, randomOffset + randomLimit - 1)
      
      if (randomError) {
        console.error('Random query error:', randomError)
      }
      
      randomItems = (randomData || []).map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        categories: Array.isArray(item.categories) ? item.categories[0] : item.categories
      }))
    }

    // Fetch priority listings (separate query)
    const { data: priorityData, error: priorityError } = await supabase
      .from('items')
      .select(`
        id, title, description, price, images, category_id, seller_id,
        ad_type, status, is_sold, created_at, views, location, condition,
        is_negotiable, ad_priority,
        profiles!items_seller_id_fkey(user_id, full_name, university, trust_seller_badge),
        categories(id, name, icon)
      `)
      .eq('is_sold', false)
      .in('status', ['active', 'available'])
      .order('ad_priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(priorityLimit)

    if (priorityError) {
      console.error('Priority query error:', priorityError)
    }

    const priorityItems = (priorityData || []).map(item => ({
      ...item,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      categories: Array.isArray(item.categories) ? item.categories[0] : item.categories
    }))

    // Combine and shuffle lightly
    const allItems = [...randomItems, ...priorityItems]
    const shuffled = allItems.sort(() => Math.random() - 0.5)

    // Remove duplicates by id
    const uniqueItems = shuffled.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    ).slice(0, limit)

    console.log(`Returning ${uniqueItems.length} dashboard listings (random: ${randomItems.length}, priority: ${priorityItems.length})`)

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
