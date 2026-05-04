import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  useEffect(() => {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const queryType = url.searchParams.get("type");
    const hashType = hashParams.get("type");
    const isOAuth = url.searchParams.get("flow") === "oauth" || hashParams.get("provider_token") || hashParams.get("provider_refresh_token");
    const isRecovery = !isOAuth && (queryType === "recovery" || hashType === "recovery");

    if (isRecovery) {
      window.location.replace(`/reset-password${url.hash || ""}`);
      return;
    }

    const finishSignIn = async () => {
      if (url.searchParams.has("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(url.searchParams.get("code") || "");
        if (error) {
          window.location.replace("/auth");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.replace("/dashboard");
      } else {
        window.location.replace("/auth");
      }
    };

    finishSignIn();
  }, []);

  return <p>Signing you in…</p>;
};

export default AuthCallback;
