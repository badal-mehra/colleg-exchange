# Listings System Documentation

## Overview
This document describes the new listings system implementation with randomized dashboard feed and priority-ranked search functionality.

## Architecture

### Edge Functions

#### 1. **dashboard-listings** (`/functions/v1/dashboard-listings`)
- **Purpose**: Returns a mixed, randomized feed for the dashboard/home page
- **Method**: GET
- **Authentication**: Optional (public access enabled)

**Query Parameters:**
- `campusId` (optional): Filter by university/campus
- `limit` (optional, default: 24): Number of items to return

**Algorithm:**
1. **60% Random Listings**: Fetches active listings with random sampling
2. **40% Priority Listings**: Fetches highest-priority listings sorted by:
   - `ad_priority` (urgent > featured > premium > basic)
   - `created_at` (newer items first)
3. Combines both sets and shuffles lightly for fresh feed
4. Removes duplicates and returns up to `limit` items

**Response:**
```json
{
  "success": true,
  "data": [...items with profiles and categories],
  "count": 24
}
```

#### 2. **search-listings** (`/functions/v1/search-listings`)
- **Purpose**: Returns priority-ranked search results (NOT randomized)
- **Method**: GET
- **Authentication**: Optional (public access enabled)

**Query Parameters:**
- `query` (optional): Text search term (searches title, description, tags)
- `categoryId` (optional): Filter by category UUID
- `campusId` (optional): Filter by university/campus
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `condition` (optional): Item condition filter
- `limit` (optional, default: 50): Number of items to return
- `offset` (optional, default: 0): Pagination offset

**Ranking Formula:**
```
finalScore = priorityScore + textRelevance + recencyScore

Where:
- priorityScore: urgent=100, featured=60, premium=30, basic=0
- textRelevance: title match=20, description match=10
- recencyScore: max 20 points, decreases with age
```

**Response:**
```json
{
  "success": true,
  "data": [...sorted items],
  "total": 150,
  "count": 50
}
```

## Database Schema

### Items Table Fields
Required fields for the listings system:

```sql
- id (uuid)
- title (text)
- description (text)
- price (numeric)
- images (text[])
- category_id (uuid, nullable)
- seller_id (uuid)
- ad_type (text) -- 'urgent' | 'featured' | 'premium' | 'basic'
- ad_priority (integer) -- Numerical priority for sorting
- status (text) -- 'active' | 'sold' | 'removed'
- is_sold (boolean)
- created_at (timestamp)
- views (integer)
- location (text)
- condition (text)
- is_negotiable (boolean)
- tags (text[])
```

### Profiles Table (Join)
```sql
- user_id (uuid)
- full_name (text)
- university (text) -- Used for campus filtering
- trust_seller_badge (boolean)
```

### Categories Table (Join)
```sql
- id (uuid)
- name (text)
- icon (text)
```

## Frontend Implementation

### Dashboard (Home Page)
**Location**: `src/pages/Dashboard.tsx`

**Behavior**:
- Uses `dashboard-listings` endpoint for main feed
- Shows randomized mix of 60% random + 40% priority listings
- Automatically filters by user's campus/university
- Displays listing type badges (Urgent, Featured, Premium)
- Does NOT apply when filters are active (then switches to search)

**When Filters Applied**:
- Switches to `search-listings` endpoint
- Uses priority ranking instead of randomization
- Maintains strict ranking by priority and relevance

### Search Page
**Location**: `src/pages/Search.tsx`

**Features**:
- Dedicated search interface with filters
- Always uses priority-ranked results
- Supports text search, category, and price filters
- Shows total result count
- Clean grid layout with listing badges
- Direct navigation to item details

**Route**: `/search`

### Item Cards

**Badge Display**:
```typescript
// Urgent listings
<Badge className="bg-red-600 text-white">
  <Zap /> Urgent
</Badge>

// Featured listings  
<Badge className="bg-yellow-500 text-white">
  <Star /> Featured
</Badge>

// Premium listings
<Badge className="bg-purple-600 text-white">
  <Crown /> Premium
</Badge>

// Basic listings: No badge shown
```

## API Usage Examples

### Dashboard Feed
```typescript
const fetchDashboard = async () => {
  const params = new URLSearchParams({
    limit: '24',
    campusId: userUniversity
  });
  
  const url = `${SUPABASE_URL}/functions/v1/dashboard-listings?${params}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY
    }
  });
  
  const result = await response.json();
  return result.data;
};
```

### Search
```typescript
const searchListings = async (query: string, categoryId?: string) => {
  const params = new URLSearchParams({
    query,
    limit: '50'
  });
  
  if (categoryId) params.append('categoryId', categoryId);
  
  const url = `${SUPABASE_URL}/functions/v1/search-listings?${params}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': SUPABASE_ANON_KEY
    }
  });
  
  const result = await response.json();
  return {
    items: result.data,
    total: result.total
  };
};
```

## Key Constraints

1. **Only Active Listings Visible**
   - `is_sold = false`
   - `status = 'active'`

2. **Campus Filtering**
   - Joins with profiles table to filter by university
   - Automatically applies user's campus when authenticated

3. **No Mixing of My Listings**
   - Dashboard and Search exclude user's own listings
   - Separate "My Listings" page for user's items

4. **Clean Code**
   - Maintainable, well-documented functions
   - Type-safe with TypeScript interfaces
   - Error handling and logging

## Priority Levels

| Ad Type  | Priority Score | Sort Order | Features                          |
|----------|----------------|------------|-----------------------------------|
| Urgent   | 100            | 1st        | Flash indicator, 48hr highlight   |
| Featured | 60             | 2nd        | Top placement, 3x visibility      |
| Premium  | 30             | 3rd        | Priority listing, boost button    |
| Basic    | 0              | 4th        | Standard listing                  |

## Testing

### Dashboard Feed Test
1. Navigate to `/dashboard`
2. Verify mixed listing types appear
3. Refresh multiple times - order should change (randomized)
4. Check that urgent/featured items appear frequently

### Search Test
1. Navigate to `/search`
2. Enter search query
3. Verify results are sorted by priority (urgent first)
4. Same search should always return same order
5. Apply filters - verify proper filtering

### Badge Display Test
1. Check that urgent listings show red badge with lightning icon
2. Featured listings show yellow badge with star icon
3. Premium listings show purple badge with crown icon
4. Basic listings show no badge

## Performance Considerations

1. **Pagination**: Both endpoints support limit/offset
2. **Caching**: Consider implementing cache for dashboard feed
3. **Index Requirements**:
   - `items(ad_priority DESC, created_at DESC)`
   - `items(status, is_sold)`
   - `profiles(university)`

## Future Enhancements

- [ ] Add geo-location based sorting
- [ ] Implement user preference learning
- [ ] Add trending items section
- [ ] Support saved searches
- [ ] Add price drop notifications
- [ ] Implement view-based ranking adjustments
