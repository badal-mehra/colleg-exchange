-- Create image_slidebar table for home page images
CREATE TABLE public.image_slidebar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_slidebar ENABLE ROW LEVEL SECURITY;

-- RLS policies for image_slidebar
CREATE POLICY "Anyone can view active images" 
ON public.image_slidebar 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all images" 
ON public.image_slidebar 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add university field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN university TEXT;

-- Create trigger for updated_at on image_slidebar
CREATE TRIGGER update_image_slidebar_updated_at
BEFORE UPDATE ON public.image_slidebar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default slider images
INSERT INTO public.image_slidebar (image_url, title, description, sort_order) VALUES 
('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop', 'Buy & Sell Campus Items', 'Find everything you need for college life', 1),
('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop', 'Connect with Students', 'Chat safely with verified students', 2),
('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop', 'Verified Community', 'Join thousands of verified students', 3);