import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

interface ListingWithProfile {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  category_id: string | null
  seller_id: string
  ad_type: string
  status: string
  is_sold: boolean
  created_at: string
  views: number
  location: string
  condition: string
  is_negotiable: boolean
  ad_priority: number
  profiles: {
    user_id: string
    full_name: string
    university: string
    trust_seller_badge: boolean
  }
  categories: {
    id: string
    name: string
    icon: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    let queryString = url.searchParams.get('queryString') || ''

    let body: any = {}
    try {
      const text = await req.text()
      if (text) {
        body = JSON.parse(text)
        if (body.queryString) {
          queryString = body.queryString
        }
      }
    } catch (e) {
      // No body
    }

    const searchParams = new URLSearchParams(queryString)
    let campusId = searchParams.get('campusId')
    let limit = parseInt(searchParams.get('limit') || '24')

    console.log(`Dashboard listings request - campus: ${campusId}, limit: ${limit}`)

    // Get user's university if authenticated
    const authHeader = req.headers.get('Authorization')
    let userUniversity = campusId

    if (authHeader && !campusId) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('university')
          .eq('user_id', user.id)
          .single()
        
        if (profile) {
          userUniversity = profile.university
        }
      }
    }

    // Build base query for active listings
    let query = supabase
      .from('items')
      .select(`
        id, title, description, price, images, category_id, seller_id,
        ad_type, status, is_sold, created_at, views, location, condition,
        is_negotiable, ad_priority,
        profiles!items_seller_id_fkey(user_id, full_name, university, trust_seller_badge),
        categories(id, name, icon)
      `)
      .eq('is_sold', false)
      .eq('status', 'active')

    // Filter by campus if available
    if (userUniversity) {
      query = query.eq('profiles.university', userUniversity)
    }

    // Calculate split: 60% random, 40% priority
    const randomLimit = Math.ceil(limit * 0.6)
    const priorityLimit = Math.ceil(limit * 0.4)

    // Fetch 60% random active listings (sample simulation via random offset)
    const { count } = await query.select('*', { count: 'exact', head: true })
    const totalItems = count || 0
    
    let randomItems: ListingWithProfile[] = []
    if (totalItems > 0) {
      const randomOffset = Math.floor(Math.random() * Math.max(1, totalItems - randomLimit))
      const { data: randomData } = await query
        .order('created_at', { ascending: false })
        .range(randomOffset, randomOffset + randomLimit - 1)
      
      randomItems = (randomData as any[])?.map(item => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        categories: Array.isArray(item.categories) ? item.categories[0] : item.categories
      })) || []
    }

    // Fetch 40% highest-priority listings
    const { data: priorityData } = await query
      .order('ad_priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(priorityLimit)

    const priorityItems: ListingWithProfile[] = (priorityData as any[])?.map(item => ({
      ...item,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      categories: Array.isArray(item.categories) ? item.categories[0] : item.categories
    })) || []

    // Combine and shuffle lightly
    const allItems = [...randomItems, ...priorityItems]
    const shuffled = allItems.sort(() => Math.random() - 0.5)

    // Remove duplicates by id
    const uniqueItems = shuffled.filter((item, index, self) =>
      index === self.findIndex((t) => t.id === item.id)
    ).slice(0, limit)

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

  } catch (error) {
    console.error('Dashboard listings error:', error)
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
