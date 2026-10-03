import { useState, useEffect, FormEvent } from "react";
import { auth, db } from "../lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Store, ShieldCheck, CreditCard, MapPin, Leaf, Sparkles, Clock, Users, Lock, Mail, ArrowRight, ArrowLeft, Eye, EyeOff, User, CheckCircle2, AlertCircle, Loader2, Shield, ShieldAlert, GraduationCap } from "lucide-react";
import { BrandWordmark } from "./BrandAssets";
import { evaluatePassword, validateUsernameFormat, checkUsernameAvailability, formatAuthError, AuthErrorDetails, isStudentEmail, getStudentEmailValidation } from "../lib/authValidation";

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
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [authError, setAuthError] = useState<AuthErrorDetails | null>(null);
  const [loading, setLoading] = useState(false);

  // Evaluate password strength whenever password input changes
  const passwordEval = evaluatePassword(password);

  // Real-time evaluation of student university email validity
  const liveStudentValidation = getStudentEmailValidation(email);

  // Real-time debounced username validation & uniqueness check
  useEffect(() => {
    if (!isRegistering) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    const formatCheck = validateUsernameFormat(trimmed);
    if (!formatCheck.valid) {
      setUsernameStatus("invalid");
      setUsernameMessage(formatCheck.error || "Invalid username format.");
      return;
    }

    setUsernameStatus("checking");
    setUsernameMessage("Checking availability across campus...");

    const timeoutId = setTimeout(async () => {
      const result = await checkUsernameAvailability(trimmed);
      if (result.available) {
        setUsernameStatus("available");
        setUsernameMessage(`@${trimmed.toLowerCase()} is available!`);
      } else {
        setUsernameStatus("taken");
        setUsernameMessage(result.error || `The username "@${trimmed.toLowerCase()}" is already taken.`);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [username, isRegistering]);

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
    setAuthError(null);
    
    const trimmedEmail = email.trim().toLowerCase();
    
    // Strict Campus / Student Email Validation
    const studentCheck = getStudentEmailValidation(trimmedEmail);
    if (!studentCheck.isValid) {
      setAuthError({
        title: "Student Email Required",
        message: studentCheck.error || "Befakor is an exclusive campus marketplace. Only official college or university email addresses (.edu or academic domain) are allowed.",
        type: "email",
      });
      return;
    }

    if (isRegistering) {
      const uName = username.trim();
      const formatCheck = validateUsernameFormat(uName);
      if (!formatCheck.valid) {
        setAuthError({
          title: "Invalid Username Format",
          message: formatCheck.error || "Please choose a valid username (3-20 characters: letters, numbers, or underscores).",
          type: "general",
        });
        return;
      }

      // Re-verify password requirements
      if (!passwordEval.isSufficient) {
        setAuthError({
          title: "Password does not meet requirements",
          message: "To keep your campus account secure, please fulfill all required criteria before continuing:",
          missingRequirements: passwordEval.missingRequirements,
          type: "password",
        });
        return;
      }

      setLoading(true);
      
      // Confirm username uniqueness right before account creation
      const availCheck = await checkUsernameAvailability(uName);
      if (!availCheck.available) {
        setAuthError({
          title: "Username Already Taken",
          message: availCheck.error || `The username "@${uName}" is already claimed by another student.`,
          type: "general",
        });
        setUsernameStatus("taken");
        setUsernameMessage(availCheck.error || "Username is already taken.");
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    try {
      if (isRegistering) {
        const uNameLower = username.trim().toLowerCase();
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);

        // Pre-authorize session for verified student
        try {
          localStorage.setItem(`befakor-verified-${userCredential.user.uid}`, "true");
        } catch (e) {
          console.warn("Storage error:", e);
        }

        // Attempt verification email dispatch
        try {
          await sendEmailVerification(userCredential.user);
        } catch (mailErr) {
          console.warn("sendEmailVerification warning:", mailErr);
        }

        // Atomically create verified student user profile and reserve the unique username
        try {
          const batch = writeBatch(db);
          batch.set(doc(db, "users", userCredential.user.uid), {
            email: trimmedEmail,
            username: uNameLower,
            fullName: "",
            photoUrl: "",
            university: studentCheck.schoolName || "University Campus",
            dorm: "",
            onboardingCompleted: true,
            emailVerified: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          batch.set(doc(db, "usernames", uNameLower), {
            uid: userCredential.user.uid,
            createdAt: serverTimestamp(),
          });
          await batch.commit();
        } catch (dbErr) {
          console.error("Firestore user creation error:", dbErr);
        }
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setIsRegistering(false);
      }
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setAuthError({
        title: "Email Required",
        message: "Please enter your registered university (.edu) email address to receive password reset instructions.",
        type: "email",
      });
      return;
    }

    const studentCheck = getStudentEmailValidation(trimmedEmail);
    if (!studentCheck.isValid) {
      setAuthError({
        title: "Student Email Required",
        message: studentCheck.error || "Password reset is restricted to registered university (.edu) student accounts.",
        type: "email",
      });
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetEmailSent(true);
    } catch (err: any) {
      setAuthError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Centralized navigation helpers to cleanly transition modes and avoid stuck states
  const resetFormState = (clearFields = false) => {
    setIsForgotPassword(false);
    setResetEmailSent(false);
    setAuthError(null);
    if (clearFields) {
      setEmail("");
      setPassword("");
      setUsername("");
    }
  };

  const switchToSignIn = (clearFields = false) => {
    setIsRegistering(false);
    resetFormState(clearFields);
  };

  const switchToRegister = (clearFields = false) => {
    setIsRegistering(true);
    resetFormState(clearFields);
  };

  const switchToForgotPassword = () => {
    setIsForgotPassword(true);
    setResetEmailSent(false);
    setAuthError(null);
  };

  const openAuth = (register: boolean, clearFields = false) => {
    setIsRegistering(register);
    resetFormState(clearFields);
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
              onClick={() => {
                setShowAuth(false);
                resetFormState(false);
              }}
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
                
                {/* Top Mode Toggles */}
                <div className="flex bg-muted/70 p-1 rounded-lg mb-6 border border-border/70">
                  <button
                    type="button"
                    onClick={() => switchToSignIn(false)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      !isRegistering && !isForgotPassword
                        ? "bg-background text-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => switchToRegister(false)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      isRegistering
                        ? "bg-background text-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Join Campus
                  </button>
                </div>

                {resetEmailSent ? (
                  /* Dedicated Clean Confirmation Screen matching platform design */
                  <div className="flex flex-col items-center text-center py-2 space-y-5 animate-in fade-in">
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Mail className="w-7 h-7 text-primary" />
                    </div>

                    <div className="space-y-2 max-w-sm">
                      <h3 className="text-2xl font-display font-medium text-primary">
                        Check Your Email
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        If an account exists for <span className="font-semibold text-foreground">{email}</span>, a reset link could be sent.
                      </p>
                    </div>

                    <div className="w-full space-y-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => switchToSignIn(false)}
                        className="w-full h-12 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/95 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <span>Sign In with Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => switchToSignIn(true)}
                        className="w-full h-11 bg-transparent hover:bg-muted text-foreground font-medium text-sm rounded-lg transition-colors border border-border flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Sign in with another account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchToRegister(false)}
                        className="w-full text-xs text-muted-foreground hover:text-primary transition-colors pt-2 cursor-pointer"
                      >
                        Need an account? <span className="font-semibold text-primary underline">Join Campus</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="flex flex-col gap-6">
                    
                    {isForgotPassword && (
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <div>
                          <h4 className="text-sm font-semibold text-primary">Reset Password</h4>
                          <p className="text-xs text-muted-foreground">Enter your university email to receive a password reset link.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => switchToSignIn(false)}
                          className="text-xs text-primary font-medium hover:underline cursor-pointer"
                        >
                          ← Back
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-primary block" htmlFor="university_email">
                          University / Student Email <span className="text-red-500">*</span>
                        </label>
                        {liveStudentValidation.isValid ? (
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {liveStudentValidation.schoolName || "Verified Student"}
                          </span>
                        ) : liveStudentValidation.isPersonal ? (
                          <span className="text-[11px] font-bold text-destructive flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/25">
                            <AlertCircle className="w-3 h-3" />
                            No Personal Emails
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 text-primary" />
                            .edu Required
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          id="university_email"
                          type="email"
                          placeholder="alex@stanford.edu or student@university.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className={`w-full pl-4 pr-10 py-3.5 bg-background border rounded-lg focus:outline-none focus:ring-4 transition-all outline-none font-sans text-base ${
                            liveStudentValidation.isValid
                              ? 'border-emerald-600 focus:ring-emerald-500/10'
                              : liveStudentValidation.isPersonal
                              ? 'border-destructive focus:ring-destructive/10'
                              : 'border-foreground/30 focus:border-primary focus:ring-primary/5'
                          }`}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground flex items-center pointer-events-none">
                          {liveStudentValidation.isValid ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : liveStudentValidation.isPersonal ? (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          ) : (
                            <Mail className="w-5 h-5" />
                          )}
                        </div>
                      </div>

                      {/* Dynamic validation hints & personal email warning */}
                      {liveStudentValidation.isPersonal ? (
                        <div className="p-2.5 bg-destructive/10 border border-destructive/25 rounded-lg flex items-start gap-2 text-xs text-destructive mt-1.5 animate-in fade-in">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                          <div className="space-y-0.5">
                            <p className="font-semibold leading-tight">Personal Email Not Allowed (@{liveStudentValidation.domain})</p>
                            <p className="text-[11px] opacity-90 leading-relaxed">
                              Befakor is strictly for enrolled students. Personal services (Gmail, Yahoo, Outlook, etc.) cannot be used. Please enter your official college or university email.
                            </p>
                          </div>
                        </div>
                      ) : liveStudentValidation.isValid ? (
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mt-1.5 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Campus Access Verified: <strong>{liveStudentValidation.schoolName}</strong></span>
                        </p>
                      ) : null}
                    </div>

                    {isRegistering && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-semibold text-primary block" htmlFor="username">
                            Username <span className="text-red-500">*</span>
                          </label>
                          {usernameStatus === "checking" && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Checking...
                            </span>
                          )}
                          {usernameStatus === "available" && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Available
                            </span>
                          )}
                          {usernameStatus === "taken" && (
                            <span className="text-xs text-destructive font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Unavailable
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-semibold select-none pointer-events-none text-sm">
                            @
                          </div>
                          <input 
                            id="username"
                            type="text"
                            placeholder="alex_campus"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            required
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            className={`w-full pl-8 pr-10 py-3.5 bg-background border rounded-lg focus:outline-none focus:ring-4 transition-all font-mono text-base ${
                              usernameStatus === "available"
                                ? "border-emerald-600 dark:border-emerald-500 focus:ring-emerald-500/10"
                                : usernameStatus === "taken" || usernameStatus === "invalid"
                                ? "border-destructive focus:ring-destructive/10"
                                : "border-foreground focus:ring-primary/5"
                            }`}
                          />
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                            {usernameStatus === "checking" && (
                              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                            )}
                            {usernameStatus === "available" && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                              <AlertCircle className="w-5 h-5 text-destructive" />
                            )}
                            {usernameStatus === "idle" && (
                              <User className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        {usernameMessage && (
                          <p
                            className={`text-xs flex items-center gap-1.5 mt-1.5 font-medium ${
                              usernameStatus === "available"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : usernameStatus === "taken" || usernameStatus === "invalid"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          >
                            {usernameStatus === "available" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : usernameStatus === "taken" || usernameStatus === "invalid" ? (
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                            )}
                            {usernameMessage}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {!isForgotPassword && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-primary block" htmlFor="password">
                            Password <span className="text-red-500">*</span>
                          </label>
                          {!isRegistering && (
                            <button
                              type="button"
                              onClick={switchToForgotPassword}
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
                            onFocus={() => setPasswordFocused(true)}
                            required={!isForgotPassword}
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

                        {isRegistering && password.length > 0 && !passwordEval.isSufficient && (
                          <div className="mt-2.5 p-3 bg-destructive/5 rounded-lg border border-destructive/20 text-xs space-y-1.5 animate-in fade-in">
                            <p className="font-semibold text-destructive flex items-center gap-1.5 text-xs">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              Password requirements not met:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-5">
                              {passwordEval.requirements
                                .filter((req) => !req.met)
                                .map((req) => (
                                  <div key={req.id} className="flex items-center gap-1.5 text-xs text-destructive/90 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                                    <span>{req.label}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {isRegistering && password.length > 0 && passwordEval.isSufficient && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium mt-2 animate-in fade-in">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>All password requirements met</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {authError && (
                    <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm shadow-sm space-y-2 animate-in fade-in duration-200 text-left">
                      <div className="flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-destructive mt-0.5" />
                        <div className="space-y-1.5 w-full">
                          <h4 className="font-semibold text-destructive leading-tight text-sm">
                            {authError.title}
                          </h4>
                          <p className="text-xs text-destructive/90 leading-relaxed">
                            {authError.message}
                          </p>
                          {authError.missingRequirements && authError.missingRequirements.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-destructive/20 space-y-1.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive/90">
                                Missing requirements:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {authError.missingRequirements.map((req, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-xs text-destructive font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                                    <span>{req}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 bg-primary text-primary-foreground font-semibold rounded hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Please wait...
                      </span>
                    ) : isForgotPassword ? (
                      "Send Reset Link"
                    ) : isRegistering ? (
                      "Create Verified Student Account"
                    ) : (
                      "Sign In as Student"
                    )}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>

                  <div className="flex flex-col gap-3 text-center">
                    <p className="text-sm font-medium text-muted-foreground">
                      {isForgotPassword ? (
                        <>
                          Remember your password?{" "}
                          <button 
                            type="button"
                            onClick={() => switchToSignIn(false)}
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
                              if (isRegistering) {
                                switchToSignIn(false);
                              } else {
                                switchToRegister(false);
                              }
                            }}
                            className="text-primary font-bold underline decoration-secondary decoration-2 hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            {isRegistering ? "Sign In" : "Join Now"}
                          </button>
                        </>
                      )}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1 px-6">
                      By continuing, you agree to our <a href="#" className="underline hover:text-primary transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-primary transition-colors">Privacy Policy</a>.
                    </p>
                  </div>
                </form>
              )}
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
        <section className="pt-10 md:pt-14 pb-10 md:pb-12 flex flex-col items-center text-center px-4 md:px-10 hero-gradient">
          <div className="max-w-[900px] space-y-6 md:space-y-8">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
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
          <div className="mt-10 md:mt-12 w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-12 gap-6">
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
              <div className="flex items-center -space-x-2 mt-2.5">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
                  alt="Student member"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs ring-1 ring-black/5"
                />
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120&auto=format&fit=crop"
                  alt="Student member"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs ring-1 ring-black/5"
                />
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=120&auto=format&fit=crop"
                  alt="Student member"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-xs ring-1 ring-black/5"
                />
                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary text-secondary text-[10px] font-bold flex items-center justify-center shadow-xs ring-1 ring-black/5">
                  +12k
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section id="how-it-works" className="py-14 md:py-16 bg-muted/40 border-t border-border">
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
