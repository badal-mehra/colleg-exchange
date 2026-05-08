
-- ========== BLOG ECOSYSTEM ==========

CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  avatar_url text,
  bio text,
  role text,
  twitter text,
  linkedin text,
  website text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  author_id uuid REFERENCES public.blog_authors(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft', -- draft | scheduled | published
  published_at timestamptz,
  scheduled_at timestamptz,
  reading_time integer DEFAULT 5,
  views integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  seo_title text,
  seo_description text,
  og_image text,
  canonical_url text,
  faq jsonb DEFAULT '[]'::jsonb,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category_id);

CREATE TABLE public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.campus_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  city text,
  hero_image text,
  intro text,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_title text,
  seo_description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_campus_pages_updated_at
  BEFORE UPDATE ON public.campus_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== RLS ==========
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Public read for taxonomy/authors
CREATE POLICY "Public read categories" ON public.blog_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.blog_categories FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public read tags" ON public.blog_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage tags" ON public.blog_tags FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public read authors" ON public.blog_authors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage authors" ON public.blog_authors FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Posts: public can read only published; admins manage
CREATE POLICY "Public read published posts" ON public.blog_posts FOR SELECT TO anon, authenticated
  USING (status = 'published' AND published_at <= now());
CREATE POLICY "Admins read all posts" ON public.blog_posts FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public read post tags" ON public.blog_post_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage post tags" ON public.blog_post_tags FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Comments: public read approved; auth users can insert pending; admins manage
CREATE POLICY "Public read approved comments" ON public.blog_comments FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Authenticated can insert comments" ON public.blog_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage comments" ON public.blog_comments FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Public read active campus pages" ON public.campus_pages FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage campus pages" ON public.campus_pages FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Anyone can subscribe newsletter" ON public.newsletter_subscribers FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read newsletter" ON public.newsletter_subscribers FOR SELECT USING (is_admin(auth.uid()));

-- ========== RPCs ==========
CREATE OR REPLACE FUNCTION public.increment_blog_view(p_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.blog_posts SET views = views + 1 WHERE slug = p_slug AND status = 'published';
END;
$$;

-- ========== SEED ==========
INSERT INTO public.blog_categories (name, slug, description, icon, sort_order) VALUES
  ('Student Life', 'student-life', 'Tips and stories from college life', '🎓', 1),
  ('Hostel & PG', 'hostel-pg', 'Everything about hostel and PG living', '🏠', 2),
  ('Buying Guides', 'buying-guides', 'Smart guides for second-hand purchases', '🛒', 3),
  ('Money & Savings', 'money-savings', 'Save more, spend smart as a student', '💰', 4),
  ('Tech & Gadgets', 'tech-gadgets', 'Best gadgets for students', '💻', 5),
  ('Campus News', 'campus-news', 'Updates from campuses across India', '📰', 6);

INSERT INTO public.blog_tags (name, slug) VALUES
  ('engineering','engineering'),('hostel','hostel'),('freshers','freshers'),
  ('budget','budget'),('electronics','electronics'),('seniors','seniors'),
  ('savings','savings'),('gadgets','gadgets'),('safety','safety'),
  ('checklist','checklist'),('calculators','calculators'),('marketplace','marketplace');

INSERT INTO public.blog_authors (name, slug, avatar_url, bio, role) VALUES
  ('MyCampusKart Team', 'mycampuskart-team',
   'https://api.dicebear.com/7.x/initials/svg?seed=MCK&backgroundColor=6366f1',
   'The official team behind MyCampusKart — helping students buy, sell and save smarter on campus.',
   'Editorial Team');

-- Seed posts
DO $$
DECLARE
  v_author uuid;
  v_cat_buy uuid; v_cat_hostel uuid; v_cat_money uuid; v_cat_tech uuid; v_cat_life uuid;
  v_post uuid;
BEGIN
  SELECT id INTO v_author FROM public.blog_authors WHERE slug='mycampuskart-team';
  SELECT id INTO v_cat_buy FROM public.blog_categories WHERE slug='buying-guides';
  SELECT id INTO v_cat_hostel FROM public.blog_categories WHERE slug='hostel-pg';
  SELECT id INTO v_cat_money FROM public.blog_categories WHERE slug='money-savings';
  SELECT id INTO v_cat_tech FROM public.blog_categories WHERE slug='tech-gadgets';
  SELECT id INTO v_cat_life FROM public.blog_categories WHERE slug='student-life';

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category_id, status, published_at, reading_time, featured, seo_title, seo_description, faq) VALUES
  ('Best Calculators for Engineering Students in 2026', 'best-calculators-engineering-students',
   'From basic scientific to programmable beasts — here are the calculators every Indian engineering student should consider.',
   E'## Why your calculator matters\n\nA good calculator can save you hours during exams. As an engineering student, you need a device that handles complex equations, integrals, and matrices effortlessly.\n\n## Top Picks\n\n### 1. Casio FX-991ES Plus\nThe gold standard. Affordable, reliable, allowed in GATE.\n\n### 2. Casio FX-991EX ClassWiz\nFaster processor, higher resolution display, spreadsheet mode.\n\n### 3. Texas Instruments TI-36X Pro\nGreat for those who love a tactile keypad.\n\n## Where to buy second-hand\n\nMany seniors sell their barely-used calculators on [MyCampusKart](https://www.mycampuskart.com) at 40-60% off. Always meet on campus and verify the model.\n\n## Final tips\n\n- Check that all keys work\n- Clear all stored data\n- Confirm exam-allowed status',
   'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200',
   v_author, v_cat_buy, 'published', now() - interval '2 days', 6, true,
   'Best Calculators for Engineering Students 2026 | MyCampusKart',
   'Top scientific and programmable calculators for Indian engineering students in 2026, with second-hand buying tips.',
   '[{"q":"Is Casio FX-991EX allowed in GATE?","a":"Yes, the FX-991EX ClassWiz is on the approved list for GATE and most Indian engineering exams."},{"q":"Should I buy a second-hand calculator?","a":"Absolutely — calculators are durable. Just verify all keys work and clear stored data before paying."}]'::jsonb)
  RETURNING id INTO v_post;
  INSERT INTO public.blog_post_tags(post_id, tag_id) SELECT v_post, id FROM public.blog_tags WHERE slug IN ('engineering','calculators','budget');

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category_id, status, published_at, reading_time, featured, seo_title, seo_description, faq) VALUES
  ('Hostel Room Essentials: The Ultimate Checklist', 'hostel-room-essentials-checklist',
   'Moving into a hostel? Here''s every single item you actually need — and what you can skip.',
   E'## The non-negotiables\n\n- Bedding (mattress topper, pillow, two sets of sheets)\n- Bucket, mug, towel set\n- Padlock with strong shackle\n- Extension board with surge protection\n- Study lamp\n\n## Tech essentials\n\n- Laptop + cooling pad\n- Power bank (10000mAh+)\n- Bluetooth speaker (small)\n- Earphones with mic\n\n## Self-care\n\n- First-aid kit\n- Mosquito repellent\n- Detergent + iron\n\n## Smart tip\n\nBuy 60% of these second-hand from departing seniors on MyCampusKart. You''ll save thousands.',
   'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200',
   v_author, v_cat_hostel, 'published', now() - interval '4 days', 5, true,
   'Hostel Room Essentials Checklist for Indian Students | MyCampusKart',
   'The ultimate hostel essentials checklist for Indian college freshers — bedding, tech, self-care and smart buying tips.',
   '[{"q":"What''s the one thing freshers forget?","a":"A surge-protected extension board. Hostel wiring is unpredictable."}]'::jsonb)
  RETURNING id INTO v_post;
  INSERT INTO public.blog_post_tags(post_id, tag_id) SELECT v_post, id FROM public.blog_tags WHERE slug IN ('hostel','freshers','checklist');

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category_id, status, published_at, reading_time, featured, seo_title, seo_description, faq) VALUES
  ('How Students Can Save Money in College: 12 Real Hacks', 'how-students-can-save-money-in-college',
   'Forget generic advice. These are the actual money-saving hacks Indian college students swear by.',
   E'## 1. Buy second-hand\n\nBooks, calculators, lab coats, even bicycles — they all sell for 40-70% off on student marketplaces.\n\n## 2. Cook in your room\n\nA simple electric kettle + induction can cut food costs in half.\n\n## 3. Use your student ID everywhere\n\nSpotify, YouTube Premium, Microsoft 365, Amazon Prime — all have student plans.\n\n## 4. Sell what you don''t use\n\nYour old phone, last semester''s books, the iron you never plug in.\n\n## 5. Group subscriptions\n\nSplit Netflix, Prime, gym memberships across roommates.\n\n## More hacks below\n\n6. Buy in bulk for the semester\n7. Skip campus cafes\n8. Use library printing\n9. Carpool to coaching\n10. Track expenses weekly\n11. Avoid impulse food delivery\n12. Sell early — value drops fast',
   'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=1200',
   v_author, v_cat_money, 'published', now() - interval '6 days', 7, false,
   '12 Real Money-Saving Hacks for Indian College Students | MyCampusKart',
   'Real, practical money-saving hacks every Indian college student should use — second-hand buying, group subscriptions and more.',
   '[]'::jsonb)
  RETURNING id INTO v_post;
  INSERT INTO public.blog_post_tags(post_id, tag_id) SELECT v_post, id FROM public.blog_tags WHERE slug IN ('savings','budget','marketplace');

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category_id, status, published_at, reading_time, featured, seo_title, seo_description, faq) VALUES
  ('Top Things Seniors Sell Before Graduation', 'top-things-seniors-sell-before-graduation',
   'Final-year students offload some of the best deals on campus. Here''s what to look out for.',
   E'## The senior sale season\n\nApril-May is gold rush for second-hand buyers. Seniors want quick sales and prices drop fast.\n\n## Hot items\n\n- Cycles and scooters\n- Mini-fridges and microwaves\n- Gaming setups\n- Reference books\n- Lab equipment and drafting kits\n- Hostel furniture (study tables, chairs)\n\n## Pro tip\n\nFollow your seniors on MyCampusKart and turn on notifications. The best stuff goes in hours.',
   'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200',
   v_author, v_cat_buy, 'published', now() - interval '8 days', 4, false,
   'What Seniors Sell Before Graduation: Best Deals on Campus',
   'Discover the top items final-year college students sell before graduating — and how to grab them first.',
   '[]'::jsonb)
  RETURNING id INTO v_post;
  INSERT INTO public.blog_post_tags(post_id, tag_id) SELECT v_post, id FROM public.blog_tags WHERE slug IN ('seniors','marketplace','budget');

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category_id, status, published_at, reading_time, featured, seo_title, seo_description, faq) VALUES
  ('Best Budget Gadgets for Students in 2026', 'best-budget-gadgets-students-2026',
   'You don''t need to break the bank to have a productive setup. These gadgets cost less than a fancy dinner out.',
   E'## Under ₹1500\n\n- Wireless mouse (Logitech M171)\n- Laptop stand (foldable aluminium)\n- USB-C hub with HDMI\n\n## Under ₹3000\n\n- Mechanical keyboard (Redragon K552)\n- 10000mAh power bank\n- Bluetooth neckband\n\n## Under ₹5000\n\n- Wireless earbuds with ANC\n- Portable monitor (refurbished)\n- Smart desk lamp\n\n## Where to find them cheaper\n\nMost of these show up on MyCampusKart at 30-50% off, often barely used.',
   'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200',
   v_author, v_cat_tech, 'published', now() - interval '10 days', 5, false,
   'Best Budget Gadgets for College Students 2026 | MyCampusKart',
   'Affordable gadgets every Indian college student should own in 2026 — under ₹5000 picks for productivity.',
   '[]'::jsonb)
  RETURNING id INTO v_post;
  INSERT INTO public.blog_post_tags(post_id, tag_id) SELECT v_post, id FROM public.blog_tags WHERE slug IN ('gadgets','electronics','budget');

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category_id, status, published_at, reading_time, featured, seo_title, seo_description, faq) VALUES
  ('The Complete Freshers Hostel Checklist (India Edition)', 'freshers-hostel-checklist-india',
   'Your first week in hostel is overwhelming. This checklist makes it 10x easier.',
   E'## Documents\n\n- Allotment letter (printed + digital)\n- College ID + passport photos\n- Aadhar copy\n- Medical insurance\n\n## Day 1 essentials\n\n- Lock + duplicate key\n- Bedsheet, pillow, blanket\n- Bucket, mug, hanger\n- Toiletry kit\n- Plate, spoon, water bottle\n\n## Week 1 essentials\n\n- Study table organizer\n- Power strip\n- Iron + ironing board (or shared)\n- Slippers + flip-flops\n\n## Smart move\n\nWait 2-3 days before buying everything. Half the things you think you need, you won''t. The other half, your senior is selling for a quarter of the price.',
   'https://images.unsplash.com/photo-1519452575417-564c1401ecc0?w=1200',
   v_author, v_cat_hostel, 'published', now() - interval '12 days', 6, false,
   'Complete Freshers Hostel Checklist 2026 — India Edition',
   'The ultimate hostel checklist for Indian college freshers — documents, day-1 items, week-1 essentials and smart buying tips.',
   '[]'::jsonb)
  RETURNING id INTO v_post;
  INSERT INTO public.blog_post_tags(post_id, tag_id) SELECT v_post, id FROM public.blog_tags WHERE slug IN ('freshers','hostel','checklist');

  INSERT INTO public.blog_posts (title, slug, excerpt, content, cover_image, author_id, category_id, status, published_at, reading_time, featured, seo_title, seo_description, faq) VALUES
  ('Safe Ways to Buy Second-Hand Electronics on Campus', 'safe-ways-buy-second-hand-electronics',
   'Buying used electronics can save you 50%+ — but only if you do it right. Here''s the safety playbook.',
   E'## The 7-step verification\n\n1. **Meet in a public campus spot** (library, cafeteria)\n2. **Inspect physically** — scratches, dents, screen burns\n3. **Power on and stress test** for 10 minutes\n4. **Check serial numbers** match the original box\n5. **Verify warranty status** on the brand''s website\n6. **Test all ports and buttons**\n7. **Pay only after verification** — UPI is best\n\n## Red flags\n\n- Seller refuses in-person meeting\n- Asks for advance payment\n- No original box or bill\n- Pressure to decide instantly\n\n## Why MyCampusKart is safer\n\nVerified student profiles, MCK trust badges, and in-app chat history mean you always know who you''re dealing with.',
   'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200',
   v_author, v_cat_buy, 'published', now() - interval '14 days', 6, false,
   'How to Safely Buy Second-Hand Electronics on Campus | MyCampusKart',
   'A step-by-step safety guide to buying used phones, laptops and gadgets from fellow students.',
   '[{"q":"Should I pay before testing?","a":"Never. Always verify the device works, then pay via UPI for traceability."}]'::jsonb)
  RETURNING id INTO v_post;
  INSERT INTO public.blog_post_tags(post_id, tag_id) SELECT v_post, id FROM public.blog_tags WHERE slug IN ('electronics','safety','marketplace');
END $$;

-- Seed campus pages
INSERT INTO public.campus_pages (slug, name, city, hero_image, intro, sections, seo_title, seo_description) VALUES
('lpu', 'Lovely Professional University (LPU)', 'Phagwara, Punjab',
 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600',
 'LPU is one of India''s largest private universities with over 30,000 students living on campus. The student marketplace is incredibly active — thousands of items are bought and sold every semester.',
 '{"trends":["Mini-fridges and induction cooktops are the most-traded category","April-June sees a 4x spike in second-hand listings","Cycles dominate transport listings"],"hostels":["Boys'' Hostels (Block 1-32)","Girls'' Hostels (Aryabhatta, Kaveri, Sutlej)","Premium hostels (Pearl, Diamond)"],"popular_categories":["Books & Notes","Electronics","Hostel Essentials","Cycles","Calculators"],"tips":["Use the on-campus food courts as safe meet-up spots","Check the senior groups in March for early sale alerts","LPU''s shuttle service makes inter-block pickups easy"]}'::jsonb,
 'LPU Student Marketplace — Buy & Sell on Campus | MyCampusKart',
 'The active LPU student marketplace on MyCampusKart — buying trends, hostel guides and safe pickup tips for Lovely Professional University students.'),

('iit-delhi', 'IIT Delhi', 'Hauz Khas, New Delhi',
 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=1600',
 'IIT Delhi''s student community trades everything from research-grade equipment to coding books. The marketplace skews technical and high-quality.',
 '{"trends":["Programmable calculators and lab equipment trade fast","Strong demand for second-hand mechanical keyboards and monitors","Books in CS, EE and Mechanical disappear within hours"],"hostels":["Aravali, Jwalamukhi, Karakoram (Boys)","Himadri, Kailash (Girls)","Nilgiri (Mixed)"],"popular_categories":["Lab equipment","Books & PYQs","Electronics","Bicycles","Stationery"],"tips":["Meet at SAC or near the Main Building","Check IITD subreddits and Whatsapp groups","Verify lab equipment with your TA before buying"]}'::jsonb,
 'IIT Delhi Student Marketplace | Buy & Sell on Campus — MyCampusKart',
 'The IIT Delhi student marketplace — buying trends, hostel guide and safe campus pickup tips for IITD students.'),

('chandigarh-university', 'Chandigarh University', 'Mohali, Punjab',
 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600',
 'CU has a vibrant student community across multiple programs. The on-campus marketplace is a daily-use platform for thousands of students.',
 '{"trends":["Hostel essentials peak during August intake","Engineering and management books trade equally","Gadget upgrades happen mid-semester"],"hostels":["Boys Hostels (BH-1 to BH-12)","Girls Hostels (GH-1 to GH-8)","Premium hostels (BH-Premium, GH-Premium)"],"popular_categories":["Books","Electronics","Hostel Essentials","Cycles","Calculators"],"tips":["Use the CU food court or Aanjaneya block as meet-up","Check CU group classifieds before buying new","Confirm seller hostel block before traveling"]}'::jsonb,
 'Chandigarh University Marketplace | Student Buy & Sell — MyCampusKart',
 'Chandigarh University student marketplace on MyCampusKart — campus trends, hostel guide and safe buying tips for CU students.');
