import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import logoSrc from 'src/assets/mycampuskart-logo.png'; // Import the logo source

// --- Logo Component for Reusability ---
const AppLogo = ({ className = "h-12 w-12" }: { className?: string }) => (
  <div className={`mx-auto mb-6 ${className} flex items-center justify-center`}>
    {/* Adjust className for size and style */}
    <img src={logoSrc} alt="MyCampuskart Logo" className="h-full w-auto object-contain" />
  </div>
);
// --- End Logo Component ---

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);

  // Effect to check for a valid password recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Session Expired",
          description: "Your password reset link is invalid or expired. Please request a new one.",
          variant: "destructive",
        });
        // Redirect to the authentication page after a short delay
        setTimeout(() => navigate('/auth'), 2000);
      }
    });
  }, [navigate, toast]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "The new passwords you entered do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Your new password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Update user password via Supabase
    const { error } = await supabase.auth.updateUser({ password: password });

    if (error) {
      console.error("Password Update Error:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "An unexpected error occurred during the update.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Password updated successfully. You are being redirected to the dashboard.",
      });
      // Redirect to the dashboard upon successful update
      setTimeout(() => navigate('/dashboard'), 2000);
    }
    setIsLoading(false);
  };

  // Render state for an invalid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <AppLogo className="h-10 w-10" />
            <CardTitle className="text-2xl font-bold">Session Check</CardTitle>
            <CardDescription>
              Verifying your reset link. Redirecting if invalid...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Main password reset form
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/10">
        <CardHeader className="text-center">
          <AppLogo />
          <CardTitle className="text-3xl font-extrabold text-gray-900 dark:text-gray-50">
            Secure Password Reset
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
            Please enter and confirm your new password to regain access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full text-lg py-2 transition-all duration-300 hover:shadow-lg" 
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
