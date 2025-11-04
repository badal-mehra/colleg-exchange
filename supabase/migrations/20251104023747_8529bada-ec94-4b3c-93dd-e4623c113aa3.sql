-- Create footer_settings table for admin-managed footer content
CREATE TABLE IF NOT EXISTS public.footer_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section, key)
);

-- Enable RLS
ALTER TABLE public.footer_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active footer settings
CREATE POLICY "Anyone can view active footer settings"
ON public.footer_settings
FOR SELECT
USING (is_active = true);

-- Allow admins to manage footer settings
CREATE POLICY "Admins can manage footer settings"
ON public.footer_settings
FOR ALL
USING (is_admin(auth.uid()));

-- Insert default footer data
INSERT INTO public.footer_settings (section, key, value, link_url, sort_order) VALUES
-- About section
('about', 'description', 'MyCampusKart is a trusted student marketplace connecting verified campus members to buy, sell, and exchange items securely.', NULL, 0),

-- Quick Links
('quick_links', 'Home', 'Home', '/', 1),
('quick_links', 'About', 'About', '/about', 2),
('quick_links', 'Privacy Policy', 'Privacy Policy', '/privacy', 3),
('quick_links', 'Terms & Conditions', 'Terms & Conditions', '/terms', 4),
('quick_links', 'Refund Policy', 'Refund Policy', '/refund', 5),
('quick_links', 'Contact Us', 'Contact Us', '/contact', 6),

-- Support & Feedback
('support', 'bug_report', 'Found a bug or issue? Report here.', '/my-reports', 1),
('support', 'campus_points', 'Earn Campus Points by engaging, reporting issues, or helping others.', NULL, 2),

-- Contact
('contact', 'email', 'support@mycampuskart.com', 'mailto:support@mycampuskart.com', 1),
('contact', 'linkedin', 'LinkedIn', 'https://linkedin.com/company/mycampuskart', 2),
('contact', 'instagram', 'Instagram', 'https://instagram.com/mycampuskart', 3),

-- Copyright
('copyright', 'text', '© 2025 MyCampusKart. All rights reserved.', NULL, 0);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_footer_settings_updated_at
BEFORE UPDATE ON public.footer_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();