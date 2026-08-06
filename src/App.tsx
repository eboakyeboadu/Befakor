import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { doc, getDoc, onSnapshot, updateDoc, collection, addDoc } from "firebase/firestore";
import { 
  LogIn, 
  MapPin, 
  Grid, 
  Plus, 
  LogOut, 
  Package2, 
  Layers, 
  KeyRound, 
  Heart,
  User, 
  ShieldCheck,
  Bell,
  Clock,
  Check,
  MessageSquare,
  AlertTriangle,
  Sparkles
} from "lucide-react";

import LoginPage from "./components/LoginPage";
import HomePage from "./components/HomePage";
import CreateListing from "./components/CreateListing";
import VerifyEmailPage from "./components/VerifyEmailPage";
import OnboardingPage from "./components/OnboardingPage";
import SpacePage from "./components/SpacePage";
import VaultPage from "./components/VaultPage";
import AccountPage from "./components/AccountPage";
import ClaimItemModal from "./components/ClaimItemModal";
import { BrandLogomark, BrandWordmark } from "./components/BrandAssets";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [loadingOnboarding, setLoadingOnboarding] = useState(true);
  const [currentMode, setCurrentMode] = useState<"buyer" | "seller">(() => {
    try {
      const stored = localStorage.getItem("befakor-mode");
      return (stored === "seller" || stored === "buyer") ? stored : "buyer";
    } catch {
      return "buyer";
    }
  });
  const [currentView, setCurrentView] = useState<"home" | "create" | "space" | "vault" | "account">(() => {
    try {
      const storedMode = localStorage.getItem("befakor-mode");
      return storedMode === "seller" ? "space" : "home";
    } catch {
      return "home";
    }
  });

  const handleToggleMode = (mode: "buyer" | "seller") => {
    setCurrentMode(mode);
    try {
      localStorage.setItem("befakor-mode", mode);
    } catch (e) {
      console.error(e);
    }
    if (mode === "buyer") {
      setCurrentView("home");
    } else {
      setCurrentView("space");
    }
  };

  const [directToAuthRegister, setDirectToAuthRegister] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hasParam = params.has("listing") || params.has("claimItemId");
    return hasParam || localStorage.getItem("befakor-guest-mode") === "true";
  });

  // Verification Claim Link state variables
  const [claimParams, setClaimParams] = useState<{
    itemId: string;
    sellerId: string;
    spaceId: string;
    token: string;
  } | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // WhatsApp notification simulation states
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [showSoldSuccess, setShowSoldSuccess] = useState<{ title: string; durationText: string; points: number } | null>(null);

  const loadActiveChats = () => {
    try {
      const stored = localStorage.getItem("befakor-whatsapp-chats");
      if (stored) {
        setActiveChats(JSON.parse(stored));
      } else {
        setActiveChats([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadActiveChats();
    const handleContacted = () => {
      loadActiveChats();
    };
    window.addEventListener("befakor-whatsapp-contacted", handleContacted);
    const interval = setInterval(() => {
      loadActiveChats();
    }, 4000); // Check every 4 seconds
    return () => {
      window.removeEventListener("befakor-whatsapp-contacted", handleContacted);
      clearInterval(interval);
    };
  }, []);

  const speedUpChatTimer = (listingId: string) => {
    try {
      const stored = localStorage.getItem("befakor-whatsapp-chats");
      if (stored) {
        const parsed = JSON.parse(stored);
        const updated = parsed.map((item: any) => {
          if (item.listingId === listingId) {
            // Roll back the contactedAt timestamp by exactly 30 minutes to auto-expire the timer
            return {
              ...item,
              contactedAt: Date.now() - (30 * 60 * 1000 + 5000), // 30 minutes and 5 seconds ago
              speededUp: true
            };
          }
          return item;
        });
        localStorage.setItem("befakor-whatsapp-chats", JSON.stringify(updated));
        setActiveChats(updated);
      }
    } catch (err) {
      console.error("Failed to accelerate speed up time", err);
    }
  };

  const markAsSoldViaWhatsAppNotification = async (chat: any) => {
    const durationMs = Date.now() - chat.contactedAt;
    const totalMinutes = Math.max(1, Math.floor(durationMs / 60000));
    const secondsRemainder = Math.floor((durationMs % 60000) / 1000);
    const calculatedDurationStr = `${totalMinutes}m ${secondsRemainder}s`;
    
    const payoutPoints = 15; // standard circular economy payout points

    try {
      if (chat.listingId.startsWith("sell-act-") || chat.listingId.startsWith("curated-")) {
        // Mock item: Save to mock sold list so it doesn't show up in Vault anymore
        const mockSoldIds = JSON.parse(localStorage.getItem("befakor-mock-sold-ids") || "[]");
        if (!mockSoldIds.includes(chat.listingId)) {
          mockSoldIds.push(chat.listingId);
          localStorage.setItem("befakor-mock-sold-ids", JSON.stringify(mockSoldIds));
        }

        // Add mock claim to history
        const localClaims = JSON.parse(localStorage.getItem("befakor-claims-history") || "[]");
        localClaims.unshift({
          id: `claim-${Date.now()}`,
          itemId: chat.listingId,
          itemTitle: chat.title,
          sellerId: chat.sellerId,
          buyerEmail: "buyer-simulation@student.edu",
          buyerName: "Buyer Simulation",
          rating: 5,
          points: payoutPoints,
          createdAt: Date.now(),
          imageUrl: chat.imageUrls?.[0] || ""
        });
        localStorage.setItem("befakor-claims-history", JSON.stringify(localClaims));

        // Increment current user's Karma (locally)
        if (user) {
          const userStatsKey = `befakor-stats-${user.uid}`;
          const currentStats = JSON.parse(localStorage.getItem(userStatsKey) || "{}");
          currentStats.karmaEarned = (currentStats.karmaEarned || 1240) + payoutPoints;
          currentStats.itemsRehomed = (currentStats.itemsRehomed || 42) + 1;
          localStorage.setItem(userStatsKey, JSON.stringify(currentStats));
        }
      } else {
        // Real Firestore item
        const listingDocRef = doc(db, "listings", chat.listingId);
        
        await updateDoc(listingDocRef, {
          status: "sold",
          claimedBy: chat.buyerId || "unknown",
          claimedAt: Date.now(),
          whatsappConversationDuration: calculatedDurationStr,
          claimRating: 5
        });

        // Write standard hand-off document to reward both
        await addDoc(collection(db, "handoffs"), {
          itemId: chat.listingId,
          itemTitle: chat.title,
          sellerId: chat.sellerId,
          sellerEmail: chat.sellerEmail || "seller@university.edu",
          buyerId: chat.buyerId || "unknown-buyer",
          buyerEmail: "buyer@university.edu",
          rating: 5,
          points: payoutPoints,
          imageUrl: chat.imageUrls?.[0] || "",
          createdAt: Date.now(),
          conversationSecs: Math.floor(durationMs / 1000)
        });

        // Trigger updates to user karma in database
        if (user && user.uid === chat.sellerId) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currentKarma = Number(userSnap.data().karmaEarned) || 0;
            const currentRehomed = Number(userSnap.data().itemsRehomed) || 0;
            await updateDoc(userRef, {
              karmaEarned: currentKarma + payoutPoints,
              itemsRehomed: currentRehomed + 1
            });
          }
        }
      }

      // Show success celebration panel
      setShowSoldSuccess({
        title: chat.title,
        durationText: calculatedDurationStr,
        points: payoutPoints
      });

      // Remove from active WhatsApp notifications
      const stored = localStorage.getItem("befakor-whatsapp-chats") || "[]";
      const parsed = JSON.parse(stored);
      const filtered = parsed.filter((r: any) => r.listingId !== chat.listingId);
      localStorage.setItem("befakor-whatsapp-chats", JSON.stringify(filtered));
      setActiveChats(filtered);

      // Trigger standard local storage and state changes to trigger re-renders
      window.dispatchEvent(new Event("befakor-score-updated"));
      
    } catch (err: any) {
      console.error("Error marking listing as sold via WhatsApp notifier", err);
      alert("Failed to mark as sold: " + err.message);
    }
  };

  const dismissWhatsAppChatNotification = (listingId: string) => {
    try {
      const stored = localStorage.getItem("befakor-whatsapp-chats") || "[]";
      const parsed = JSON.parse(stored);
      const filtered = parsed.filter((r: any) => r.listingId !== listingId);
      localStorage.setItem("befakor-whatsapp-chats", JSON.stringify(filtered));
      setActiveChats(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const claimItemId = params.get("claimItemId");
    const claimSellerId = params.get("claimSellerId");
    const claimSpaceId = params.get("claimSpaceId") || "North Quad";
    const claimToken = params.get("claimToken");
    
    if (claimItemId && claimSellerId && claimToken) {
      setClaimParams({
        itemId: claimItemId,
        sellerId: claimSellerId,
        spaceId: claimSpaceId,
        token: claimToken
      });
      setIsClaimModalOpen(true);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
      
      if (!u) {
        setOnboardingCompleted(null);
        setLoadingOnboarding(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user && user.emailVerified) {
      setLoadingOnboarding(true);
      const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists() && docSnap.data().onboardingCompleted) {
          setOnboardingCompleted(true);
        } else {
          setOnboardingCompleted(false);
        }
        setLoadingOnboarding(false);
      }, (err) => {
        console.error("Failed to check onboarding status", err);
        setOnboardingCompleted(false);
        setLoadingOnboarding(false);
      });
      return unsub;
    } else {
      setLoadingOnboarding(false);
      setOnboardingCompleted(null);
    }
  }, [user]);

  useEffect(() => {
    const handleViewSpace = (e: any) => {
      const email = e.detail?.sellerEmail;
      if (email) {
        localStorage.setItem("befakor-selected-seller-email", email);
      } else {
        localStorage.removeItem("befakor-selected-seller-email");
      }
      setCurrentView("space");
    };
    window.addEventListener("befakor-view-seller-space", handleViewSpace);
    
    const handleSetView = (e: any) => {
      const view = e.detail?.view;
      if (view) {
        setCurrentView(view);
      }
    };
    window.addEventListener("befakor-set-view", handleSetView);

    return () => {
      window.removeEventListener("befakor-view-seller-space", handleViewSpace);
      window.removeEventListener("befakor-set-view", handleSetView);
    };
  }, []);

  useEffect(() => {
    const handleExitGuest = (e: any) => {
      localStorage.removeItem("befakor-guest-mode");
      const shouldRegister = e?.detail?.register !== false;
      setDirectToAuthRegister(shouldRegister);
      setIsGuestMode(false);
    };
    window.addEventListener("befakor-exit-guest-mode", handleExitGuest as any);
    return () => window.removeEventListener("befakor-exit-guest-mode", handleExitGuest as any);
  }, []);

  const isLoading = loadingAuth || loadingOnboarding;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf3] animate-in fade-in duration-300 select-none">
        <div className="relative flex flex-col items-center gap-6">
          <BrandWordmark size="xl" className="tracking-tight" />
          <div className="w-16 h-[3px] bg-[#043f2e]/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#043f2e] rounded-full animate-pulse transition-all duration-300" style={{ width: "60%" }} />
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#043f2e]/60">
            Verifying Student Credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return (
      <LoginPage 
        onBrowseAsGuest={() => {
          setDirectToAuthRegister(false);
          setIsGuestMode(true);
          localStorage.setItem("befakor-guest-mode", "true");
        }} 
        initialShowAuth={directToAuthRegister}
        initialIsRegistering={directToAuthRegister}
      />
    );
  }

  if (user && !user.emailVerified) {
    return <VerifyEmailPage />;
  }

  if (user && onboardingCompleted === false) {
    return <OnboardingPage onComplete={() => setOnboardingCompleted(true)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header with Desktop Navigation & Specialized Mode styles */}
      {currentMode === "buyer" ? (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-4.5">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrandWordmark size="md" />
              <span className="hidden sm:inline-block bg-[#043f2e]/10 text-[#043f2e] px-2.5 py-0.5 rounded text-[9.5px] font-black uppercase tracking-widest font-mono">
                Discovery
              </span>
            </div>

            {/* Desktop-only Navigation Links */}
            <div className="hidden sm:flex items-center gap-8">
              <button
                onClick={() => setCurrentView("home")}
                className={`text-sm font-semibold tracking-wide transition-colors cursor-pointer ${currentView === "home" ? "text-[#043f2e] border-b-2 border-[#043f2e] pb-1 font-bold" : "text-muted-foreground hover:text-primary"}`}
              >
                Market
              </button>
              <button
                onClick={() => setCurrentView("vault")}
                className={`text-sm font-semibold tracking-wide transition-colors cursor-pointer ${currentView === "vault" ? "text-[#043f2e] border-b-2 border-[#043f2e] pb-1 font-bold" : "text-muted-foreground hover:text-primary"}`}
              >
                Favorites & Claims
              </button>
              {user && (
                <button
                  onClick={() => setCurrentView("account")}
                  className={`text-sm font-semibold tracking-wide transition-colors cursor-pointer ${currentView === "account" ? "text-[#043f2e] border-b-2 border-[#043f2e] pb-1 font-bold" : "text-muted-foreground hover:text-primary"}`}
                >
                  Account Profile
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Desktop-only Quick Sell shortcut for global user feed */}
              <button
                onClick={() => {
                  if (!user) {
                    localStorage.removeItem("befakor-guest-mode");
                    setDirectToAuthRegister(false);
                    setIsGuestMode(false);
                    return;
                  }
                  setCurrentMode("seller");
                  setCurrentView("create");
                }}
                className="hidden sm:flex bg-[#043f2e] hover:bg-black text-[#c8f169] hover:text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Sell on Campus</span>
              </button>

              {!user ? (
                <button
                  onClick={() => {
                    localStorage.removeItem("befakor-guest-mode");
                    setDirectToAuthRegister(false);
                    setIsGuestMode(false);
                  }}
                  className="bg-primary hover:bg-primary/95 text-[#cbf345] px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                >
                  Sign In
                </button>
              ) : (
                <>
                  <span className="text-xs font-semibold bg-muted px-3 py-1.5 rounded-full text-muted-foreground hidden lg:inline-block">
                    {user.email}
                  </span>
                  <button
                    onClick={() => auth.signOut()}
                    className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      ) : (
        <header className="sticky top-0 z-40 bg-[#032e22] text-[#f9fbf6] border-b border-white/10 px-4 py-4.5 shadow-md">
          <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleMode("buyer")}
                className="flex items-center gap-1.5 text-[#c8f169] hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 cursor-pointer"
                title="Return to regular student market feed"
              >
                <span>← Back to Market</span>
              </button>
              <span className="hidden sm:inline-block h-5 w-px bg-white/15"></span>
              <span className="hidden sm:inline-block bg-[#c8f169]/10 text-[#c8f169] px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest font-mono">
                Seller Control
              </span>
            </div>

            {/* Desktop-only Seller Navigation Links */}
            <div className="hidden sm:flex items-center gap-8 text-[#add450]">
              {user && (
                <button
                  onClick={() => {
                    localStorage.removeItem("befakor-selected-seller-email");
                    window.dispatchEvent(new CustomEvent("befakor-view-seller-space", { detail: { sellerEmail: null } }));
                    setCurrentView("space");
                  }}
                  className={`text-sm font-semibold tracking-wide transition-colors cursor-pointer ${currentView === "space" ? "text-white border-b-2 border-white pb-1 font-bold" : "text-white/60 hover:text-white"}`}
                >
                  My Space Dashboard
                </button>
              )}
              <button
                onClick={() => setCurrentView("create")}
                className={`text-sm font-semibold tracking-wide transition-colors cursor-pointer ${currentView === "create" ? "text-white border-b-2 border-white pb-1 font-bold" : "text-white/60 hover:text-white"}`}
              >
                Upload Item
              </button>
              <button
                onClick={() => setCurrentView("vault")}
                className={`text-sm font-semibold tracking-wide transition-colors cursor-pointer ${currentView === "vault" ? "text-white border-b-2 border-white pb-1 font-bold" : "text-white/60 hover:text-white"}`}
              >
                My Active Listings
              </button>
              {user && (
                <button
                  onClick={() => setCurrentView("account")}
                  className={`text-sm font-semibold tracking-wide transition-colors cursor-pointer ${currentView === "account" ? "text-white border-b-2 border-white pb-1 font-bold" : "text-white/60 hover:text-white"}`}
                >
                  Account Info
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold bg-white/10 px-3 py-1.5 rounded-full text-white/80 hidden lg:inline-block">
                Seller: {user?.email}
              </span>
              <button
                onClick={() => auth.signOut()}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Dynamic WhatsApp Conversation Notification Engine */}
      {activeChats.length > 0 && (
        <div id="whatsapp-simulated-notification-center" className="bg-[#f3f6ee] border-b border-neutral-200/60 py-3.5 px-4 animate-in slide-in-from-top duration-300">
          <div className="w-full max-w-5xl mx-auto flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#25D366]"></span>
              </span>
              <h4 className="text-[10px] font-bold tracking-wider text-[#043f2e] uppercase font-sans">
                Active Campus Liquidation Stream (WhatsApp Tracker)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeChats.map((chat) => {
                const elapsedMs = Date.now() - chat.contactedAt;
                const isTimerExpired = elapsedMs >= 30 * 60 * 1000 || chat.speededUp;
                
                // Formatted display remaining
                const minutesPassed = Math.floor(elapsedMs / 60000);
                const minutesLeft = Math.max(0, 30 - minutesPassed);
                
                return (
                  <div key={chat.listingId} className="bg-white rounded-xl p-4 border border-neutral-200 shadow-3xs flex flex-col justify-between gap-3 text-left">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-extrabold text-primary truncate leading-tight block pr-2">
                          💬 Inquiry on "{chat.title}"
                        </span>
                        <button 
                          onClick={() => dismissWhatsAppChatNotification(chat.listingId)}
                          className="text-[#ba1a1a] hover:text-red-700 text-[10px] font-bold uppercase tracking-wider cursor-pointer shrink-0"
                        >
                          Dismiss Tracker
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] bg-[#043f2e]/10 text-[#043f2e] px-1.5 py-0.5 rounded-full font-bold">
                          Buyer: {chat.buyerName || "Verified Member"}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-semibold">
                          Verified Profile
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 leading-normal font-sans">
                        {!isTimerExpired 
                          ? `Hey! "${chat.buyerName || "A buyer"}" just clicked "Message on WhatsApp" to coordinate a lobby hand-off. Since they were interested, you can follow up with them if they don't message you!` 
                          : `It has been 30 minutes since "${chat.buyerName || "the buyer"}" initiated contact on WhatsApp. Let's confirm if the trade completed!`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100/90 pt-2.5">
                      {!isTimerExpired ? (
                        <>
                          <div className="flex items-center gap-1.5 text-[10px] bg-neutral-100 font-mono text-neutral-600 px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>🔔 Reminder in {minutesLeft}m ({minutesPassed}m elapsed)</span>
                          </div>
                          <button
                            onClick={() => speedUpChatTimer(chat.listingId)}
                            className="bg-[#c8f169] text-[#043f2e] hover:bg-[#b5dc56] px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                          >
                            <span>⚡ Speed up 30m</span>
                          </button>
                        </>
                      ) : (
                        <div className="w-full space-y-2">
                          <div className="bg-[#fcfdfa] rounded-lg p-2.5 flex flex-col gap-1.5 border border-neutral-200/60">
                            <p className="text-[9px] font-bold text-primary uppercase tracking-wider">
                              🧪 TEST WORKFLOW (BOTH ROLES):
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {/* Option A: Mark Sold for Seller status */}
                              <button
                                onClick={() => markAsSoldViaWhatsAppNotification(chat)}
                                className="bg-[#043f2e] hover:bg-black text-[#c8f169] py-1.5 px-2 rounded-md text-[9px] font-black uppercase tracking-wider text-center cursor-pointer transition-colors"
                              >
                                ✓ I am Seller: Mark Sold
                              </button>
                              
                              {/* Option B: Informative path for Buyer status */}
                              <button
                                onClick={() => {
                                  alert(`📥 Buyer Instructions:\n\nIf you successfully purchased "${chat.title}" on WhatsApp, ask the seller to click 'Mark Sold' in their app, or ask them to generate a secure Claim Link!\n\nOnce they give you the single-use claim link, paste it in your browser here to earn circular Karma points!`);
                                }}
                                className="bg-white border border-[#043f2e] text-[#043f2e] hover:bg-neutral-50 py-1.5 px-2 rounded-md text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer transition-colors"
                              >
                                👤 I am Buyer: Info
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Pop up overlay for marking sold celebration */}
      {showSoldSuccess && (
        <div id="whatsapp-sold-celebration-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-[#c8f169]/30 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-[#c8f169]/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#043f2e] animate-bounce" />
            </div>
            
            <h3 className="font-display font-extrabold text-[#043f2e] text-lg leading-snug">
              🎉 Handoff Complete!
            </h3>
            
            <div className="my-4 p-3 bg-[#fdfefe] rounded-xl space-y-1 text-left border border-neutral-100 font-sans">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-primary">Item sold:</span> "{showSoldSuccess.title}"
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-primary">Negotiation Duration:</span> {showSoldSuccess.durationText}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-primary">Liquidation Speed:</span> Highly Efficient
              </p>
              <p className="text-xs text-[#2A6F2B] font-bold mt-1.5 flex items-center gap-1.5 bg-green-50 p-1.5 rounded-lg border border-green-100">
                <Check className="w-4 h-4 text-[#2A6F2B]" />
                <span>Awarded: +{showSoldSuccess.points} Karma points!</span>
              </p>
            </div>
            
            <p className="text-xs text-slate-500 font-sans mb-4">
              The item has been successfully archived as <span className="font-bold text-[#ba1a1a]">SOLD</span> in the campus marketplace database.
            </p>
            
            <button 
              onClick={() => {
                setShowSoldSuccess(null);
                setCurrentView("vault"); // Direct to the vault page so they can see it in sold tab!
              }}
              className="w-full py-2.5 bg-[#043f2e] hover:bg-black text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
            >
              Go to My Listings ✓
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col pt-4 pb-24 sm:pb-12 px-4 sm:px-6">
        {currentView === "home" && (
          <HomePage 
            onExitGuestMode={() => {
              localStorage.removeItem("befakor-guest-mode");
              setDirectToAuthRegister(true);
              setIsGuestMode(false);
            }} 
            onGoToAccount={() => {
              setCurrentView("account");
            }}
            onGoToSellerDashboard={(initialView) => {
              if (!user) {
                localStorage.removeItem("befakor-guest-mode");
                setDirectToAuthRegister(false);
                setIsGuestMode(false);
                return;
              }
              handleToggleMode("seller");
              if (initialView) {
                setCurrentView(initialView);
              } else {
                setCurrentView("space");
              }
            }}
          />
        )}
        {currentView === "create" && <CreateListing onDone={() => {
          if (currentMode === "buyer") {
            setCurrentView("home");
          } else {
            setCurrentView("vault");
          }
        }} />}
        {currentView === "space" && <SpacePage />}
        {currentView === "vault" && (
          <VaultPage mode={currentMode} onGoToExplore={() => setCurrentView("home")} />
        )}
        {user && currentView === "account" && (
          <AccountPage 
            mode={currentMode} 
            onGoToSellerDashboard={(initialView) => {
              handleToggleMode("seller");
              if (initialView) {
                setCurrentView(initialView);
              } else {
                setCurrentView("space");
              }
            }}
          />
        )}
      </main>

      {/* Mobile-only Bottom Navigation (Light Warm background, Lime Pill Highlight for active) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[#f9fbf6] border-t border-neutral-200/80 py-2 px-3 flex items-center justify-around shadow-xl z-55">
        {!user ? (
          <>
            <button
              onClick={() => setCurrentView("home")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "home" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
            >
              <Grid className="w-4.5 h-4.5" />
              <span className="text-[10px] font-bold tracking-wide">Market</span>
            </button>
            <button
              onClick={() => setCurrentView("vault")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "vault" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
            >
              <Heart className="w-4.5 h-4.5" />
              <span className="text-[10px] font-bold tracking-wide">Favorites</span>
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("befakor-guest-mode");
                setDirectToAuthRegister(false);
                setIsGuestMode(false);
              }}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[#505a54] hover:text-[#043f2e] cursor-pointer"
            >
              <LogIn className="w-4.5 h-4.5" />
              <span className="text-[10px] font-bold tracking-wide">Sign In</span>
            </button>
          </>
        ) : (
          <>
            {currentMode === "buyer" ? (
              // Buyer Mobile Navigation Buttons - with central + Sell button!
              <>
                <button
                  onClick={() => setCurrentView("home")}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "home" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
                >
                  <Grid className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold tracking-wide">Market</span>
                </button>
                <button
                  onClick={() => setCurrentView("vault")}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "vault" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
                >
                  <Heart className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold tracking-wide">Favorites</span>
                </button>

                {/* Central prominent Sell button */}
                <button
                  onClick={() => {
                    if (!user) {
                      localStorage.removeItem("befakor-guest-mode");
                      setDirectToAuthRegister(false);
                      setIsGuestMode(false);
                      return;
                    }
                    setCurrentMode("seller");
                    setCurrentView("create");
                  }}
                  className="flex flex-col items-center justify-center -mt-5 bg-[#043f2e] text-[#c8f169] w-12 h-12 rounded-full shadow-lg border-2 border-[#f9fbf6] active:scale-95 transition-all cursor-pointer z-20 hover:bg-black"
                >
                  <Plus className="w-5 h-5 text-[#c8f169]" />
                  <span className="text-[8px] font-bold tracking-wide text-[#c8f169]">Sell</span>
                </button>

                <button
                  onClick={() => setCurrentView("account")}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "account" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold tracking-wide">Account</span>
                </button>
              </>
            ) : (
              // Seller Mobile Navigation Buttons
              <>
                <button
                  onClick={() => {
                    localStorage.removeItem("befakor-selected-seller-email");
                    window.dispatchEvent(new CustomEvent("befakor-view-seller-space", { detail: { sellerEmail: null } }));
                    setCurrentView("space");
                  }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "space" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
                >
                  <Layers className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold tracking-wide">Space</span>
                </button>
                <button
                  onClick={() => setCurrentView("create")}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "create" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
                >
                  <Plus className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold tracking-wide">Upload</span>
                </button>
                <button
                  onClick={() => setCurrentView("vault")}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "vault" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
                >
                  <KeyRound className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold tracking-wide">Listings</span>
                </button>
                <button
                  onClick={() => setCurrentView("account")}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${currentView === "account" ? "bg-[#c8f169] text-[#043f2e] font-bold" : "text-[#505a54] hover:text-[#043f2e]"}`}
                >
                  <User className="w-4.5 h-4.5" />
                  <span className="text-[10px] font-bold tracking-wide">Account</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {claimParams && (
        <ClaimItemModal
          isOpen={isClaimModalOpen}
          onClose={() => {
            setIsClaimModalOpen(false);
            setClaimParams(null);
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }}
          claimItemId={claimParams.itemId}
          claimSellerId={claimParams.sellerId}
          claimSpaceId={claimParams.spaceId}
          claimToken={claimParams.token}
          onSuccess={(pts, rat) => {
            const newUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
            setClaimParams(null);
            setIsClaimModalOpen(false);
            setCurrentView("account");
          }}
        />
      )}
    </div>
  );

}
