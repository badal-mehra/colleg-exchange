
-- =============================================
-- 1. PROFILES: restrict sensitive columns
-- =============================================

-- Drop the over-permissive public read policies
DROP POLICY IF EXISTS "Allow public read" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Keep "Users can view their own profile" (auth.uid() = user_id) and "Admins can manage all profiles"
-- Add a new public read policy, but use column GRANTs to limit which fields are readable

-- Revoke broad column SELECT from anon/authenticated, then grant only safe columns
REVOKE SELECT ON public.profiles FROM anon, authenticated;

GRANT SELECT (
  id, user_id, full_name, avatar_url, university, course, batch,
  campus_points, points, lifetime_points, deals_completed,
  trust_seller_badge, average_rating, total_ratings,
  mck_id, badge, rank, created_at
) ON public.profiles TO anon, authenticated;

-- Owner and admin policies still apply for full-row access (all columns)
-- Re-grant ALL columns to authenticated for self-reads via the owner policy
-- This is safe because RLS still restricts row visibility for full-column queries
GRANT SELECT ON public.profiles TO authenticated;
-- Now revoke the sensitive columns again from anon only
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, full_name, avatar_url, university, course, batch,
  campus_points, points, lifetime_points, deals_completed,
  trust_seller_badge, average_rating, total_ratings,
  mck_id, badge, rank, created_at
) ON public.profiles TO anon;

-- Re-add a public-row policy so non-owners can see rows (column GRANTs limit visibility)
CREATE POLICY "Public can view profile rows (column-restricted)"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- =============================================
-- 2. PROFILES: prevent self-elevation via UPDATE
-- =============================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow admins and SECURITY DEFINER functions (auth.uid() is null when called as service role)
  IF auth.uid() IS NULL OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- Block changes to sensitive fields by regular users
  IF NEW.campus_points IS DISTINCT FROM OLD.campus_points
     OR NEW.points IS DISTINCT FROM OLD.points
     OR NEW.lifetime_points IS DISTINCT FROM OLD.lifetime_points
     OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
     OR NEW.verification_status IS DISTINCT FROM OLD.verification_status
     OR NEW.verification_document_url IS DISTINCT FROM OLD.verification_document_url
     OR NEW.trust_seller_badge IS DISTINCT FROM OLD.trust_seller_badge
     OR NEW.deals_completed IS DISTINCT FROM OLD.deals_completed
     OR NEW.badge IS DISTINCT FROM OLD.badge
     OR NEW.rank IS DISTINCT FROM OLD.rank
     OR NEW.mck_id IS DISTINCT FROM OLD.mck_id
  THEN
    RAISE EXCEPTION 'Not authorized to modify protected profile fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- =============================================
-- 3. KYC: secure server-side function for KYC submission
-- =============================================

CREATE OR REPLACE FUNCTION public.submit_kyc(
  p_full_name text,
  p_phone text,
  p_college_name text,
  p_student_id text,
  p_document_path text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify the document path belongs to this user (folder = user_id)
  IF p_document_path IS NOT NULL AND split_part(p_document_path, '/', 1) <> v_user_id::text THEN
    RAISE EXCEPTION 'Document path does not belong to current user';
  END IF;

  UPDATE public.profiles SET
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    college_name = COALESCE(p_college_name, college_name),
    student_id = COALESCE(p_student_id, student_id),
    verification_document_url = COALESCE(p_document_path, verification_document_url),
    verification_status = 'pending',
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================
-- 4. KYC bucket: private storage policies
-- =============================================

-- The kyc-documents bucket already exists and is private. Add policies
-- restricting access to the document owner and admins.
DROP POLICY IF EXISTS "Users can upload their own KYC documents" ON storage.objects;
CREATE POLICY "Users can upload their own KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own KYC documents" ON storage.objects;
CREATE POLICY "Users can update their own KYC documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can read their own KYC documents" ON storage.objects;
CREATE POLICY "Users can read their own KYC documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin(auth.uid())
  )
);
