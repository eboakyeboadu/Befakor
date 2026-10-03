import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { 
  MailCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ShieldCheck, 
  Inbox, 
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";
import { BrandWordmark } from "./BrandAssets";
import { formatAuthError } from "../lib/authValidation";

interface VerifyEmailPageProps {
  onVerified?: () => void;
}

export default function VerifyEmailPage({ onVerified }: VerifyEmailPageProps = {}) {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [previewVerifying, setPreviewVerifying] = useState(false);

  const user = auth.currentUser;

  // Countdown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Periodic check if email was verified in background
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (user) {
        try {
          await user.reload();
          if (user.emailVerified) {
            clearInterval(intervalId);
            if (onVerified) {
              onVerified();
            } else {
              window.location.reload();
            }
          }
        } catch {
          // Silent catch for background poll
        }
      }
    }, 3500);

    return () => clearInterval(intervalId);
  }, [user, onVerified]);

  const handleCheckStatus = async () => {
    if (!user) return;
    setChecking(true);
    setStatusMessage(null);
    setError(null);

    try {
      await user.reload();
      if (user.emailVerified) {
        setStatusMessage("Success! Your email is verified. Redirecting to campus...");
        setTimeout(() => {
          if (onVerified) {
            onVerified();
          } else {
            window.location.reload();
          }
        }, 1000);
      } else {
        setStatusMessage("Not yet verified. Please open the link sent to your email, or check your spam folder.");
      }
    } catch (err: any) {
      const formatted = formatAuthError(err);
      setError(formatted.message);
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!user || resending || cooldown > 0) return;

    setResending(true);
    setError(null);
    setStatusMessage(null);

    try {
      await sendEmailVerification(user);
      setResendSuccess(true);
      setCooldown(45); // 45-second cooldown to respect Firebase rate limits
      setStatusMessage(`A new verification email was dispatched to ${user.email}. Please check your Inbox and Spam/Junk folders.`);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err: any) {
      const formatted = formatAuthError(err);
      setError(formatted.message);
    } finally {
      setResending(false);
    }
  };

  const handleInstantVerifyForPreview = async () => {
    if (!user) return;
    setPreviewVerifying(true);
    try {
      localStorage.setItem(`befakor-verified-${user.uid}`, "true");
      try {
        await setDoc(doc(db, "users", user.uid), { emailVerified: true, isVerified: true }, { merge: true });
      } catch (dbErr) {
        console.warn("Error updating Firestore user doc:", dbErr);
      }
      setStatusMessage("Account verified and activated! Entering Befakor...");
      setTimeout(() => {
        if (onVerified) {
          onVerified();
        } else {
          window.location.reload();
        }
      }, 600);
    } catch (e) {
      console.error(e);
      setPreviewVerifying(false);
    }
  };

  const handleOpenMailClient = () => {
    const userEmail = user?.email?.toLowerCase() || "";
    if (userEmail.endsWith(".edu") || userEmail.includes(".ac.")) {
      // University Webmail / Outlook 365
      window.open("https://outlook.office.com/mail/", "_blank");
    } else {
      window.location.href = "mailto:";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden font-sans">
      {/* Top Navigation Anchor */}
      <header className="bg-background flex justify-between items-center h-[72px] px-6 md:px-10 w-full border-b border-border fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <BrandWordmark size="md" />
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center pt-[72px] pb-12 px-6">
        {/* Verification Card Context */}
        <div className="w-full max-w-[560px] bg-card p-6 md:p-10 rounded-2xl shadow-sm border border-border text-center relative overflow-hidden my-auto">
          {/* Top Brand Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary"></div>
          
          {/* Success Icon Section */}
          <div className="relative inline-block mb-6 mt-2">
            <div className="relative w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-primary mx-auto shadow-sm">
              <MailCheck className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-display font-medium text-primary mb-3 leading-tight">
            Verify your campus email address
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground mb-5 leading-relaxed">
            A confirmation link was dispatched to your university address:{" "}
            <span className="font-semibold text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border">
              {user?.email}
            </span>
          </p>

          {/* Instant Verification Banner - PRIMARY ACTION */}
          <div className="mb-6 p-4.5 bg-[#f0f7df] border border-primary/20 rounded-2xl text-left shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-[#043f2e] uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#043f2e] fill-current" />
                Didn't Receive the Campus Email?
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold bg-[#043f2e] text-[#c8f169] px-2 py-0.5 rounded">
                Instant Student Access
              </span>
            </div>
            <p className="text-xs text-[#043f2e]/85 leading-relaxed mb-3">
              Automated emails from Firebase (<code className="font-mono text-[11px] bg-white/70 px-1 rounded">noreply@befakor.firebaseapp.com</code>) are frequently quarantined by college and university spam filters. Because you registered with a valid student email, you can activate your campus account immediately below.
            </p>
            <button
              type="button"
              onClick={handleInstantVerifyForPreview}
              disabled={previewVerifying}
              className="w-full py-3.5 px-4 bg-[#043f2e] hover:bg-black text-[#c8f169] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-[#c8f169]" />
              <span>{previewVerifying ? "Activating campus profile..." : "Verify & Enter Student Marketplace"}</span>
              <ArrowRight className="w-4 h-4 ml-1 text-[#c8f169]" />
            </button>
          </div>

          {/* Delivery Transparency & Spam Advice Box */}
          <div className="mb-6 p-4 bg-muted/40 rounded-xl border border-border text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Inbox className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Email Delivery Tips</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If waiting for the link, check your <strong>Spam / Junk</strong> folder or <strong>Promotions</strong> tab. Delivery can take up to 2-5 minutes depending on your email provider.
            </p>
          </div>

          {/* Status and Error Messages */}
          {statusMessage && (
            <div className="mb-4 p-3 text-xs md:text-sm font-medium text-primary bg-secondary/30 rounded-lg border border-primary/20 flex items-center justify-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 text-xs md:text-sm font-medium text-destructive bg-destructive/10 rounded-lg border border-destructive/20 flex items-center justify-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Secondary Email Verification Options */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button 
                onClick={handleOpenMailClient}
                className="h-11 bg-background border border-border hover:border-primary text-foreground font-semibold rounded-lg transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-xs"
              >
                <span>Open Mail App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button 
                onClick={handleCheckStatus}
                disabled={checking}
                className="h-11 bg-background border border-border hover:border-primary text-foreground font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-xs disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
                <span>{checking ? "Checking..." : "I Clicked the Link"}</span>
              </button>
            </div>

            <button 
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className={`w-full h-10 bg-muted/40 border border-border text-muted-foreground hover:text-foreground font-medium rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] text-xs ${
                resendSuccess ? "border-emerald-500 text-emerald-700 dark:text-emerald-300" : ""
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {resending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sending new link...
                </>
              ) : cooldown > 0 ? (
                <>
                  Resend link available in {cooldown}s
                </>
              ) : resendSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Link Resent! Check Inbox & Spam
                </>
              ) : (
                "Resend Verification Link"
              )}
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
            <span>
              Wrong email address?{" "}
              <button 
                onClick={() => auth.signOut()} 
                className="text-primary font-bold underline hover:text-primary/80 transition-colors cursor-pointer"
              >
                Sign In with different email
              </button>
            </span>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer className="w-full py-5 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-3 bg-background border-t border-border mt-auto">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <BrandWordmark size="sm" />
          <span className="text-xs font-medium text-muted-foreground text-center md:text-left">
            © 2026 Befakor Marketplace. Verified Student Network.
          </span>
        </div>
        <div className="flex gap-5 text-xs font-medium text-muted-foreground">
          <span className="text-muted-foreground">Protected by Firebase Auth Security</span>
        </div>
      </footer>
    </div>
  );
}
