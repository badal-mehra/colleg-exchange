import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/mycampuskart-logo.png';

// --- CONFIG ---
const UNIVERSITY_OPTIONS = [
  { value: 'Lovely Professional University', label: 'Lovely Professional University' },
];

const STUDENT_MOODS = [
  "Running on caffeine and dreams ☕",
  "Assignment due at 11:59? Submit at 11:58 🚀",
  "Attendance: 74.9% (Living dangerously) 📉",
  "Campus WiFi > Home WiFi (Sometimes) 📶",
  "Sleep is just a concept during exams 📚"
];

// --- COMPONENTS ---

// Smooth Glass Loader
const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-gray-100">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-600 animate-pulse">Securing your session...</p>
        </div>
    </div>
);

// Pro Password Input with smooth transitions
const PasswordInput = ({ id, name, placeholder, disabled, value, onChange }: any) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative group">
            <Input 
                id={id} 
                name={name} 
                type={show ? "text" : "password"} 
                placeholder={placeholder} 
                disabled={disabled} 
                className="pr-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary border-gray-200 bg-gray-50/50 focus:bg-white"
                required
            />
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary transition-colors"
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
  
  // LOGIC: Terms defaulted to TRUE (Pre-ticked)
  const [signinTerms, setSigninTerms] = useState(true);
  const [signupTerms, setSignupTerms] = useState(true);

  // Mood Ticker Logic
  const [moodIndex, setMoodIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
        setMoodIndex((prev) => (prev + 1) % STUDENT_MOODS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast({ title: "Google Login Error", description: error.message, variant: "destructive" });
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signinTerms) return; // Extra safety

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await signIn(formData.get('email') as string, formData.get('password') as string);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signupTerms) return; // Extra safety

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirmPassword') as string;

    if (password !== confirm) {
        toast({ title: "Password Mismatch", description: "Please ensure passwords match.", variant: "destructive" });
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
        toast({ title: "Welcome to the Club! 🎓", description: "Check your email to verify your student status." });
        const { data: activeTerms } = await supabase.from('terms_and_conditions').select('id').eq('is_active', true).single();
        if (activeTerms) await supabase.from('user_terms_acceptance').insert({ user_id: result.data.user.id, terms_id: activeTerms.id });
    }
    setIsLoading(false);
  };

  const openTerms = () => window.open('/terms', '_blank');

  return (
    // "antialiased tracking-tight" makes fonts look crisp and premium
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50/50 p-4 font-sans antialiased text-gray-900 selection:bg-primary/10">
      
      {isLoading && <LoadingOverlay />}

      {/* Main Card */}
      <Card className="w-full max-w-[440px] shadow-xl border-0 ring-1 ring-gray-200/50 sm:rounded-2xl bg-white/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
        
        <CardHeader className="text-center pb-2 pt-8">
            {/* Logo */}
            <div className="mx-auto mb-4 relative group cursor-pointer" onClick={() => navigate('/')}>
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src={logo} alt="MyCampusKart" className="h-14 w-auto relative z-10 drop-shadow-sm transition-transform duration-300 group-hover:scale-105" />
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                Welcome Back
            </CardTitle>
            
            {/* Animated Mood Ticker */}
            <div className="mt-2 min-h-[24px]">
                <div key={moodIndex} className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-gray-100/80 text-xs font-medium text-gray-600 animate-in slide-in-from-bottom-2 fade-in duration-500">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    {STUDENT_MOODS[moodIndex]}
                </div>
            </div>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-8">
            <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-gray-100/80 rounded-xl">
                    <TabsTrigger value="signin" className="rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">Sign In</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg text-sm font-medium transition-all duration-300 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">Create Account</TabsTrigger>
                </TabsList>

                {/* --- SIGN IN --- */}
                <TabsContent value="signin" className="space-y-5 animate-in slide-in-from-left-4 duration-300">
                    
                    <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="si-email" className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Student Email</Label>
                            <Input 
                                id="si-email" name="email" type="email" placeholder="student@university.edu" 
                                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" required disabled={isLoading} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <Label htmlFor="si-pass" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</Label>
                                <span className="text-xs text-primary font-medium cursor-pointer hover:underline" onClick={() => navigate('/reset-password')}>Forgot?</span>
                            </div>
                            <PasswordInput id="si-pass" name="password" placeholder="••••••••" disabled={isLoading} />
                        </div>

                        {/* Terms - Pre-ticked & Controls Button */}
                        <div className="flex items-center space-x-3 pt-1">
                            <input 
                                type="checkbox" 
                                id="terms_signin" 
                                checked={signinTerms}
                                onChange={(e) => setSigninTerms(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer transition-transform active:scale-95" 
                            />
                            <Label htmlFor="terms_signin" className="text-sm text-gray-600 font-normal cursor-pointer select-none">
                                I accept the <span className="text-primary font-medium hover:underline" onClick={(e) => {e.preventDefault(); openTerms();}}>Terms & Conditions</span>
                            </Label>
                        </div>

                        <Button 
                            type="submit" 
                            className={`w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all duration-300 ${!signinTerms ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                            disabled={isLoading || !signinTerms}
                        >
                            {isLoading ? "Signing In..." : "Login to Dashboard"}
                        </Button>
                    </form>

                     <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground font-medium">Or</span></div>
                    </div>

                    <Button variant="outline" className="w-full h-11 border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all" onClick={handleGoogleSignIn} disabled={isLoading}>
                         <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Continue with Google
                    </Button>
                </TabsContent>

                {/* --- SIGN UP --- */}
                <TabsContent value="signup" className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                             <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Full Name</Label>
                                <Input name="fullName" placeholder="John Doe" className="h-10 bg-gray-50/50 focus:bg-white" required disabled={isLoading} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">University</Label>
                                <Select value={selectedUniversity} onValueChange={setSelectedUniversity} disabled={isLoading}>
                                    <SelectTrigger className="h-10 bg-gray-50/50 focus:bg-white"><SelectValue /></SelectTrigger>
                                    <SelectContent>{UNIVERSITY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Student Email</Label>
                            <Input name="email" type="email" placeholder="you@university.edu" className="h-10 bg-gray-50/50 focus:bg-white" required disabled={isLoading} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Password</Label>
                                <PasswordInput name="password" placeholder="Create" disabled={isLoading} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Confirm</Label>
                                <PasswordInput name="confirmPassword" placeholder="Confirm" disabled={isLoading} />
                            </div>
                        </div>

                        {/* Terms - Pre-ticked & Controls Button */}
                        <div className="flex items-start space-x-3 pt-2">
                             <input 
                                type="checkbox" 
                                id="terms_signup" 
                                checked={signupTerms}
                                onChange={(e) => setSignupTerms(e.target.checked)}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer transition-transform active:scale-95" 
                             />
                             <Label htmlFor="terms_signup" className="text-sm text-gray-600 font-normal cursor-pointer select-none leading-tight">
                                I agree to the <span className="text-primary font-medium hover:underline" onClick={(e) => {e.preventDefault(); openTerms();}}>Terms & Conditions</span> and Privacy Policy.
                            </Label>
                        </div>

                        <Button 
                            type="submit" 
                            className={`w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all duration-300 ${!signupTerms ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                            disabled={isLoading || !signupTerms}
                        >
                            {isLoading ? "Creating Account..." : "Join the Community"}
                        </Button>
                    </form>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <Button variant="link" className="mt-6 text-muted-foreground hover:text-gray-900 transition-colors" onClick={() => navigate('/')}>
        ← Back to Home
      </Button>

    </div>
  );
};

export default Auth;
