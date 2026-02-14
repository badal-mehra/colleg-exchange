import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, X, ArrowRight, CheckCircle2, GraduationCap, Wifi, Coffee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/mycampuskart-logo.png';

// --- CONFIGURATION ---
const UNIVERSITY_OPTIONS = [
  { value: 'Lovely Professional University', label: 'Lovely Professional University' },
];

const MEMES = [
  {
    id: 1,
    text: "When the assignment is due at 11:59 PM and you submit at 11:58 PM.",
    sub: "Living on the edge.",
    icon: <CheckCircle2 className="w-12 h-12 text-green-400 mb-4" />,
    bg: "bg-gradient-to-br from-indigo-900 to-purple-800"
  },
  {
    id: 2,
    text: "Campus WiFi be like: Connected, no internet.",
    sub: "Chrome Dino run high score: 5000.",
    icon: <Wifi className="w-12 h-12 text-blue-400 mb-4" />,
    bg: "bg-gradient-to-br from-blue-900 to-slate-800"
  },
  {
    id: 3,
    text: "8:00 AM Class? I think you mean 'Nap time part 2'.",
    sub: "Attendance is a suggestion, right?",
    icon: <Coffee className="w-12 h-12 text-yellow-400 mb-4" />,
    bg: "bg-gradient-to-br from-orange-900 to-red-900"
  }
];

// --- SUB-COMPONENTS ---

const MemeSidebar = () => {
  const [currentMeme, setCurrentMeme] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMeme((prev) => (prev + 1) % MEMES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`hidden lg:flex flex-col justify-between p-12 w-1/2 h-full text-white transition-colors duration-1000 ${MEMES[currentMeme].bg} relative overflow-hidden`}>
      {/* Abstract Shapes */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 font-bold text-xl opacity-90">
          <GraduationCap /> MyCampusKart
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <div className="transition-all duration-500 transform translate-y-0 opacity-100 key={currentMeme}">
            {MEMES[currentMeme].icon}
            <h2 className="text-3xl font-bold leading-tight mb-4">
              "{MEMES[currentMeme].text}"
            </h2>
            <p className="text-lg text-white/70 font-medium">
              — {MEMES[currentMeme].sub}
            </p>
        </div>
      </div>

      <div className="relative z-10 flex gap-2">
        {MEMES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentMeme(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${currentMeme === idx ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-lg animate-in fade-in duration-200">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
    </div>
    <p className="mt-4 text-sm font-medium text-muted-foreground animate-pulse">Processing request...</p>
  </div>
);

// --- MAIN COMPONENT ---

const Auth = () => {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  // Passwords Visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form States
  const [selectedUniversity, setSelectedUniversity] = useState(UNIVERSITY_OPTIONS[0].value);
  const [signinTerms, setSigninTerms] = useState(false); // NEW: Checkbox for sign in

  // Redirect if logged in
  if (user) return <Navigate to="/dashboard" replace />;

  const handleBack = () => navigate('/');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      toast({ title: "Google Sign In Failed", description: error.message, variant: "destructive" });
    }
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // NEW: Check Terms for Sign In
    if (!signinTerms) {
      toast({
        title: "Terms Required",
        description: "Please accept the terms and conditions to sign in.",
        variant: "destructive",
      });
      return;
    }

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
    const termsAccepted = formData.get('terms');

    if (password !== confirmPassword) {
      toast({ title: "Password Mismatch", description: "Passwords do not match.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (!termsAccepted) {
      toast({ title: "Terms Required", description: "Please accept the terms to create an account.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    const result = await signUp(email, password, fullName, university);

    if (result?.data?.user) {
      toast({ 
        title: "Welcome Aboard! 🎓", 
        description: "Account created. Please check your email for the verification link.", 
      });
      
      // Handle Terms Record
      const { data: activeTerms } = await supabase.from('terms_and_conditions').select('id').eq('is_active', true).limit(1).single();
      if (activeTerms) {
        await supabase.from('user_terms_acceptance').insert({ user_id: result.data.user.id, terms_id: activeTerms.id });
      }
    }
    setIsLoading(false);
  };

  const handleViewTerms = async () => {
    // Just opening a generic window for demo, add your logic here
    window.open('/terms', '_blank');
  };

  // Helper for password toggles
  const PasswordToggle = ({ isVisible, toggle }: { isVisible: boolean, toggle: () => void }) => (
    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <div className="min-h-screen w-full flex bg-gray-50">
      
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        {/* Back Button */}
        <Button variant="ghost" className="absolute top-4 left-4 group" onClick={handleBack}>
          <X className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" /> Back
        </Button>

        <div className="w-full max-w-md space-y-8 relative">
          
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <img src={logo} alt="Logo" className="h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {activeTab === 'signin' ? 'Welcome back!' : 'Create an account'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'signin' ? 'Enter your details to access your student portal.' : 'Join your campus marketplace today.'}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-gray-100/50 p-1 rounded-xl">
              <TabsTrigger value="signin" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all">Sign Up</TabsTrigger>
            </TabsList>

            <div className="relative min-h-[400px]">
              {isLoading && <LoadingOverlay />}

              {/* SIGN IN TAB */}
              <TabsContent value="signin" className="space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
                <Button variant="outline" className="w-full h-11 relative" onClick={handleGoogleSignIn}>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>

                <div className="relative py-2">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-xs text-muted-foreground uppercase">Or email</span>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email Address</Label>
                    <Input id="signin-email" name="email" type="email" placeholder="student@example.com" required className="h-11" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="signin-password">Password</Label>
                      <button type="button" className="text-xs text-primary hover:underline" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Input id="signin-password" name="password" type={showPassword ? "text" : "password"} required className="h-11 pr-10" />
                      <PasswordToggle isVisible={showPassword} toggle={() => setShowPassword(!showPassword)} />
                    </div>
                  </div>

                  {/* SIGN IN TERMS CHECKBOX (Requested Feature) */}
                  <div className="flex items-start space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="signin-terms" 
                      checked={signinTerms}
                      onChange={(e) => setSigninTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" 
                    />
                    <Label htmlFor="signin-terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                      I agree to the <span className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); handleViewTerms(); }}>Terms & Conditions</span> and Privacy Policy.
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base group mt-4">
                    Sign In <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>
              </TabsContent>

              {/* SIGN UP TAB */}
              <TabsContent value="signup" className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
                 <Button variant="outline" className="w-full h-11 relative" onClick={handleGoogleSignIn}>
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Create Google Account
                </Button>

                <div className="relative py-2">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-50 px-2 text-xs text-muted-foreground uppercase">Or email</span>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                     <div className="space-y-1">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" name="fullName" placeholder="John Doe" required className="h-10" />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="university">University</Label>
                        <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                        <SelectTrigger id="university" className="h-10">
                            <SelectValue placeholder="Select Uni" />
                        </SelectTrigger>
                        <SelectContent>
                            {UNIVERSITY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="signup-email">Student Email</Label>
                    <Input id="signup-email" name="email" type="email" placeholder="john@lpu.in" required className="h-10" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 relative">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                            <Input id="signup-password" name="password" type={showSignUpPassword ? "text" : "password"} required className="h-10 pr-8" placeholder="Create" />
                            <PasswordToggle isVisible={showSignUpPassword} toggle={() => setShowSignUpPassword(!showSignUpPassword)} />
                        </div>
                    </div>
                    <div className="space-y-1 relative">
                        <Label htmlFor="confirmPassword">Confirm</Label>
                        <div className="relative">
                            <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required className="h-10 pr-8" placeholder="Repeat" />
                            <PasswordToggle isVisible={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                        </div>
                    </div>
                  </div>

                  {/* SIGN UP TERMS CHECKBOX */}
                  <div className="flex items-start space-x-2 pt-2">
                    <input type="checkbox" id="terms" name="terms" required className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" />
                    <Label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                        I agree to the <span className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); handleViewTerms(); }}>Terms and Conditions</span>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base mt-2">Create Account</Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* RIGHT SIDE: MEME/VISUALS SIDEBAR */}
      <MemeSidebar />

    </div>
  );
};

export default Auth;
