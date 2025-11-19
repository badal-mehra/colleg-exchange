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
import logo from '@/assets/mycampuskart-logo.png'; // Assuming your logo path is correct

const UNIVERSITY_OPTIONS = [
  { value: 'Lovely Professional University', label: 'Lovely Professional University' },
];

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate(); 
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const fullName = formData.get('fullName') as string;
    const university = selectedUniversity;
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
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await signUp(email, password, fullName, university);

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

  const handleViewTerms = async () => {
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
  };

  return (
      {/* Container for the Auth Card with Fade-In Animation */}
      <div 
        className="
          w-full 
          max-w-md 
          transition-all 
          duration-500 
          ease-out 
          opacity-0 
          translate-y-4
          md:opacity-100 md:translate-y-0
        "
        style={{ animation: 'fadeInUp 0.7s ease-out 0.1s forwards' }} 
      >
        <Card className="w-full shadow-2xl bg-white/90 backdrop-blur-sm"> {/* Added bg-white/90 and backdrop-blur-sm for style */}
          <CardHeader className="text-center relative">
            
            {/* Working Back Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={handleBack}
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
              Join Your Campus Marketplace
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Tabs */}
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Content */}
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" name="email" type="email" placeholder="your.email@lpu.in" required />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        className="text-xs p-0 h-auto"
                        onClick={async () => {
                            const email = (document.getElementById('signin-email') as HTMLInputElement)?.value;
                            if (!email) {
                                toast({ title: "Error", description: "Please enter your email first", variant: "destructive" });
                                return;
                            }
                            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                                redirectTo: `${window.location.origin}/reset-password`,
                            });
                            if (error) {
                                toast({ title: "Error", description: error.message, variant: "destructive" });
                            } else {
                                toast({ title: "Success", description: "Password reset email sent! Check your inbox." });
                            }
                        }}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    <div className="relative">
                      <Input id="signin-password" name="password" type={showPassword ? "text" : "password"} required className="pr-10" />
                      <PasswordToggle isVisible={showPassword} toggleVisibility={() => setShowPassword(!showPassword)} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Content */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" placeholder="Your full name" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
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
                    <Label htmlFor="signup-email">University Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      pattern=".*@lpu\.in$"
                      placeholder="yourname@lpu.in"
                    />
                    <p className="text-xs text-muted-foreground">Student verification is done via your @lpu.in email.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input id="signup-password" name="password" type={showConfirmPassword ? "text" : "password"} required />
                      <PasswordToggle isVisible={showConfirmPassword} toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required />
                      <PasswordToggle isVisible={showConfirmPassword} toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)} />
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <input type="checkbox" id="terms" name="terms" required className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                    <Label htmlFor="terms" className='text-sm leading-tight'>
                        I agree to the{' '}
                        <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-sm text-primary hover:underline"
                            onClick={handleViewTerms}
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
