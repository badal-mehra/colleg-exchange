-- Add new fields to profiles table for enhanced user information
ALTER TABLE public.profiles ADD COLUMN batch TEXT;
ALTER TABLE public.profiles ADD COLUMN course TEXT;
ALTER TABLE public.profiles ADD COLUMN hostel TEXT;
ALTER TABLE public.profiles ADD COLUMN campus_points INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN deals_completed INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN trust_seller_badge BOOLEAN DEFAULT FALSE;

-- Create universities table for admin management
CREATE TABLE public.universities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    location TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on universities table
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Create policies for universities
CREATE POLICY "Anyone can view active universities" 
ON public.universities 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage universities" 
ON public.universities 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default university
INSERT INTO public.universities (name, code, location) 
VALUES ('Lovely Professional University', 'LPU', 'Punjab, India');

-- Create transactions table to track deals and points
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    item_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    points_awarded INTEGER DEFAULT 10,
    transaction_type TEXT DEFAULT 'sale',
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create leaderboard view for top sellers
CREATE OR REPLACE VIEW public.monthly_leaderboard AS
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

-- Create function to update user stats after transaction
CREATE OR REPLACE FUNCTION public.update_user_stats_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update seller stats
    UPDATE public.profiles 
    SET 
        deals_completed = deals_completed + 1,
        campus_points = campus_points + NEW.points_awarded,
        trust_seller_badge = CASE 
            WHEN (deals_completed + 1) >= 7 THEN TRUE 
            ELSE trust_seller_badge 
        END
    WHERE user_id = NEW.seller_id;
    
    -- Update buyer points
    UPDATE public.profiles 
    SET campus_points = campus_points + (NEW.points_awarded / 2)
    WHERE user_id = NEW.buyer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for transaction stats update
CREATE TRIGGER update_stats_after_transaction
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_stats_after_transaction();

-- Create trigger for updated_at on universities
CREATE TRIGGER update_universities_updated_at
    BEFORE UPDATE ON public.universities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint for university reference (optional, for data integrity)
-- ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_university 
-- FOREIGN KEY (university) REFERENCES public.universities(name) ON UPDATE CASCADE;