import { useState, FormEvent } from "react";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Store, Lightbulb, ArrowRight, ArrowLeft, Loader2, UserCircle2 } from "lucide-react";
import { BrandWordmark } from "./BrandAssets";

export default function OnboardingPage({ onComplete }: { onComplete: () => void }) {
  const [university, setUniversity] = useState("");
  const [dorm, setDorm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const user = auth.currentUser;

  const handleSkip = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        email: user?.email || "",
        university: "",
        dorm: "",
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to skip onboarding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!university || !dorm) {
      setError("Please select your location");
      return;
    }
    
    if (!user) return;
    
    setLoading(true);
    setError("");

    try {
      localStorage.setItem("befakor-selected-university", university);
      localStorage.setItem("befakor-selected-dorm", dorm);
    } catch (e) {
      console.error(e);
    }

    try {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        university,
        dorm,
        onboardingCompleted: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || "Failed to set up profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-secondary selection:text-primary">
      {/* Navigation Shell */}
      <header className="flex justify-between items-center h-[72px] px-6 md:px-10 w-full bg-background border-b border-border fixed top-0 z-50">
        <div className="flex items-center gap-2">
          <BrandWordmark size="md" />
        </div>
        <div className="hidden md:flex gap-6 items-center">
          <span className="text-sm font-semibold text-muted-foreground">Step 2 of 2</span>
        </div>
      </header>

      <main className="pt-[112px] pb-16 px-6 md:px-10 min-h-screen flex flex-col items-center flex-grow">
        {/* Progress Indicator */}
        <div className="w-full max-w-[600px] mb-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Setup Progress</span>
            <span className="text-sm font-semibold text-primary">50% Complete</span>
          </div>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-secondary w-1/2 transition-all duration-700 ease-out"></div>
          </div>
        </div>

        {/* Content Layout: Asymmetric Bento Grid Pattern */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1100px] items-start">
          
          {/* Left Column: Illustration / Imagery (Asymmetric) */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-muted group">
              <img 
                alt="University Life" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlyD1IbxS3Ga3cgboorikWnm_xffzOA0fv-TAQ_PNeBcgr3s1SFKm3IIpn0Pp01QqqQDKXTjhjB0yOXyT4mc-__JVKsYp9ZF1L9ojbaZpl4c8kFGKIUzKYxZy-yIXMgiDUF-_HUyofCK_jpsAE6GVpLPN1WoQmbOV2C-YYUTwHtwYZzGARD5iuXoETiutLqfikY4_zSkcunXJVt2lbiTrM58yRX_0JuQkbtOK-Tzoet7y4E-d2lGcAIBWAroI4vwnisTkbb7D1NtM"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-display font-medium text-3xl text-white mb-1">Find what's near you.</p>
                <p className="text-secondary text-sm font-medium">Join thousands of students in your local network.</p>
              </div>
            </div>
            
            <div className="mt-6 p-6 bg-secondary rounded-full flex items-center gap-4">
              <div className="w-12 h-12 bg-primary flex-shrink-0 rounded-full flex items-center justify-center shadow-sm">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-primary font-semibold leading-relaxed">
                Pro tip: Setting your dorm helps us show items within walking distance!
              </p>
            </div>
          </div>

          {/* Right Column: The Form Shell */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-card p-8 md:p-10 rounded-xl shadow-sm border border-border">
              <header className="mb-10">
                <h1 className="text-5xl font-display font-medium text-primary mb-4">Personalize your Hub.</h1>
                <p className="text-lg text-muted-foreground max-w-[500px] leading-relaxed">
                  Connect with your specific campus community. This ensures you see listings from your immediate building and nearby halls.
                </p>
              </header>

              <form className="space-y-8" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                    {error}
                  </div>
                )}
                <div className="space-y-6">
                  {/* University Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary block" htmlFor="university">Select University</label>
                    <div className="relative">
                      <select 
                        id="university"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        className="w-full h-14 pl-4 pr-12 border border-foreground bg-background rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-base cursor-pointer hover:border-primary appearance-none"
                      >
                        <option disabled value="">Search or select your institution</option>
                        <option value="stanford">Stanford University</option>
                        <option value="berkeley">UC Berkeley</option>
                        <option value="mit">MIT</option>
                        <option value="harvard">Harvard University</option>
                        <option value="oxford">University of Oxford</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Dorm Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary block" htmlFor="dorm">Residential Hall / Dorm</label>
                    <div className="relative">
                      <select 
                        id="dorm"
                        value={dorm}
                        onChange={(e) => setDorm(e.target.value)}
                        className="w-full h-14 pl-4 pr-12 border border-foreground bg-background rounded-lg focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none text-base cursor-pointer hover:border-primary appearance-none"
                      >
                        <option disabled value="">Where do you live?</option>
                        <option value="hall-a">North Quad - Hall A</option>
                        <option value="hall-b">South Quad - Hall B</option>
                        <option value="hall-c">West Residence Tower</option>
                        <option value="off-campus">Off-Campus Housing</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-2">
                      Don't worry, we won't show your exact room number to others.
                    </p>
                  </div>
                </div>

                {/* Action Group */}
                <div className="pt-6 flex flex-col md:flex-row items-center gap-6">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto h-14 px-10 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.98]"
                  >
                    {loading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Setting up...</>
                    ) : (
                      <>Enter the Marketplace <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" /></>
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSkip}
                    disabled={loading}
                    className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors underline decoration-secondary decoration-2 underline-offset-4 cursor-pointer"
                  >
                    I'll do this later
                  </button>
                </div>
              </form>
            </div>

            {/* Secondary Content Block: Social Proof (Bento style) */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-muted border border-border rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-sky-600">
                  <UserCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Verified Students</span>
                </div>
                <p className="text-sm text-foreground">Only users with a valid university email can trade in these halls.</p>
              </div>
              <div className="p-6 bg-muted border border-border rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-emerald-600">
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-semibold">Building Delivery</span>
                </div>
                <p className="text-sm text-foreground">Most items can be dropped off at your building's lobby or mailroom.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 bg-background border-t border-border mt-auto">
        <BrandWordmark size="sm" />
        <div className="flex gap-6">
          <a href="#" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-all">Terms of Service</a>
          <a href="#" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-all">Privacy Policy</a>
          <a href="#" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-all">Campus Safety</a>
        </div>
        <div className="text-xs font-medium text-muted-foreground">© 2026 Befakor Marketplace. University Student Network.</div>
      </footer>
    </div>
  );
}
