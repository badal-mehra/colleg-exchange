-- Fix security issue: Remove SECURITY DEFINER view and create function instead
DROP VIEW IF EXISTS public.monthly_leaderboard;

-- Create function to get leaderboard data safely
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    university TEXT,
    campus_points INTEGER,
    deals_completed INTEGER,
    trust_seller_badge BOOLEAN,
    monthly_sales BIGINT,
    monthly_revenue NUMERIC
)
LANGUAGE sql
STABLE
SECURITY INVOKER
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
        COALESCE(SUM(t.amount), 0) as monthly_revenue
    FROM public.profiles p
    LEFT JOIN public.transactions t ON p.user_id = t.seller_id 
        AND t.created_at >= date_trunc('month', CURRENT_DATE)
        AND t.status = 'completed'
    WHERE p.verification_status = 'approved'
    GROUP BY p.user_id, p.full_name, p.university, p.campus_points, p.deals_completed, p.trust_seller_badge
    ORDER BY monthly_sales DESC, monthly_revenue DESC;
$$;