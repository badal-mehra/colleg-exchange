-- Drop and recreate get_monthly_leaderboard function to include avatar_url and mck_id
DROP FUNCTION IF EXISTS get_monthly_leaderboard();

CREATE OR REPLACE FUNCTION get_monthly_leaderboard()
RETURNS TABLE (
    user_id uuid,
    full_name text,
    university text,
    campus_points integer,
    deals_completed integer,
    trust_seller_badge boolean,
    monthly_sales bigint,
    monthly_revenue numeric,
    avatar_url text,
    mck_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        p.user_id,
        p.full_name,
        p.university,
        p.campus_points,
        p.deals_completed,
        p.trust_seller_badge,
        COUNT(t.id) as monthly_sales,
        COALESCE(SUM(t.amount), 0) as monthly_revenue,
        p.avatar_url,
        p.mck_id
    FROM public.profiles p
    LEFT JOIN public.transactions t ON p.user_id = t.seller_id 
        AND t.created_at >= date_trunc('month', CURRENT_DATE)
        AND t.status = 'completed'
    WHERE p.verification_status = 'approved'
    GROUP BY p.user_id, p.full_name, p.university, p.campus_points, p.deals_completed, p.trust_seller_badge, p.avatar_url, p.mck_id
    ORDER BY monthly_sales DESC, monthly_revenue DESC;
$$;