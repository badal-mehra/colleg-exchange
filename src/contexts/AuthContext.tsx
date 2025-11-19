// file: AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast"; //

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    university?: string
  ) => Promise<{ data: any; error: any }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined); //

export const useAuth = () => {
  const context = useContext(AuthContext); //
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null); //
  const [session, setSession] = useState<Session | null>(null); //
  const [loading, setLoading] = useState(true); // FIX: Start loading as true
  const { toast } = useToast(); //

  useEffect(() => {
    // FIX: Use onAuthStateChange for initial check AND listening.
    // The first event fires immediately with the current session state.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession); //
        setUser(newSession?.user ?? null); //
        setLoading(false); // FIX: Set loading to false only after the initial state is resolved
      }
    );

    return () => {
      // Cleanup the listener on unmount
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, university?: string) => {
    const redirectUrl = `${window.location.origin}/`; //

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, university }
      }
    });

    if (error) {
      toast({
        title: "Sign Up Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Please check your email to confirm your account!"
      });
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    }); //

    if (error) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      }); //
    }

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut(); //
    if (error) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive"
      }); //
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
