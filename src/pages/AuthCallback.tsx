import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  useEffect(() => {
    // Detect recovery (password reset) flow from URL hash/query
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const isRecovery =
      hash.includes("type=recovery") || search.includes("type=recovery");

    if (isRecovery) {
      window.location.replace("/reset-password" + hash);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.replace("/dashboard");
      } else {
        window.location.replace("/auth");
      }
    });
  }, []);

  return <p>Signing you in…</p>;
};

export default AuthCallback;
