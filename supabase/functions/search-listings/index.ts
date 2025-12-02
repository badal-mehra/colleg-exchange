import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SearchParams {
  query?: string
  categoryId?: string
  campusId?: string
  minPrice?: number
  maxPrice?: number
  condition?: string
  limit: number
  offset: number
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
    let searchParams = url.searchParams

    // Try to get from body if POST request
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        if (body.queryString) {
          searchParams = new URLSearchParams(body.queryString)
        }
      } catch (_e) {
        // No body or invalid JSON
      }
    }

    const params: SearchParams = {
      query: searchParams.get('query') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      campusId: searchParams.get('campusId') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      condition: searchParams.get('condition') || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    }

    console.log('Search request:', params)

    // Priority scoring: urgent = 100, featured = 60, premium = 30, basic = 0
    const priorityScores: Record<string, number> = {
      urgent: 100,
      featured: 60,
      premium: 30,
      basic: 0
    }

    // Build query
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
      .in('status', ['active', 'available'])

    // Apply filters
    if (params.categoryId) {
      query = query.eq('category_id', params.categoryId)
    }

    if (params.minPrice !== undefined) {
      query = query.gte('price', params.minPrice)
    }

    if (params.maxPrice !== undefined) {
      query = query.lte('price', params.maxPrice)
    }

    if (params.condition) {
      query = query.eq('condition', params.condition)
    }

    // Text search
    if (params.query && params.query.trim()) {
      const searchTerm = params.query.trim()
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    // Fetch all matching items first
    const { data: rawItems, error } = await query

    if (error) {
      console.error('Search error:', error)
      throw error
    }

    // Calculate final score for each item and sort
    const scoredItems = (rawItems as any[])?.map(item => {
      const adType = (item.ad_type || 'basic').toLowerCase()
      const priorityScore = priorityScores[adType] || 0
      
      // Text relevance score (simple: count matches in title/description)
      let textRelevance = 0
      if (params.query && params.query.trim()) {
        const searchLower = params.query.toLowerCase()
        const titleLower = (item.title || '').toLowerCase()
        const descLower = (item.description || '').toLowerCase()
        
        if (titleLower.includes(searchLower)) textRelevance += 20
        if (descLower.includes(searchLower)) textRelevance += 10
      }

      // Recency score (newer = higher, max 20 points)
      const daysSinceCreation = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24)
      const recencyScore = Math.max(0, 20 - daysSinceCreation)

      // Final score
      const finalScore = priorityScore + textRelevance + recencyScore

      return {
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        categories: Array.isArray(item.categories) ? item.categories[0] : item.categories,
        _score: finalScore
      }
    }) || []

    // Sort by final score descending
    scoredItems.sort((a, b) => b._score - a._score)

    // Apply pagination
    const offset = params.offset || 0
    const paginatedItems = scoredItems.slice(offset, offset + params.limit)

    // Remove score from response
    const cleanedItems = paginatedItems.map(({ _score, ...item }) => item)

    console.log(`Returning ${cleanedItems.length} search results from ${scoredItems.length} total matches`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: cleanedItems,
        total: scoredItems.length,
        count: cleanedItems.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: unknown) {
    console.error('Search error:', error)
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
