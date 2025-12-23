import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/mycampuskart-logo.png';

const UNIVERSITY_OPTIONS = [
  { value: 'Lovely Professional University', label: 'Lovely Professional University' },
];

// --- NEW COMPONENT: Full-Screen Loader Overlay ---
const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
        <div className="bg-white px-6 py-4 rounded-xl shadow-2xl text-center flex items-center">
            {/* Tailwind CSS spinner equivalent */}
            <div className="animate-spin h-6 w-6 border-4 border-t-4 border-t-primary border-gray-200 rounded-full mr-3"></div>
            <p className="text-base font-semibold text-gray-700">Processing...</p>
        </div>
    </div>
);
// -------------------------------------------------


const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  // State for overall loading status, controls the full-screen overlay and disables UI
  const [isLoading, setIsLoading] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  // Renamed for clarity: use separate state for each password field visibility
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(UNIVERSITY_OPTIONS[0].value);

  // Redirect if user is logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleBack = () => {
    // Navigates to the root route (e.g., '/').
    navigate('/');
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast({
        title: "Google Sign In Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;
    const university = selectedUniversity;
    // For checkbox, FormData.get returns 'on' if checked, null if not present (since it's a required field in HTML, it will be 'on')
    const termsAccepted = formData.get('terms'); 

    if (password !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await signUp(email, password, fullName, university);

    if (result?.data?.user) {
      // SUCCESS: Add an explicit toast for user clarity (Supabase usually requires email verification)
      toast({ 
        title: "Account Created! 🎉", 
        description: "Check your email for the verification link. It may take 5-10 seconds.", // ADDED: Clear instructions
      });

      const { data: activeTerms } = await supabase
        .from('terms_and_conditions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (activeTerms) {
        await supabase
          .from('user_terms_acceptance')
          .insert({
            user_id: result.data.user.id,
            terms_id: activeTerms.id,
          });
      }
    }

    setIsLoading(false);
  };

  const PasswordToggle = ({ isVisible, toggleVisibility }: { isVisible: boolean, toggleVisibility: () => void }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 hover:bg-transparent"
      onClick={toggleVisibility}
      aria-label={isVisible ? "Hide password" : "Show password"}
    >
      {isVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
    </Button>
  );

  const handleViewTerms = async () => {
    // OPTIMIZATION: Only show loading overlay for data-intensive/blocking actions
    // For terms viewing, a small in-button spinner is usually fine, but for consistency:
    setIsLoading(true); 

    const { data: terms } = await supabase
      .from('terms_and_conditions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (terms) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Terms and Conditions - MyCampusKart</title>
              <style>
                body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1 { color: #333; }
                .version { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }
              </style>
            </head>
            <body>
              <h1>Terms and Conditions</h1>
              <p class="version">Version: ${terms.version || 'N/A'}</p>
              <div>${terms.content ? terms.content.replace(/\n/g, '<br>') : 'Terms content not available.'}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      toast({
        title: "Terms not available",
        description: "Terms and conditions are not currently available. Please contact support.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-white"
    >
        {/* --- ADDED: Full-Screen Loader --- */}
        {isLoading && <LoadingOverlay />}
        {/* ---------------------------------- */}
        
      {/* Container for the Auth Card with **FIXED** classes */}
      <div className="w-full max-w-md">
        {/* --- ADDED: Disable interaction while loading (subtle freeze) --- */}
        <div className={`${isLoading ? "pointer-events-none opacity-80 transition-opacity duration-300" : ""}`}> 
            <Card className="w-full shadow-2xl bg-white/90 backdrop-blur-sm"> {/* Kept card styling for contrast */}
            <CardHeader className="text-center relative">

                {/* Working Back Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 left-4 h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={handleBack}
                    disabled={isLoading} // ADDED: Disable back button while loading
                >
                    <X className="h-5 w-5" />
                </Button>

                <div className="flex justify-center mb-4 mt-2">
                <img
                    src={logo}
                    alt="MyCampusKart"
                    className="h-16"
                />
                </div>
                <CardTitle className="text-2xl">Welcome to MyCampusKart</CardTitle>
                <CardDescription>
                Sign in or create your LPU student account
                </CardDescription>
            </CardHeader>

            <CardContent>
                {/* Tabs */}
                <Tabs defaultValue="signin" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin" disabled={isLoading}>Sign In</TabsTrigger>
                    <TabsTrigger value="signup" disabled={isLoading}>Sign Up</TabsTrigger>
                </TabsList>

                {/* Sign In Content */}
                <TabsContent value="signin" className="space-y-4">
                    {/* Google Sign In Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-3 h-11"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                      </div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input id="signin-email" name="email" type="email" placeholder="your.email@example.com" required disabled={isLoading} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password">Password</Label>
                        <Button
                            type="button"
                            variant="link"
                            className="text-xs p-0 h-auto"
                            disabled={isLoading}
                            onClick={async () => {
                                const email = (document.getElementById('signin-email') as HTMLInputElement)?.value;
                                if (!email) {
                                    toast({ title: "Error", description: "Please enter your email first", variant: "destructive" });
                                    return;
                                }
                                setIsLoading(true);
                                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                    redirectTo: `${window.location.origin}/reset-password`,
                                });
                                setIsLoading(false);
                                if (error) {
                                    toast({ title: "Error", description: error.message, variant: "destructive" });
                                } else {
                                    toast({ title: "Email Sent", description: "Password reset link sent! Check your inbox/spam. It may take 5–10 seconds." });
                                }
                            }}
                        >
                            Forgot Password?
                        </Button>
                        </div>
                        <div className="relative">
                        <Input id="signin-password" name="password" type={showPassword ? "text" : "password"} required className="pr-10" disabled={isLoading} />
                        <PasswordToggle isVisible={showPassword} toggleVisibility={() => setShowPassword(!showPassword)} />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin border-2 border-t-transparent border-white rounded-full"></div>
                                <span>Signing in...</span>
                            </div>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                    </form>
                </TabsContent>

                {/* Sign Up Content */}
                <TabsContent value="signup" className="space-y-4">
                    {/* Google Sign Up Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-center gap-3 h-11"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Continue with Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
                      </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" name="fullName" placeholder="Your full name" required disabled={isLoading} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="university">University</Label>
                        <Select value={selectedUniversity} onValueChange={setSelectedUniversity} disabled={isLoading}>
                        <SelectTrigger id="university">
                            <SelectValue placeholder="Select your university" />
                        </SelectTrigger>
                        <SelectContent>
                            {UNIVERSITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        pattern=".+"
                        placeholder="your.email@example.com"
                        disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">Student verification is done via email.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="signup-password">Create Password</Label>
                        <div className="relative">
                        <Input id="signup-password" name="password" type={showSignUpPassword ? "text" : "password"} required className="pr-10" disabled={isLoading} />
                        <PasswordToggle isVisible={showSignUpPassword} toggleVisibility={() => setShowSignUpPassword(!showSignUpPassword)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                        <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required className="pr-10" disabled={isLoading} />
                        <PasswordToggle isVisible={showConfirmPassword} toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)} />
                        </div>
                    </div>

                    <div className="flex items-start space-x-2">
                        {/* Note: Checkbox itself doesn't have a disabled prop in the markup, but the parent pointer-events-none handles it */}
                        <input type="checkbox" id="terms" name="terms" required className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                        <Label htmlFor="terms" className='text-sm leading-tight'>
                            I agree to the{' '}
                            <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-sm text-primary hover:underline"
                                onClick={handleViewTerms}
                                disabled={isLoading} // ADDED: Disable while main form is loading
                            >
                                Terms and Conditions
                            </Button>
                        </Label>
                    </div>

                    {/* IMPROVED BUTTON: Spinner + Text Swap */}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin border-2 border-t-transparent border-white rounded-full"></div>
                                <span>Creating account...</span>
                            </div>
                        ) : (
                            "Create Account"
                        )}
                    </Button>

                    </form>
                </TabsContent>
                </Tabs>
            </CardContent>
            </Card>
        </div> {/* END of pointer-events-none wrapper */}
      </div>
    </div>
  );
};

export default Auth;
