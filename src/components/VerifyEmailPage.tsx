import { useState, useEffect } from "react";
import { auth } from "../lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { Store, MailCheck, ExternalLink, RefreshCw, HelpCircle, CheckCircle } from "lucide-react";
import { BrandWordmark } from "./BrandAssets";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    // Poll to check if email was verified
    const intervalId = setInterval(async () => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          // This will trigger a re-render in App.tsx as we update a state there, 
          // or we can force reload the window to trigger the state change
          window.location.reload();
        }
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleResend = async () => {
    if (!user) return;
    
    setResending(true);
    setError("");
    
    try {
      await sendEmailVerification(user);
      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to resend email.");
    } finally {
      setResending(false);
    }
  };

  const handleOpenEmail = () => {
    // Attempt to open default mail client
    // For many users, just opening mailto: might open their email client,
    // though gmail users might prefer a direct link to gmail.com.
    // Given the constraints, we'll try a generic mail app link if possible,
    // or just open a new tab to gmail/outlook. Due to cross platform nature,
    // we can just open mailto mechanism which triggers default app.
    window.location.href = "mailto:";
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
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

      <main className="flex-grow flex items-center justify-center pt-[72px] pb-10 px-6">
        {/* Verification Card Context */}
        <div className="w-full max-w-[480px] bg-card p-8 md:p-10 rounded-xl shadow-sm border border-border text-center relative overflow-hidden">
          {/* Atmospheric Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
          
          {/* Success Icon/Illustration Section */}
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-secondary rounded-full animate-ping opacity-20 scale-150 duration-1000"></div>
            <div className="relative w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-primary mx-auto shadow-sm">
              <MailCheck className="w-12 h-12 text-primary" />
            </div>
          </div>

          {/* Content */}
          <h1 className="text-3xl md:text-4xl font-display font-medium text-primary mb-4 leading-tight">
            Check your inbox.
          </h1>
          <p className="text-base text-muted-foreground mb-8 leading-relaxed">
            We've sent a verification link to your <span className="font-semibold text-primary">{user?.email}</span> address. Please click the link to confirm your account and start exploring the marketplace.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button 
              onClick={handleOpenEmail}
              className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              Open Email App
              <ExternalLink className="w-5 h-5" />
            </button>
            <button 
              onClick={handleResend}
              disabled={resending || resendSuccess}
              className={`w-full h-12 bg-background border border-primary text-primary font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${resendSuccess ? 'bg-secondary border-transparent text-primary' : 'hover:bg-muted'}`}
            >
              {resending ? (
                <><RefreshCw className="w-5 h-5 animate-spin" /> Sending...</>
              ) : resendSuccess ? (
                <><CheckCircle className="w-5 h-5" /> Email Sent!</>
              ) : (
                "Resend Email"
              )}
            </button>
            
            {error && (
              <p className="text-sm text-destructive mt-2">{error}</p>
            )}
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              Wrong email address?{" "}
              <button onClick={() => auth.signOut()} className="text-primary font-bold underline decoration-secondary hover:text-primary/80 transition-colors cursor-pointer">
                Change Email
              </button>
            </p>
            <a href="#" className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4" />
              Need help? Contact support
            </a>
          </div>
        </div>
      </main>

      {/* Footer Shell */}
      <footer className="w-full py-6 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-background border-t border-border mt-auto">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <BrandWordmark size="sm" />
          <span className="text-xs font-medium text-muted-foreground text-center md:text-left">
            © 2026 Befakor Marketplace. Student Network.
          </span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-primary transition-all">Terms of Service</a>
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-primary transition-all">Privacy Policy</a>
          <a href="#" className="text-xs font-medium text-muted-foreground hover:text-primary transition-all">Campus Safety</a>
        </div>
      </footer>
    </div>
  );
}
