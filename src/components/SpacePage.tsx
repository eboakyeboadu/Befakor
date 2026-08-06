import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { 
  MapPin, 
  CheckCircle, 
  Loader2, 
  Shield,
  ShieldCheck,
  X,
  Heart,
  Share2,
  Star,
  GraduationCap,
  Zap,
  Mail,
  SlidersHorizontal,
  LayoutGrid,
  Settings,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { BrandWordmark } from "./BrandAssets";

interface ListingItem {
  id: string;
  title: string;
  price: string;
  description: string;
  imageUrl: string;
  isFree?: boolean;
}

interface SellerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string;
  school: string;
  rating: string;
  reviewsCount: number;
  avatarUrl: string;
  whatsappNumber: string;
  pickupLocation: string;
  mapImage: string;
  listings: ListingItem[];
}

const liamProfile: SellerProfile = {
  id: "liam",
  name: "Liam Carter",
  email: "liam.carter@stanford.edu",
  role: "Senior at Stanford",
  bio: "Relocating for Internship. Everything must go by Friday. Pickup only at Escondido Village.",
  school: "Stanford University",
  rating: "4.9",
  reviewsCount: 24,
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuC05e6e01_OtkKR2j1OjJYks-lS_fArjXZf_C9byDY2hFG_XfsfMEazhPcNihGS0gtIMD0iqA_uWf2gZVK-xHEobH_7PCMwaMg9vc-VC5csXqYq3-WbqwmNnI8S6y20jk004gjSXQXBoV7j7gMG11jxnzUlZWxhZX57lVdkrxdUkXdi4wbBB9ZyHxOwuHo7qrm0jDw29z1_mPf7BRTDVSvtEZtZnVS6Im8IRmjITzwm6QR_8Qy74TeiwpuTNGsCrssI94Tvs8fLFys",
  whatsappNumber: "16175550241",
  pickupLocation: "Stanford SV",
  mapImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyndVxJBiFonGdHKcn9oVxNkFR_DXLa6NMr7IUOG9_wObQO5NhrQYu7KNHQz9KPdpOn9H3N98lTQ1TkoINKXEOYFO8JlV0JjPvw4P1TLZFFJenYm9IeijsaLkbn37uy4uJFzD3oEGCp0ekBVQvp3Y9TAkTOcJg7V0vJ1uEIBZqVhhmlMReneEC6JOP2G0YzR41m4VUQHvViaj6kBKXuqhXdEmI1Ux-JgwZV0CaV4yqzhJmNnnwDupbcb85aF7FaAQ557sborWEWyw",
  listings: [
    {
      id: "space-liam-1",
      title: "IKEA Ergonomic Desk Chair",
      price: "45",
      description: "Hardly used for 6 months. Perfect for long study sessions. No scratches.",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAt5sTYaDJhcjjdxqOghfyVzUSBZHZOcdPEtJh0UT_8RU5BltHfGRoFhyDLyoXwl-01bmx6Ot9rgdcDJyHN4NtydiM-MzYFRkvlnWkzjBFa5omo8qvB3X3PzOY1XtIAkMBryvd9ai8YrYt8wQnI_fwLSwCbAfAG4kH1c8Q5zsZH8iodTgV6lt24n8lI114ZWgLw0CZvGkTs1y2LV62-f6jcK5LhK2nOj9mc53IH2rjz-gbuJNOqqWtEWdBsMjftcqO3BZ_4AzpqIfE"
    },
    {
      id: "space-liam-2",
      title: "Design 101 & Macroeconomics",
      price: "FREE",
      description: "Giving away these textbooks to any freshmen. Pick up at library cafe.",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCli-BzXeKbh-oFX7DDAwM5SPeycknwHFAJEE_T_TprL6N52sKlEVi_pC3_UjQFS9mN3G4zT-sPMeAYOqSUGWehqYArxZieBr2KHCPeeV2HZvzvpUVM1-XfHBqVgNJ3Hkmyygg1NmAmhRkTfenQMF50AQwwIOHlVDdP44uorsYkbEsEMEg7v1Sk3BrEIVj82zrsTNPR8zCCl4lU0gYm9KJMWul_UovcH1BZvGHQbY9gaVZSbI9J8iTAOPKMpDKYGGwpkW1xY86HcJ0",
      isFree: true
    },
    {
      id: "space-liam-3",
      title: "Nespresso Mini Essence",
      price: "20",
      description: "Black color, works perfectly. Comes with 5 leftover capsules. Moving out sale.",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbHacRwqIOMBOKYo2Td4Jz1AVs6KD4kUE99hLLWopCkhmC0OMK2gyTN0fGLBkLybsRhY-I3Wwxv91xQkkUjDLPz4IyUvfCudlyZxUWdzlc4UNcUrpqPL0dLhN5BAdrlQZctGsDhhwbHR9Tmbl72nrC1I4g7upyq_SxNNn8s1lAv3WozRckw_4MquKMrrb3OmAA78qZmUbbl-QpCOQWZYmOVI2fssPJPNbse4h93A6eJJxJoQD7RwxA68Jn4mgry7SKg1HsL6fL6yA"
    },
    {
      id: "space-liam-4",
      title: "Adjustable Study Lamp",
      price: "12",
      description: "Three brightness settings. USB port on base. Must pick up by Thursday night.",
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2i07DMted9MI_XWpPgi6XJF5rKwxSoqe4HWrT2CW02YVJmSYy1wy2duSdOriVSk23NXQRmOu3PYhM8ZbrJNPNF8cY3EdS-8a4e2bNgYK2uRq11XnIaCd3rvhllR2FiyGrZZ9swgzklTEeuJL2QvhVabaRGsnfFM5KgpDj7FIeTgGwh4Ruilbw9dF-xQtiozSAkQ2l5_yPSGVYBBf5LYiUBP3jzZItJF92Nw_hXy649iIRHxfu3tTFUCqKHzFh58TMdAT9HXkmb28"
    },
    {
      id: "space-liam-5",
      title: "Apple Pippin Retro Keyboard",
      price: "35",
      description: "Nice tactile mechanical keyboard. Helped me write 3 research papers. Needs a clean, works 100%.",
      imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=600&auto=format&fit=crop"
    }
  ]
};

export default function SpacePage() {
  const [targetEmail, setTargetEmail] = useState<string | null>(() => localStorage.getItem("befakor-selected-seller-email"));
  
  // User authentication and verification status
  const [isLoggedIn, setIsLoggedIn] = useState(() => auth.currentUser !== null);
  const [isStudentVerified, setIsStudentVerified] = useState(() => {
    const user = auth.currentUser;
    return user ? (user.email?.toLowerCase().endsWith(".edu") || false) : false;
  });
  const [copied, setCopied] = useState(false);

  // Buyer name capture for simulated notifications
  const [buyerFirstName, setBuyerFirstName] = useState(() => {
    return localStorage.getItem("befakor-buyer-first-name") || "";
  });
  const [showNameInputId, setShowNameInputId] = useState<string | null>(null);

  // Dynamic products loaded from Firestore
  const [dbListings, setDbListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUser = auth.currentUser;
  
  // Determine if viewing own Space
  const isSpaceOwner = !targetEmail || (currentUser && targetEmail.toLowerCase() === currentUser.email?.toLowerCase());

  // Listen to Auth State changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(user !== null);
      if (user) {
        setIsStudentVerified(user.email?.toLowerCase().endsWith(".edu") || false);
      } else {
        setIsStudentVerified(false);
      }
    });
    return unsubscribe;
  }, []);

  // Sync selected seller email changes
  useEffect(() => {
    const handleSetSeller = () => {
      setTargetEmail(localStorage.getItem("befakor-selected-seller-email"));
    };
    window.addEventListener("befakor-view-seller-space", handleSetSeller);
    return () => {
      window.removeEventListener("befakor-view-seller-space", handleSetSeller);
    };
  }, []);

  // Fetch Firestore listings for the active seller
  useEffect(() => {
    const emailToQuery = targetEmail || currentUser?.email;
    if (!emailToQuery) {
      setDbListings([]);
      return;
    }

    // Liam profile has custom local preview list, avoid overwrite
    if (emailToQuery.toLowerCase() === "liam.carter@stanford.edu" && !isSpaceOwner) {
      setDbListings([]);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "listings"),
      where("sellerEmail", "==", emailToQuery.toLowerCase()),
      where("status", "==", "available")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setDbListings(items);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error loading seller space", err);
      setLoading(false);
    });

    return unsub;
  }, [targetEmail, currentUser?.email, isSpaceOwner]);

  // Likes / Saved state from localStorage
  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("befakor-likes");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleLikesUpdated = () => {
      try {
        const stored = localStorage.getItem("befakor-likes");
        setLikes(stored ? JSON.parse(stored) : {});
      } catch (err) {
        console.error(err);
      }
    };
    window.addEventListener("befakor-likes-updated", handleLikesUpdated);
    return () => window.removeEventListener("befakor-likes-updated", handleLikesUpdated);
  }, []);

  const toggleLike = (id: string) => {
    if (!isLoggedIn) {
      alert("Registration Required: Guest users cannot save items. Please sign in first.");
      window.dispatchEvent(new Event("befakor-exit-guest-mode"));
      return;
    }
    if (!isStudentVerified) {
      alert("Student Email Required: To protect our safe campus playground, you must log in with a valid .edu student email address.");
      window.dispatchEvent(new CustomEvent("befakor-exit-guest-mode", { detail: { register: true } }));
      return;
    }
    const updated = { ...likes, [id]: !likes[id] };
    setLikes(updated);
    localStorage.setItem("befakor-likes", JSON.stringify(updated));
    window.dispatchEvent(new Event("befakor-likes-updated"));
  };

  // Compile active profile information
  const activeEmail = targetEmail || currentUser?.email || "liam.carter@stanford.edu";
  const isLiam = activeEmail.toLowerCase() === "liam.carter@stanford.edu" && !isSpaceOwner;

  let activeName = "Liam Carter";
  let activeRole = "Senior at Stanford";
  let activeBio = "Relocating for Internship. Everything must go by Friday. Pickup only at Escondido Village.";
  let activeSchool = "Stanford University";
  let activeRating = "4.9";
  let activeReviewsCount = 24;
  let activeAvatarUrl = liamProfile.avatarUrl;
  let activeWhatsapp = liamProfile.whatsappNumber;
  let activePickupLocation = liamProfile.pickupLocation;
  let activeMapImage = liamProfile.mapImage;
  let activeListings: ListingItem[] = liamProfile.listings;

  if (!isLiam) {
    const emailPrefix = activeEmail.split('@')[0];
    activeName = emailPrefix
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    
    activeRole = isSpaceOwner ? "Verified Hub Seller (You)" : "Verified Student Seller";
    
    const domain = activeEmail.split('@')[1]?.toLowerCase() || "";
    if (domain.includes("stanford")) {
      activeSchool = "Stanford University";
    } else if (domain.includes("harvard")) {
      activeSchool = "Harvard University";
    } else if (domain.includes("yale")) {
      activeSchool = "Yale University";
    } else if (domain.includes("mit")) {
      activeSchool = "MIT";
    } else {
      activeSchool = domain ? (domain.split('.')[0].toUpperCase() + " University") : "University Hub";
    }

    const charSum = emailPrefix.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
    const avatarUrls = [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop", 
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop", 
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop", 
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop", 
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop"
    ];
    activeAvatarUrl = avatarUrls[charSum % avatarUrls.length];

    if (isSpaceOwner) {
      activeBio = "This is your public-facing Seller Space. Tap 'Upload' above to add listings, then manage negotiations and handoffs safely inside your private 'Listings' tab.";
      activePickupLocation = "Your Selected Hub Lobby";
      activeWhatsapp = "";
    } else {
      activeBio = "Student seller decluttering room/closet. Everything must go soon. Tap individual listings to start campus purchase!";
      activePickupLocation = "On-Campus Safe Hub";
      activeWhatsapp = "16175550241"; 
    }

    // Extract dynamic listing values
    if (dbListings.length > 0) {
      const helperNode = dbListings.find(item => item.buildingOrArea || item.whatsappNumber);
      if (helperNode) {
        if (helperNode.buildingOrArea) activePickupLocation = helperNode.buildingOrArea;
        if (helperNode.whatsappNumber) activeWhatsapp = helperNode.whatsappNumber.replace(/\D/g, '');
      }
    }

    activeListings = dbListings.map(doc => ({
      id: doc.id,
      title: doc.title,
      price: doc.suggestedSalePrice !== undefined ? String(doc.suggestedSalePrice) : "0",
      description: doc.description || "No description provided.",
      imageUrl: doc.imageUrls?.[0] || doc.previewUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300",
      isFree: doc.suggestedSalePrice === 0 || doc.isFree === true,
      whatsappNumber: doc.whatsappNumber || ""
    }));

    activeRating = "5.0";
    activeReviewsCount = dbListings.length > 0 ? (charSum % 6) + 2 : 0;
  }

  // Countdown ticker states
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 12, seconds: 48 });
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 12, seconds: 48 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShareSpace = () => {
    const spaceId = isLiam ? "liam" : activeEmail.split('@')[0];
    const shareUrl = `${window.location.origin}${window.location.pathname}?space=${encodeURIComponent(spaceId)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy link", err);
    });
  };

  const handleGoToVault = () => {
    window.dispatchEvent(new CustomEvent("befakor-set-view", { detail: { view: "vault" } }));
  };

  return (
    <div id="seller-space-viewport" className="max-w-xl mx-auto w-full px-4 space-y-6 pb-4 animate-in fade-in-50 duration-300">
      
      {/* 1. If self viewing own space, show beautiful Private Controls / Info Banner */}
      {isSpaceOwner ? (
        <div id="self-space-welcome-banner" className="bg-[#f0f7df] border border-primary/25 rounded-2xl p-4 flex items-start gap-3 shadow-xs text-left">
          <div className="w-8 h-8 rounded-full bg-[#c8f169] flex items-center justify-center text-[#043f2e] shrink-0">
            <Sparkles className="w-4 h-4 fill-current" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-xs font-bold text-[#043f2e] uppercase tracking-wide">
              Logged in as Seller (Private Preview)
            </h4>
            <p className="text-xs text-primary leading-relaxed font-sans">
              This is your public <strong>Seller Space</strong>. To avoid confusion, WhatsApp buttons are hidden for you. Other students will see high-contrast contact links here.
            </p>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={handleGoToVault}
                className="text-[10px] font-bold uppercase tracking-wider text-[#043f2e] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Go to Listings</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Otherwise show standard time limit liquidation countdown banner */
        <div id="liquidation-countdown-banner" className="bg-[#043f2e] text-white rounded-2xl p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="bg-[#c8f169] text-[#043f2e] px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              <span>FLASH SALE</span>
            </div>
            <p className="text-xs font-semibold text-white/95">Liquidation ends in:</p>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex flex-col items-center">
              <span className="bg-white text-[#043f2e] font-black text-sm px-2 py-1 rounded-md min-w-[32px] text-center">
                {countdown.hours.toString().padStart(2, "0")}
              </span>
              <span className="text-[7.5px] font-bold tracking-widest text-[#cbe19e] mt-0.5 uppercase">HOURS</span>
            </div>
            <span className="text-sm font-bold text-[#c8f169] -mt-2">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white text-[#043f2e] font-black text-sm px-2 py-1 rounded-md min-w-[32px] text-center">
                {countdown.minutes.toString().padStart(2, "0")}
              </span>
              <span className="text-[7.5px] font-bold tracking-widest text-[#cbe19e] mt-0.5 uppercase">MINS</span>
            </div>
            <span className="text-sm font-bold text-[#c8f169] -mt-2">:</span>
            <div className="flex flex-col items-center">
              <span className="bg-white text-[#043f2e] font-black text-sm px-2 py-1 rounded-md min-w-[32px] text-center">
                {countdown.seconds.toString().padStart(2, "0")}
              </span>
              <span className="text-[7.5px] font-bold tracking-widest text-[#cbe19e] mt-0.5 uppercase">SECS</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Seller Profile Header block */}
      <div id="seller-profile-card" className="bg-card border border-border rounded-2xl p-5 space-y-5 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl border-2 border-[#cbe19e] overflow-hidden shadow-sm">
              <img 
                src={activeAvatarUrl} 
                alt={activeName} 
                className="w-full h-full object-cover"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#25D366] rounded-full border-2 border-white shadow-xs"></span>
          </div>

          <div className="space-y-1.5 flex-1 text-left">
            <h2 className="font-display font-medium text-xl text-primary leading-tight">
              {activeName}'s Space
            </h2>
            <p className="text-xs font-semibold text-[#4d6700] flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{activeRole}</span>
            </p>
            <p className="text-xs text-[#505a54] font-sans leading-relaxed">
              {activeBio}
            </p>
            
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="bg-[#f0f7df] text-primary px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 border border-primary/5">
                <svg className="w-3 h-3 text-[#505a54]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>{activeSchool}</span>
              </span>
              <span className="bg-[#f0f7df] text-primary px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 border border-primary/5">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{activeRating} ({activeReviewsCount} {activeReviewsCount === 1 ? "Review" : "Reviews"})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Dual Actions block */}
        <div className="flex gap-2.5 w-full shrink-0">
          <button 
            type="button"
            onClick={handleShareSpace}
            className="flex-1 border border-border hover:border-primary text-primary px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-card hover:bg-neutral-50 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>{copied ? "Copied Link!" : "Share Space"}</span>
          </button>
          
          {isSpaceOwner ? (
            <button 
              type="button"
              onClick={handleGoToVault}
              className="flex-1 bg-primary hover:bg-[#032e22] text-white px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Settings className="w-3.5 h-3.5 text-white/95 animate-spin-slow" />
              <span>Manage My Listings</span>
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => {
                if (!isLoggedIn) {
                  alert("Registration Required: Guest users cannot contact sellers. Please sign in first.");
                  window.dispatchEvent(new Event("befakor-exit-guest-mode"));
                  return;
                }
                if (!isStudentVerified) {
                  alert("Student Email Required: To protect our safe campus playground, you must log in with a valid .edu student email address.");
                  window.dispatchEvent(new CustomEvent("befakor-exit-guest-mode", { detail: { register: true } }));
                  return;
                }
                const numToContact = activeWhatsapp || "16175550241";
                const encodedMsg = encodeURIComponent(`Hi ${activeName}! I am viewing your on-campus Seller Space. I'd love to chat about your listed items!`);
                window.open(`https://wa.me/${numToContact}?text=${encodedMsg}`, "_blank");
              }}
              className="flex-1 bg-[#043f2e] hover:bg-[#032e22] text-white px-3 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-white/95" />
              <span>Contact Seller</span>
            </button>
          )}
        </div>
      </div>

      <hr className="border-border/60 my-2" />

      {/* 3. Available Listings title & bar */}
      <div id="listings-view-panel" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-semibold text-lg text-primary">
            Available Listings ({activeListings.length})
          </h3>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f0f3e8] border border-primary/5 text-primary transition-colors cursor-pointer" title="Filters">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#f0f3e8] border border-primary/5 text-primary transition-colors cursor-pointer" title="Grid View">
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-semibold mt-2">Loading marketplace listings...</span>
          </div>
        ) : activeListings.length === 0 ? (
          /* Empty state */
          <div className="bg-card border border-dashed border-border rounded-2xl p-8 py-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
              <LayoutGrid className="w-5 h-5 text-[#8ab221]" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h4 className="text-sm font-bold text-primary">No Listings in this Space yet</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isSpaceOwner 
                  ? "You haven't listed any items for sale under this account. Get started now to receive WhatsApp bids!"
                  : "This seller doesn't have any items active in their marketplace space right now."}
              </p>
            </div>
            {isSpaceOwner && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("befakor-set-view", { detail: { view: "create" } }))}
                className="inline-flex bg-primary hover:bg-[#032e22] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Upload First Item</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* Listings vertical stacked list */
          <div className="space-y-4">
            {activeListings.map((item) => {
              const isFavorite = likes[item.id] === true;
              return (
                <div 
                  key={item.id} 
                  className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/20 hover:shadow-xs transition-all duration-300 flex flex-col group relative text-left"
                >
                  {/* Image layout */}
                  <div className="relative aspect-[16/10] w-full bg-muted overflow-hidden shrink-0">
                    <div className="relative w-full h-full">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 brightness-105 contrast-[1.08] saturate-[1.12]"
                        referrerPolicy="no-referrer"
                      />
                      {/* Studio Spotlight Vignette Mask */}
                      <div 
                        className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50"
                        style={{
                          background: "radial-gradient(circle at center, transparent 35%, rgba(15, 23, 42, 0.75) 100%)"
                        }}
                      />
                    </div>
                    
                    {/* Price badge in upper right */}
                    <span className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm z-10 ${
                      item.isFree || item.price === "FREE" 
                        ? "bg-[#c8f169] text-[#043f2e]" 
                        : "bg-[#043f2e] text-white"
                    }`}>
                      {item.price === "FREE" ? "FREE" : `$${item.price}`}
                    </span>

                    {/* Favorite save toggle */}
                    <button 
                      onClick={() => toggleLike(item.id)}
                      className="absolute top-4 left-4 bg-white/85 hover:bg-white backdrop-blur-xs p-2 rounded-full shadow-md z-15 active:scale-90 transition-all cursor-pointer text-[#043f2e]"
                      title={isFavorite ? "Remove from Favorites" : "Save to Favorites"}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-primary"}`} />
                    </button>
                  </div>

                  {/* Info and action button */}
                  <div className="p-5 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-primary tracking-tight leading-snug group-hover:text-[#4d6700] transition-colors">
                          {item.title}
                        </h4>
                        {isSpaceOwner && (
                          <span className="bg-[#f0f7df] text-[#043f2e] text-[9px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded-full border border-primary/10">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {isSpaceOwner ? (
                      /* Seller-specific actions: No WhatsApp seller button on own items! */
                      <div className="flex gap-2">
                        <button 
                          onClick={handleGoToVault}
                          className="w-full py-2.5 bg-[#f0f3e8] hover:bg-[#e4ebdb] active:scale-[0.98] text-[#043f2e] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#c8f169]/30"
                        >
                          <Settings className="w-3.5 h-3.5 text-[#043f2e]" />
                          <span>Configure in Dashboard</span>
                        </button>
                      </div>
                    ) : (
                      /* Buyer action: WhatsApp button with First Name Prompting */
                      <div className="space-y-2">
                        {!buyerFirstName || showNameInputId === item.id ? (
                          <div className="bg-[#fcfdfa] border border-[#043f2e]/10 rounded-xl p-3.5 space-y-2.5 text-left">
                            <div className="space-y-0.5">
                              <label className="text-[9.5px] uppercase font-mono font-black tracking-wider text-[#043f2e] block">
                                👤 Set First Name to Message
                              </label>
                              <p className="text-[10px] text-muted-foreground leading-normal font-sans">
                                Enter your name so we can notify the seller. They will see who contacted them and can follow up with you on campus!
                              </p>
                            </div>
                            <input
                              type="text"
                              placeholder="Your First Name (e.g. Liam, Alexis)"
                              value={buyerFirstName}
                              onChange={(e) => {
                                setBuyerFirstName(e.target.value.substring(0, 20));
                              }}
                              className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                            />
                            <div className="flex justify-end gap-2 pt-0.5">
                              {buyerFirstName && (
                                <button
                                  onClick={() => {
                                    if (!isLoggedIn) {
                                      alert("Registration Required: Guest users cannot contact sellers. Please sign in first.");
                                      window.dispatchEvent(new Event("befakor-exit-guest-mode"));
                                      return;
                                    }
                                    if (!isStudentVerified) {
                                      alert("Student Email Required: To protect our safe campus playground, you must log in with a valid .edu student email address.");
                                      window.dispatchEvent(new CustomEvent("befakor-exit-guest-mode", { detail: { register: true } }));
                                      return;
                                    }
                                    
                                    localStorage.setItem("befakor-buyer-first-name", buyerFirstName.trim());
                                    setShowNameInputId(null);

                                    const buyerMsg = `Hi ${activeName}! I am ${buyerFirstName.trim()}. I am interested in your "${item.title}" listed on Befakor for ${item.price === "FREE" ? "FREE" : "$" + item.price}. Is it still available to pick up?`;
                                    const encodedMsg = encodeURIComponent(buyerMsg);

                                    // Record WhatsApp contact details
                                    try {
                                      const records = JSON.parse(localStorage.getItem("befakor-whatsapp-chats") || "[]");
                                      const filtered = records.filter((r: any) => r.listingId !== item.id);
                                      const sellerId = isLiam ? "liam" : "db-seller";
                                      const currentUserUid = auth.currentUser?.uid || "guest";
                                      const priceNum = item.price === "FREE" ? 0 : parseFloat(item.price) || 0;
                                      
                                      filtered.unshift({
                                        listingId: item.id,
                                        title: item.title,
                                        sellerId: sellerId,
                                        sellerEmail: activeEmail,
                                        buyerId: currentUserUid,
                                        buyerName: buyerFirstName.trim(),
                                        buyerRating: "Verified Student",
                                        contactedAt: Date.now(),
                                        suggestedSalePrice: priceNum,
                                        imageUrls: [item.imageUrl],
                                        category: "Marketplace"
                                      });
                                      localStorage.setItem("befakor-whatsapp-chats", JSON.stringify(filtered));
                                      
                                      // Dispatch event to update global timer notification banners
                                      window.dispatchEvent(new CustomEvent("befakor-whatsapp-contacted", { 
                                        detail: { listingId: item.id } 
                                      }));
                                    } catch (err) {
                                      console.error("Failed to write to local storage active chats", err);
                                    }

                                    const targetNum = activeWhatsapp || "16175550241";
                                    window.open(`https://wa.me/${targetNum}?text=${encodedMsg}`, "_blank");
                                  }}
                                  className="bg-[#c8f169] text-[#043f2e] hover:bg-[#b8de5d] transition-all px-2.5 py-1 rounded-md text-[10.5px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Confirm & Continue
                                </button>
                              )}
                              {showNameInputId === item.id && (
                                <button
                                  onClick={() => setShowNameInputId(null)}
                                  className="text-[10px] font-bold text-muted-foreground hover:text-primary cursor-pointer px-1.5"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center bg-[#f3f6ee] border border-neutral-200/70 py-1.5 px-2.5 rounded-md text-left">
                              <span className="text-[10px] text-muted-foreground font-sans">
                                Send as verified student: <strong>{buyerFirstName}</strong>
                              </span>
                              <button
                                onClick={() => setShowNameInputId(item.id)}
                                className="text-[#043f2e] hover:underline text-[9.5px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                              >
                                Change
                              </button>
                            </div>

                            <button 
                              onClick={() => {
                                if (!isLoggedIn) {
                                  alert("Registration Required: Guest users cannot contact sellers. Please sign in first.");
                                  window.dispatchEvent(new Event("befakor-exit-guest-mode"));
                                  return;
                                }
                                if (!isStudentVerified) {
                                  alert("Student Email Required: To protect our safe campus playground, you must log in with a valid .edu student email address.");
                                  window.dispatchEvent(new CustomEvent("befakor-exit-guest-mode", { detail: { register: true } }));
                                  return;
                                }
                                const buyerMsg = `Hi ${activeName}! I am ${buyerFirstName}. I am interested in your "${item.title}" listed on Befakor for ${item.price === "FREE" ? "FREE" : "$" + item.price}. Is it still available to pick up?`;
                                const encodedMsg = encodeURIComponent(buyerMsg);

                                // Record WhatsApp contact details
                                try {
                                  const records = JSON.parse(localStorage.getItem("befakor-whatsapp-chats") || "[]");
                                  const filtered = records.filter((r: any) => r.listingId !== item.id);
                                  const sellerId = isLiam ? "liam" : "db-seller";
                                  const currentUserUid = auth.currentUser?.uid || "guest";
                                  const priceNum = item.price === "FREE" ? 0 : parseFloat(item.price) || 0;
                                  
                                  filtered.unshift({
                                    listingId: item.id,
                                    title: item.title,
                                    sellerId: sellerId,
                                    sellerEmail: activeEmail,
                                    buyerId: currentUserUid,
                                    buyerName: buyerFirstName,
                                    buyerRating: "Verified Student",
                                    contactedAt: Date.now(),
                                    suggestedSalePrice: priceNum,
                                    imageUrls: [item.imageUrl],
                                    category: "Marketplace"
                                  });
                                  localStorage.setItem("befakor-whatsapp-chats", JSON.stringify(filtered));
                                  
                                  // Dispatch event to update global timer notification banners
                                  window.dispatchEvent(new CustomEvent("befakor-whatsapp-contacted", { 
                                    detail: { listingId: item.id } 
                                  }));
                                } catch (err) {
                                  console.error("Failed to write to local storage active chats", err);
                                }

                                const targetNum = activeWhatsapp || "16175550241";
                                window.open(`https://wa.me/${targetNum}?text=${encodedMsg}`, "_blank");
                              }}
                              className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                            >
                              <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.388 2.01 13.911 1 11.997 1 6.561 1 2.137 5.371 2.133 10.8c-.001 1.63.447 3.224 1.298 4.64l-.995 3.635 3.738-.971z" />
                              </svg>
                              <span>WhatsApp Seller</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Premium safety banner */}
      <div id="premium-safe-banner" className="bg-[#c8f169] rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden text-left">
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-[#00271b] uppercase tracking-wider">
            Premium Verification Active
          </h4>
          <p className="text-xs text-[#00271b]/90 font-sans leading-relaxed">
            {activeName} is a top-rated verified seller with a successful trade history. Shop with absolute confidence!
          </p>
        </div>
        <button
          onClick={() => alert("All transactions happen in secure lobbies. Complete trades in well-lit public locations!")}
          className="bg-[#00271b] hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Shield className="w-3.5 h-3.5 fill-current text-[#c8f169]" />
          <span>Learn about Safety</span>
        </button>
      </div>

      {/* 5. Pickup location maps block */}
      <div id="pickup-location-card" className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-xs text-left">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-[#4d6700] uppercase tracking-wider block font-sans">
            Pickup Location
          </span>
          <h5 className="font-display font-semibold text-base text-primary">{activePickupLocation}</h5>
        </div>

        <div className="relative aspect-[16/6] w-full bg-muted rounded-xl overflow-hidden border border-border shadow-xs shrink-0 select-none">
          <img 
            src={activeMapImage} 
            alt="Campus Map Spot" 
            className="w-full h-full object-cover grayscale brightness-95 opacity-80 contrast-125"
          />
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <div className="bg-[#043f2e] text-white p-2.5 rounded-full border border-white shadow-xl animate-bounce">
              <MapPin className="w-4 h-4 fill-[#c8f169] text-white" />
            </div>
          </div>
        </div>

        <p className="text-[10.5px] text-muted-foreground font-sans leading-relaxed">
          Exact handoff coordinates shared securely after mutual confirmation.
        </p>
      </div>

      {/* 6. Page Footer */}
      <footer id="seller-space-footer" className="pt-6 pb-4 border-t border-border/60 text-center space-y-4">
        <BrandWordmark size="sm" />
        <p className="text-[11px] text-[#505a54] font-sans">
          &copy; 2026 Befakor University Marketplace
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold text-primary">
          <button onClick={handleShareSpace} className="hover:underline hover:text-[#4d6700] cursor-pointer">Share Space</button>
          <span className="text-border/80">|</span>
          <button onClick={handleGoToVault} className="hover:underline hover:text-[#4d6700] cursor-pointer">Seller Dashboard</button>
          <span className="text-border/80">|</span>
          <button onClick={() => alert("Verification details: authorized .edu email credentials required.")} className="hover:underline hover:text-[#4d6700] cursor-pointer">Verification Policy</button>
          <span className="text-border/80">|</span>
          <button onClick={() => alert("Contact support at assistance@befakor.edu")} className="hover:underline hover:text-[#4d6700] cursor-pointer">Premium Support</button>
        </div>
      </footer>

    </div>
  );
}
