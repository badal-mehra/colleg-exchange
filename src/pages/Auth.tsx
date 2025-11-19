import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, CheckCircle, Gift, MessageSquare } from 'lucide-react'; // New icons for features and password toggle
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/mycampuskart-logo.png';

const UNIVERSITY_OPTIONS = [
  { value: 'Lovely Professional University', label: 'Lovely Professional University' },
  // Add other universities here if they become available
];

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(UNIVERSITY_OPTIONS[0].value);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await signIn(email, password);
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
    const university = selectedUniversity; // Use state for select
    const termsAccepted = formData.get('terms') as string;

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
        description: "Please accept the terms and conditions to continue",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Sign up the user
    const result = await signUp(email, password, fullName, university);

    // If signup successful, record terms acceptance
    if (result?.data?.user) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Hero content (Refreshed) */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <img 
              src={logo} 
              alt="MyCampusKart" 
              className="h-16 mx-auto lg:mx-0"
            />
            {/* New Tagline */}
            <h1 className="text-4xl font-bold text-primary">
              The Exclusive LPU Campus Exchange
            </h1>
            <p className="text-xl text-muted-foreground">
              Trade books, gadgets, and services securely with your verified peers.
            </p>
          </div>

          {/* New Feature Blocks */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center space-y-2 p-6 rounded-xl bg-primary/10 border-2 border-primary/50 transition-all hover:shadow-lg">
              <CheckCircle className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-lg">Verified Access</h3>
              <p className="text-sm text-center text-muted-foreground">LPU Student Email Required for Entry.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 p-6 rounded-xl bg-primary/10 border-2 border-primary/50 transition-all hover:shadow-lg">
              <Gift className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-lg">Hassle-Free Trading</h3>
              <p className="text-sm text-center text-muted-foreground">Sell fast, buy cheap—right on campus.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 p-6 rounded-xl bg-primary/10 border-2 border-primary/50 transition-all hover:shadow-lg">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-lg">Direct Connect</h3>
              <p className="text-sm text-center text-muted-foreground">Private chat for safe local meetups.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 p-6 rounded-xl bg-primary/10 border-2 border-primary/50 transition-all hover:shadow-lg">
              <span className="text-3xl">📚</span>
              <h3 className="font-semibold text-lg">Academic Focus</h3>
              <p className="text-sm text-center text-muted-foreground">Find used books and study aids easily.</p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <Card className="w-full max-w-md mx-auto shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <img 
                src={logo} 
                alt="MyCampusKart" 
                className="h-14"
              />
            </div>
            <CardTitle>Welcome to MyCampusKart</CardTitle>
            <CardDescription>
              Join the Lovely Professional University marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your.email@college.edu"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-xs p-0 h-auto"
                        onClick={async () => {
                          // NOTE: Using a different ID for the sign-in email input
                          const email = (document.getElementById('signin-email') as HTMLInputElement)?.value;
                          if (!email) {
                            toast({
                              title: "Error",
                              description: "Please enter your email first",
                              variant: "destructive",
                            });
                            return;
                          }
                          const { error } = await supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: `${window.location.origin}/reset-password`,
                          });
                          if (error) {
                            toast({
                              title: "Error",
                              description: error.message,
                              variant: "destructive",
                            });
                          } else {
                            toast({
                              title: "Success",
                              description: "Password reset email sent! Check your inbox.",
                            });
                          }
                        }}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    {/* Password Input with Toggle */}
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        className="pr-10" // Make room for the button
                      />
                      <PasswordToggle 
                        isVisible={showPassword} 
                        toggleVisibility={() => setShowPassword(!showPassword)} 
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select
                      name="university"
                      value={selectedUniversity}
                      onValueChange={setSelectedUniversity}
                      required
                    >
                      <SelectTrigger id="university">
                        <SelectValue placeholder="Select your university" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIVERSITY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">LPU Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="yourname@lpu.in"
                      required
                      pattern=".*@lpu\.in$"
                      title="Please use your LPU email address (@lpu.in)"
                    />
                    <p className="text-xs text-muted-foreground">Student verification is done via your @lpu.in email.</p>
                  </div>
                  
                  {/* Password Input with Toggle */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        required
                        className="pr-10"
                      />
                      <PasswordToggle 
                        isVisible={showConfirmPassword} 
                        toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)} 
                      />
                    </div>
                  </div>
                  
                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        required
                        className="pr-10"
                      />
                      {/* Using the same toggle for simplicity on both fields */}
                      <PasswordToggle 
                        isVisible={showConfirmPassword} 
                        toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)} 
                      />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      required
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                      I agree to the{' '}
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-sm text-primary hover:underline"
                        onClick={async () => {
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
                                      body { font-family: system-ui; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                                      h1 { color: #333; }
                                      .version { color: #666; font-size: 0.9rem; }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>Terms and Conditions</h1>
                                    <p class="version">Version: ${terms.version}</p>
                                    <div>${terms.content.replace(/\n/g, '<br>')}</div>
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
                        }}
                      >
                        Terms and Conditions
                      </Button>
                    </Label>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
