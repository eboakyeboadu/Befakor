import { useState, useEffect, FormEvent } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs } from "firebase/firestore";
import { Store, ShieldCheck, CreditCard, MapPin, Leaf, Sparkles, Clock, Users, Lock, Mail, ArrowRight, ArrowLeft, Eye, EyeOff, User } from "lucide-react";
import { BrandWordmark } from "./BrandAssets";

interface LoginPageProps {
  onBrowseAsGuest?: () => void;
  initialShowAuth?: boolean;
  initialIsRegistering?: boolean;
}

export default function LoginPage({ 
  onBrowseAsGuest,
  initialShowAuth = false,
  initialIsRegistering = false
}: LoginPageProps = {}) {
  const [showAuth, setShowAuth] = useState(initialShowAuth);
  const [isRegistering, setIsRegistering] = useState(initialIsRegistering);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Scroll reveal effect for sections
  useEffect(() => {
    if (showAuth) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-8');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => {
      section.classList.add('transition-all', 'duration-1000', 'opacity-0', 'translate-y-8');
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, [showAuth]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Naive .edu validation for Alpha
    if (isRegistering && !email.toLowerCase().endsWith(".edu")) {
      setError("Registration requires an active .edu email address.");
      return;
    }

    if (isRegistering) {
      const uName = username.trim();
      if (!uName) {
        setError("Please pick a username for registration.");
        return;
      }
      if (uName.length < 3 || uName.length > 20 || !/^[a-zA-Z0-9]+$/.test(uName)) {
        setError("Your username must be 3-20 alphanumeric characters.");
        return;
      }

      setLoading(true);
      try {
        const uQuery = query(collection(db, "users"), where("username", "==", uName));
        const qSnap = await getDocs(uQuery);
        if (!qSnap.empty) {
          setError(`The username "${username}" is already taken. Please pick a different username.`);
          setLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn("Firestore uniqueness checking failed, continuing with fallback propagation: ", err);
      }
    } else {
      setLoading(true);
    }

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email.toLowerCase(),
          username: username.trim().toLowerCase(),
          fullName: "",
          photoUrl: "",
          university: "",
          dorm: "",
          onboardingCompleted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await sendEmailVerification(userCredential.user);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
         setError("This account already exists. We've switched you to the Sign-In screen so you can log in directly.");
         setIsRegistering(false);
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
         setError("Invalid email or password. Please try again.");
      } else if (err.code === 'auth/operation-not-allowed') {
         setError("Email/Password Auth is disabled in Firebase! Enable it in your Firebase Console > Authentication > Sign-in method.");
      } else {
         setError(err.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your university email to reset your password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || "An error occurred sending the password reset email.");
    } finally {
      setLoading(false);
    }
  };

  const openAuth = (register: boolean) => {
    setIsRegistering(register);
    setShowAuth(true);
  };

  if (showAuth) {
    return (
      <div className="bg-background text-foreground flex flex-col min-h-screen relative overflow-x-hidden">
        {/* Top Navigation Bar */}
        <header className="bg-background border-b border-border flex justify-between items-center h-[72px] px-6 md:px-10 w-full fixed top-0 z-50">
          <div className="flex items-center gap-2">
            <BrandWordmark size="md" />
          </div>
          <nav className="hidden md:flex gap-6"></nav>
          <div>
            <button 
              onClick={() => setShowAuth(false)}
              className="text-sm font-semibold text-primary border border-primary px-4 py-1.5 rounded transition-all hover:bg-muted cursor-pointer"
            >
              Back
            </button>
          </div>
        </header>

        <main className="flex-grow flex flex-col md:flex-row items-center justify-center pt-[72px] relative">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-1/3 h-full bg-muted/80 -skew-x-12 transform translate-x-24 z-0 hidden md:block"></div>
          
          <div className="mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center gap-8 lg:gap-16 relative z-10 w-full max-w-[1200px] py-16">
            
            {/* Left Side: Editorial Content */}
            <div className="w-full md:w-1/2 flex flex-col gap-6">
              <div className="inline-block px-3 py-1 bg-secondary rounded-full w-fit">
                <span className="text-sm font-semibold text-primary">Exclusively for Campus</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-medium text-primary leading-tight">
                {isForgotPassword ? (
                  <>Reset <br className="hidden md:block" />Password.</>
                ) : isRegistering ? (
                  <>Join your <br className="hidden md:block" />Campus.</>
                ) : (
                  <>Welcome <br className="hidden md:block" />Back.</>
                )}
              </h1>
              <p className="text-lg text-muted-foreground max-w-[480px] leading-relaxed">
                Connect with your peers, trade campus essentials, and access the secure university network. Befakor is the marketplace built for your community.
              </p>
              
              {/* Bento-style decorative image for mood */}
              <div className="mt-6 hidden md:block group">
                <div className="relative overflow-hidden rounded-xl h-64 w-full bg-muted shadow-sm">
                  <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                  <img 
                    alt="Campus environment" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBQVRx6kEikpiE9sqeqE-o0QDPRbZsYVG0wN9seXPWZ7XuY8KqMsFUZhWH3uHFL8Is36PDqRDcH0nrJ_NgNzLRp1QVFsCY9wFRXQ51V24KfQ-THlTacAfTUylplayy5lg9EHGbyEiNhZvDRmTaETzmC3Eamot8qbMBthPkOew10_gYTXCAqWtFOrwEQ6-f2exhXD7kJiNVaLaL-IYiT9OvNacB8yAV7x2LUio3Jog9C22qiAq37zQTwyvJyp3789lx69V39MzlC-6g"
                  />
                </div>
              </div>
            </div>

            {/* Right Side: Form Container */}
            <div className="w-full md:w-[480px]">
              <div className="bg-card p-6 md:p-10 rounded-xl shadow-sm border border-border">
                <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="flex flex-col gap-6">
                  
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.55">
                      <label className="text-sm font-semibold text-primary block" htmlFor="university_email">
                        University Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          id="university_email"
                          type="email"
                          placeholder="yourname@university.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={`w-full pl-4 pr-10 py-3.5 bg-background border ${email.toLowerCase().endsWith('.edu') ? 'border-primary' : 'border-foreground'} rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none font-sans text-base`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
                          <Mail className="w-5 h-5" />
                        </div>
                      </div>
                      {isRegistering && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                          Must be a valid .edu email address for verification.
                        </p>
                      )}
                    </div>

                    {isRegistering && (
                      <div className="space-y-1.55">
                        <label className="text-sm font-semibold text-primary block" htmlFor="username">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            id="username"
                            type="text"
                            placeholder="e.g. alex_campus"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full pl-4 pr-10 py-3.5 bg-background border border-foreground rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none font-sans text-base font-mono"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center">
                            <User className="w-5 h-5" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                          <User className="w-4 h-4 text-primary flex-shrink-0" />
                          Must be 3-20 alphanumeric characters.
                        </p>
                      </div>
                    )}
                    
                    {!isForgotPassword && (
                      <div className="space-y-1.55">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-primary block" htmlFor="password">
                            Password <span className="text-red-500">*</span>
                          </label>
                          {!isRegistering && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsForgotPassword(true);
                                setError("");
                                setResetEmailSent(false);
                              }}
                              className="text-xs text-primary underline hover:text-primary/80 cursor-pointer"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input 
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={!isForgotPassword}
                            minLength={6}
                            className="w-full pl-4 pr-12 py-3.5 bg-background border border-foreground rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all outline-none font-sans text-base"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center justify-center p-1"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                      {error}
                    </div>
                  )}

                  {resetEmailSent && (
                    <div className="p-3 text-sm font-medium text-primary bg-secondary/30 rounded-md border border-primary/20 flex items-start gap-2">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <span>Password reset email sent! Please check your inbox and spam folder.</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading || resetEmailSent}
                    className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Please wait..." : isForgotPassword ? "Send Reset Email" : isRegistering ? "Send Verification Link" : "Sign In"}
                    {!loading && !resetEmailSent && <ArrowRight className="w-5 h-5" />}
                  </button>

                  <div className="flex items-center gap-4 my-2">
                    <div className="flex-grow h-px bg-border"></div>
                    <span className="text-xs text-muted-foreground font-semibold">OR</span>
                    <div className="flex-grow h-px bg-border"></div>
                  </div>

                  <div className="flex flex-col gap-3 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {isForgotPassword ? (
                        <>
                          Remember your password?{" "}
                          <button 
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(false);
                              setError("");
                              setResetEmailSent(false);
                            }}
                            className="text-primary font-bold underline decoration-secondary decoration-2 hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            Sign In
                          </button>
                        </>
                      ) : (
                        <>
                          {isRegistering ? "Already have an account? " : "Don't have an account? "}
                          <button 
                            type="button"
                            onClick={() => {
                              setIsRegistering(!isRegistering);
                              setError("");
                              setIsForgotPassword(false);
                            }}
                            className="text-primary font-bold underline decoration-secondary decoration-2 hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            {isRegistering ? "Sign In" : "Join Now"}
                          </button>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2 px-6">
                      By continuing, you agree to our <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-primary transition-colors">Privacy Policy</a>.
                    </p>
                  </div>
                </form>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex justify-center gap-8 items-center opacity-70">
                <div className="flex items-center gap-1.5 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-semibold">Secure Login</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary">
                  <Lock className="w-5 h-5" />
                  <span className="text-sm font-semibold">Privacy First</span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 pointer-events-none grid-pattern z-0" />

      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border">
        <div className="flex justify-between items-center h-[72px] px-4 md:px-10 w-full max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2">
            <BrandWordmark size="md" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-sm font-semibold text-primary border-b-2 border-secondary py-1" href="#marketplace">Marketplace</a>
            <a className="text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors px-2 py-1 rounded" href="#how-it-works">How it Works</a>
            <a className="text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors px-2 py-1 rounded" href="#safety">Safety</a>
          </nav>
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => openAuth(false)} className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity cursor-pointer">Login</button>
            <button onClick={() => openAuth(true)} className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-all shadow-sm cursor-pointer">Join Campus</button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-[72px] flex flex-col min-h-[calc(100vh-72px)]">
        {/* Hero Section */}
        <section className="min-h-[795px] flex flex-col items-center justify-center text-center px-4 md:px-10 hero-gradient">
          <div className="max-w-[900px] space-y-10">
            <div className="inline-flex items-center gap-2 bg-muted/80 px-3 py-1.5 rounded-full border border-border/30">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">University Verified Only</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-medium text-primary leading-tight">
              Liquidate your apartment <br className="hidden md:block" /> <span className="italic font-light">in minutes.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-[600px] mx-auto leading-relaxed">
              The hyper-local marketplace for verified university students. Sell your furniture, textbooks, and tech to peers you can trust.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button onClick={() => openAuth(true)} className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  if (onBrowseAsGuest) {
                    onBrowseAsGuest();
                  } else {
                    openAuth(false);
                  }
                }} 
                className="w-full sm:w-auto bg-transparent border-2 border-primary text-primary font-semibold px-8 py-4 rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Browse Listings
              </button>
            </div>
          </div>
          
          {/* Abstract Bento Preview */}
          <div className="mt-16 w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
            <div className="md:col-span-4 glass-card rounded-2xl p-6 flex flex-col gap-3 text-left">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Store className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-display text-primary">Move-out Ready</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Bundle your entire apartment decor for the next incoming resident. Effortless handovers.</p>
            </div>
            <div className="md:col-span-5 relative overflow-hidden rounded-2xl h-[280px] group shadow-xl">
              <img 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="Modern university student apartment" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwlRPDR3Y_tnD0wS6APnJEu8t6OcMurF9J_h_Dw2bu6jRxZOqd1gDv_blyBhUwWnfvGLpwk0i-GlZl5ZOaekbDq-Co_NLAhers0nZdOw8rdwqBgsOXtJyiSsJz7HZw9HfUyicf_t5xNRlu3dukDdtYUx76exMWgqtebuvQ2XxivDKvGu2fkVyXlDuGdiQ6tKLZtqUbq_1BIcmqXiR13gw4qqv88mlk_aSkPP0avJOYQH89_jClNKSE-TMuih0neW8f1XvwxcVEpFI"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-6">
                <span className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Featured Listing</span>
                <h4 className="text-white font-display text-2xl font-medium">Complete Dorm Kit</h4>
              </div>
            </div>
            <div className="md:col-span-3 glass-card rounded-2xl p-6 flex flex-col justify-center items-center gap-2 text-center border-2 border-secondary">
              <span className="text-5xl font-display font-medium text-primary">12k+</span>
              <span className="text-sm font-semibold text-muted-foreground outline-none">Active Students</span>
              <div className="flex -space-x-2 mt-2">
                <div className="w-8 h-8 rounded-full border-2 border-background bg-zinc-200"></div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-zinc-300"></div>
                <div className="w-8 h-8 rounded-full border-2 border-background bg-zinc-400"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section id="how-it-works" className="py-24 bg-muted/50 border-t border-y-border">
          <div className="max-w-[1200px] mx-auto px-4 md:px-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="max-w-[450px] space-y-4">
                <h2 className="text-3xl font-display font-medium text-primary">Built by students, for students.</h2>
                <p className="text-base text-muted-foreground leading-relaxed">We understand the campus rhythm. No ghosting, no sketchy meetups—just peer-to-peer commerce within your university network.</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 w-full md:w-auto">
                <div className="flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-secondary mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">ID Verified</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <CreditCard className="w-8 h-8 text-secondary mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Secure Sales</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <MapPin className="w-8 h-8 text-secondary mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Campus-only</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Leaf className="w-8 h-8 text-secondary mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Sustainable</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* High Impact Feature Callout */}
        <section className="py-24 px-4 md:px-10 flex-1 flex flex-col justify-center">
          <div className="max-w-[1200px] mx-auto bg-secondary rounded-[24px] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="md:w-1/2 space-y-6 z-10">
              <h2 className="text-4xl md:text-5xl font-display font-medium text-primary leading-tight">Ready to clear your space?</h2>
              <p className="text-lg text-primary/80">List your items in under 60 seconds. Our AI-assisted drafting generates descriptions instantly to help you get started quickly.</p>
              <button 
                onClick={() => openAuth(true)}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all cursor-pointer inline-flex"
              >
                Start Listing Now
              </button>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 gap-4 z-10 mt-8 md:mt-0">
              <div className="bg-white/50 backdrop-blur rounded-xl p-5 space-y-2 shadow-sm border border-white/20 transform hover:-translate-y-2 transition-transform">
                <Sparkles className="w-6 h-6 text-primary" />
                <p className="font-semibold text-sm text-primary">Instant AI Drafting</p>
              </div>
              <div className="bg-white/50 backdrop-blur rounded-xl p-5 space-y-2 shadow-sm border border-white/20 transform hover:-translate-y-2 transition-transform delay-75">
                <Lock className="w-6 h-6 text-primary" />
                <p className="font-semibold text-sm text-primary">Safe Campus Trades</p>
              </div>
              <div className="bg-white/50 backdrop-blur rounded-xl p-5 space-y-2 shadow-sm border border-white/20 transform hover:-translate-y-2 transition-transform delay-100">
                <Mail className="w-6 h-6 text-primary" />
                <p className="font-semibold text-sm text-primary">Verified Student Peers</p>
              </div>
              <div className="bg-white/50 backdrop-blur rounded-xl p-5 space-y-2 shadow-sm border border-white/20 transform hover:-translate-y-2 transition-transform delay-150">
                <MapPin className="w-6 h-6 text-primary" />
                <p className="font-semibold text-sm text-primary">Campus Map Discovery</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border w-full py-6 px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-1">
          <BrandWordmark size="sm" />
          <p className="text-xs text-muted-foreground">© 2026 Befakor Marketplace. University Student Network.</p>
        </div>
        <div className="flex gap-6">
          <a className="text-xs text-muted-foreground hover:text-primary transition-all font-medium" href="#">Terms of Service</a>
          <a className="text-xs text-muted-foreground hover:text-primary transition-all font-medium" href="#">Privacy Policy</a>
          <a className="text-xs text-muted-foreground hover:text-primary transition-all font-medium" href="#">Campus Safety</a>
        </div>
      </footer>
    </div>
  );
}
