/**
 * @fileoverview Password reset flow.
 * - If the user lands here without a recovery session, show a "Forgot password" form
 *   that sends a reset email via Supabase.
 * - If the user lands here from a recovery email link (active recovery session),
 *   show the "Set new password" form.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, Mail } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 6;
const REDIRECT_DELAY_MS = 2000;

type Mode = 'checking' | 'request' | 'reset';

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('checking');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let recoveryDetected = false;

    // Listen for the PASSWORD_RECOVERY event Supabase fires when a recovery link is processed.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryDetected = true;
        setMode('reset');
      }
    });

    const checkSession = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
      const isRecoveryLink =
        url.searchParams.get('type') === 'recovery' ||
        hashParams.get('type') === 'recovery' ||
        hashParams.has('access_token');

      // Give the auth listener a tick to process recovery tokens from the URL.
      await new Promise((r) => setTimeout(r, 300));

      const { data: { session } } = await supabase.auth.getSession();

      if (recoveryDetected || (session && isRecoveryLink)) {
        setMode('reset');
        return;
      }

      // No recovery context → show the "request reset email" form.
      setMode('request');
    };

    checkSession();

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleRequestReset = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      toast({
        title: 'Could not send reset email',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Check your inbox',
      description: 'We sent you a password reset link. Open it on this device to continue.',
    });
  }, [email, toast]);

  const handleResetPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmPassword) {
      toast({ title: 'Validation Error', description: 'The new passwords entered do not match.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast({ title: 'Validation Error', description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: 'Password Update Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    } else {
      toast({ title: 'Success!', description: 'Your password has been updated. Redirecting...' });
      setTimeout(() => navigate('/dashboard'), REDIRECT_DELAY_MS);
    }
    setIsLoading(false);
  }, [newPassword, confirmPassword, navigate, toast]);

  const isFormValid = useMemo(
    () => newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword,
    [newPassword, confirmPassword]
  );

  if (mode === 'checking') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
            <CardTitle className="text-xl">Please wait</CardTitle>
            <CardDescription>Verifying your reset link…</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (mode === 'request') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Forgot your password?</CardTitle>
            <CardDescription>
              Enter your account email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !email}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                ) : 'Send reset link'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
                Back to login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
          <CardDescription>Enter a strong, new password below.</CardDescription>
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
            <Button type="submit" className="w-full" disabled={isLoading || !isFormValid}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating Password…</>
              ) : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
