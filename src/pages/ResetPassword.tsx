/**
 * @fileoverview Component for handling password reset after a user clicks a recovery link.
 * It verifies the session and allows the user to set a new password via Supabase.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client'; // Assuming correct path to Supabase client
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2 } from 'lucide-react';

// Define minimum password length as a constant for clarity
const MIN_PASSWORD_LENGTH = 6;
// Define the redirection delay
const REDIRECT_DELAY_MS = 2000;

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidSession, setIsValidSession] = useState(false);

  /**
   * Effect to verify the recovery session immediately upon component mount.
   * If no valid session is found, it shows an error toast and redirects.
   */
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: 'Authentication Required',
          description: 'The password reset link is invalid or expired. Please request a new link.',
          variant: 'destructive',
        });
        // Use a state transition or a cleaner way to handle redirection after component load
        setTimeout(() => navigate('/auth/sign-in'), REDIRECT_DELAY_MS);
      }
    };

    checkSession();
  }, [navigate, toast]);

  /**
   * Handle the password reset submission.
   * Performs client-side validation before attempting the Supabase API call.
   * @param e - The form submission event.
   */
  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'The new passwords entered do not match.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: 'Validation Error',
        description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Call Supabase to update the user's password using the active session
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast({
        title: 'Password Update Failed',
        description: error.message || 'An unexpected error occurred during the update.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success!',
        description: 'Your password has been updated. Redirecting to your dashboard...',
      });
      // Redirect to the protected dashboard page after a successful update
      setTimeout(() => navigate('/dashboard'), REDIRECT_DELAY_MS);
    }
    
    setIsLoading(false);
  }, [newPassword, confirmPassword, navigate, toast]);

  // Determine button state and text
  const isFormValid = useMemo(
    () => newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  // Render a loading/redirect state if the session is not yet valid
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
            <CardTitle className="text-xl">Verifying Session</CardTitle>
            <CardDescription>
              Please wait while we validate your reset link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>
            Enter a strong, new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Password...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
