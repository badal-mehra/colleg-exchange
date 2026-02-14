import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Loader2, Quote } from 'lucide-react'; // Added icons
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/mycampuskart-logo.png';

// --- CONFIG ---
const UNIVERSITY_OPTIONS = [
  { value: 'Lovely Professional University', label: 'Lovely Professional University' },
];

const STUDENT_QUOTES = [
  "Sleep is for the weak... or those who finished assignments early.",
  "My favorite subject is 'Lunch Break'.",
  "Due tomorrow? Do tomorrow.",
  "Coffee: because adulting is hard.",
  "Wifi connected, but at what cost?"
];

// --- COMPONENTS ---

// 1. Simple Full Screen Loader
const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center animate-in fade-in duration-200">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
        <p className="text-sm font-semibold text-gray-600 animate-pulse">Just a moment...</p>
    </div>
);

// 2. Pro Password Input (Reusable)
const PasswordInput = ({ id, name, placeholder, disabled, value, onChange }: any) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input 
                id={id} 
                name={name} 
                type={show ? "text" : "password"} 
                placeholder={placeholder} 
                disabled={disabled} 
                className="pr-10 transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
                required
            />
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary"
                onClick={() => setShow(!show)}
            >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
        </div>
    );
};

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(UNIVERSITY_OPTIONS[0].value);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Rotate quotes every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % STUDENT_QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const terms = formData.get('terms_signin');

    if (!terms) {
        toast({ title: "Action Required", description: "Please accept the Terms & Conditions to login.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    await signIn(formData.get('email') as string, formData.get('password') as string);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirmPassword') as string;
    const terms = formData.get('terms_signup');

    if (password !== confirm) {
        toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
        return;
    }
    if (!terms) {
        toast({ title: "Action Required", description: "Please accept the Terms & Conditions.", variant: "destructive" });
        return;
    }

    setIsLoading(true);
    const result = await signUp(
        formData.get('email') as string, 
        password, 
        formData.get('fullName') as string, 
        selectedUniversity
    );

    if (result?.data?.user) {
        toast({ title: "Success! 🎉", description: "Account created. Check email for verification link." });
        // Handle T&C recording in background
        const { data: activeTerms } = await supabase.from('terms_and_conditions').select('id').eq('is_active', true).single();
        if (activeTerms) await supabase.from('user_terms_acceptance').insert({ user_id: result.data.user.id, terms_id: activeTerms.id });
    }
    setIsLoading(false);
  };

  const openTerms = () => window.open('/terms', '_blank'); // Replace with your terms logic

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      
      {isLoading && <LoadingOverlay />}

      {/* Main Card - Simple, Centered, Clean Shadow */}
      <Card className="w-full max-w-[420px] shadow-2xl border-0 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 bg-white p-2 rounded-full shadow-sm w-fit">
                <img src={logo} alt="MyCampusKart" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-800">Welcome to Campus</CardTitle>
            
            {/* Relatable Meme/Quote Section - Subtle & Pro */}
            <div className="mt-3 h-8 flex items-center justify-center text-xs text-muted-foreground italic bg-gray-50 rounded-md px-3 transition-all duration-500">
                <Quote className="w-3 h-3 mr-2 opacity-50" />
                <span className="animate-in fade-in slide-in-from-bottom-2 duration-500 key={quoteIndex}">
                    {STUDENT_QUOTES[quoteIndex]}
                </span>
            </div>
        </CardHeader>

        <CardContent>
            <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="signin">Login</TabsTrigger>
                    <TabsTrigger value="signup">Register</TabsTrigger>
                </TabsList>

                {/* --- SIGN IN FORM --- */}
                <TabsContent value="signin" className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                    <Button variant="outline" className="w-full relative" onClick={handleGoogleSignIn} disabled={isLoading}>
                         {/* Google SVG */}
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google Login
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><Separator /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">Or Email</span></div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="si-email">Email</Label>
                            <Input id="si-email" name="email" type="email" placeholder="student@example.com" required disabled={isLoading} />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="si-pass">Password</Label>
                                <span className="text-xs text-primary cursor-pointer hover:underline" onClick={() => navigate('/reset-password')}>Forgot?</span>
                            </div>
                            <PasswordInput id="si-pass" name="password" placeholder="••••••••" disabled={isLoading} />
                        </div>

                        {/* Terms Checkbox for Sign In */}
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" name="terms_signin" id="terms_signin" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                            <Label htmlFor="terms_signin" className="text-sm text-gray-500 font-normal cursor-pointer">
                                I agree to the <span className="text-primary hover:underline" onClick={openTerms}>Terms & Conditions</span>
                            </Label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                </TabsContent>

                {/* --- SIGN UP FORM --- */}
                <TabsContent value="signup" className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                    <form onSubmit={handleSignUp} className="space-y-3">
                        <div className="space-y-1">
                            <Label>Full Name</Label>
                            <Input name="fullName" placeholder="John Doe" required disabled={isLoading} />
                        </div>
                        <div className="space-y-1">
                            <Label>University</Label>
                            <Select value={selectedUniversity} onValueChange={setSelectedUniversity} disabled={isLoading}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{UNIVERSITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label>Email</Label>
                            <Input name="email" type="email" placeholder="you@university.edu" required disabled={isLoading} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label>Password</Label>
                                <PasswordInput name="password" placeholder="Create" disabled={isLoading} />
                            </div>
                            <div className="space-y-1">
                                <Label>Confirm</Label>
                                <PasswordInput name="confirmPassword" placeholder="Confirm" disabled={isLoading} />
                            </div>
                        </div>

                        {/* Terms Checkbox for Sign Up */}
                        <div className="flex items-center space-x-2 mt-2">
                             <input type="checkbox" name="terms_signup" id="terms_signup" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                             <Label htmlFor="terms_signup" className="text-sm text-gray-500 font-normal cursor-pointer">
                                I agree to the <span className="text-primary hover:underline" onClick={openTerms}>Terms & Conditions</span>
                            </Label>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Creating..." : "Create Account"}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
      
      {/* Footer Back Button */}
      <Button variant="link" className="mt-4 text-muted-foreground hover:text-gray-900" onClick={() => navigate('/')}>
        ← Back to Home
      </Button>

    </div>
  );
};

export default Auth;
