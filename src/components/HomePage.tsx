import { useState, useEffect, MouseEvent } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { collection, query, onSnapshot, where, doc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Listing } from "../types";
import { 
  MapPin, 
  Grid, 
  List, 
  Navigation, 
  Search, 
  TrendingUp, 
  Heart, 
  X, 
  Sparkles, 
  Building2, 
  CheckCircle,
  HelpCircle,
  Laptop,
  BookOpen,
  Coffee,
  HelpCircle as SupportIcon,
  GraduationCap,
  ArrowRight,
  Map as MapIcon,
  Info,
  Share2,
  MessageSquare,
  Send,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  SlidersHorizontal,
  Shirt,
  Armchair,
  Bell,
  FilterX,
  ZoomIn
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { handleImageErrorEvent, getCategoryFallbackImage } from "../lib/imageUtils";

// Curated high-fidelity showcase listings matching the mock design perfectly
const curatedShowcaseItems = [
  {
    id: "curated-1",
    title: "Complete Study Set: Desk & Chair",
    category: "furniture",
    description: "A high-end, mid-century modern ergonomic office chair in a bright, sun-drenched university study lounge. Perfect condition, extremely comfortable for long study sessions.",
    estimatedOriginalPrice: 300,
    suggestedSalePrice: 120,
    imageUrls: [
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1200"
    ],
    location: { lat: 42.3630, lng: -71.1180 },
    buildingOrArea: "Soldiers Field Park",
    createdAt: Date.now() - 3600000 * 2,
    status: "available",
    badge: "60% OFF",
    featured: true
  },
  {
    id: "curated-2",
    title: "MacBook Air M2 - 2023",
    category: "electronics",
    description: "A sleek Apple MacBook Air M2 on a clean, modern desk in a bright student apartment. Comes with charger and original box.",
    estimatedOriginalPrice: 1099,
    suggestedSalePrice: 850,
    imageUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAHv8A3y3TFeY5UNXgsYqH6CW1zP3KTqP6MEzHZbnqEXIJ_fD8aVY7Nqs6rm5PQnGoAcG8f-_qdQHk2Mn7-6ThsDD8ceoQgDSzySPYg9kmFm4GuVHGcYomlpg_gSNXj_2j4-zwlYguiOVQEJi1APgkoym6zzZIwzCVF9WMYjaiOU-KtN14P7GNQC4YA3BTP29oRt4gmM4KsO0SrsUUFMoey2qi-RY53_7w19uCUI55PjIXLeINxRYqCTvDt8tjCfs13MPoBeBhFUiI"
    ],
    location: { lat: 42.3690, lng: -71.1210 },
    buildingOrArea: "Peabody Terrace",
    createdAt: Date.now() - 3600000 * 5,
    status: "available"
  },
  {
    id: "curated-3",
    title: "Nespresso Vertuo & Pods",
    category: "kitchen",
    description: "An assortment of polished stainless steel kitchenware and a high-performance blender/coffee setup on a clean island. Included capsule pods to start you off.",
    estimatedOriginalPrice: 120,
    suggestedSalePrice: 45,
    imageUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC9RqD4ZoXYgrkZ0R_fjwuKjQsc9EDwAeyGCnnQrpW2CGR55iZx6CXmUid9TK0TfV2Ae5c4MEPgbta2xEd1KKBVW3TVRuxek5lFQoE676xdAs25A2Xl0Pz9GqEuRQTE7cAz8ue_UgQ4HkDEThK0thUjkAqK5GTO4TUQlnDSKzMYM-mWAxDywg1y4tofsLKPKR2VcK57c7VpcLPifVXXF-DAeNh2la0JQ_SCpJi7v-rnz5o4roVouztxeSQk7lcNFiAxfOObMHOM1lA"
    ],
    location: { lat: 42.3730, lng: -71.1190 },
    buildingOrArea: "Harvard Sq.",
    createdAt: Date.now() - 3600000 * 12,
    status: "available",
    badge: "Hot Deal"
  },
  {
    id: "curated-4",
    title: "IKEA Kivik Loveseat",
    category: "furniture",
    description: "A minimalist white sofa and a green accent setting in a modern common room. Extremely soft, clean fabric and structural frames intact.",
    estimatedOriginalPrice: 450,
    suggestedSalePrice: 150,
    imageUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAICmVE5R7XYrxGPXchqWkV5g683KFKLO4-ZuOIhp6E6qDojXi5IePRRbKnJ7t-4XK1lxb-tsAhoEVmb-yLp5BQtshkCJFVYeXjve_ZUlwu1EFjSSnhuAj_UbTA3qNbxKjCvkGnLsgnffgUGfSgbFEvWH3MWXcT0x9UhfrYvZkyRk9pDPdnEyY2C8zh-zvnSDpgYaSQSA54awY3FLENRLvzmqdCXzYI-3GJzlztfh5PGbRkhuAq_hxOW-xn_vOK22iXY0o3VzYuaaE"
    ],
    location: { lat: 42.3620, lng: -71.1160 },
    buildingOrArea: "Soldiers Field",
    createdAt: Date.now() - 3600000 * 24,
    status: "available"
  },
  {
    id: "curated-5",
    title: "Adv. Economics (Mankiw)",
    category: "textbooks",
    description: "A collection of heavy, scholarly textbooks/guides. High physical quality and unmarked pages for courses.",
    estimatedOriginalPrice: 140,
    suggestedSalePrice: 30,
    imageUrls: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAzB91Lm2UyPWXRt3CLQEWRHjUqS9TsQR1SLwI39cgSF54xeF-8rjf5B49ldWdM0xUdrrZUJoqKEoIU7-i3gh4roUwgxCMUuJ2jgeTh-Dcabi7W6l4UIpDALBPmWtXaxBS8yv9gLM-Zi_w9A4W3IlQ1r0izxYl0MQHkwwV5olmKuJIGq38D12Zo-55DWvVn4VaNzpzPbrR9uOGf-nZA8dkOCS2Lb8U9GxiSUcHlQ-GdB74D7gfvlDzJPxcqj-foxV9CHjJ5qM6rq1s"
    ],
    location: { lat: 42.3650, lng: -71.1235 },
    buildingOrArea: "HBS Campus",
    createdAt: Date.now() - 3600000 * 36,
    status: "available"
  }
];

interface HomePageProps {
  onExitGuestMode?: () => void;
  onGoToAccount?: () => void;
  onGoToSellerDashboard?: (initialView?: "create" | "space" | "vault") => void;
}

export default function HomePage({ onExitGuestMode, onGoToAccount, onGoToSellerDashboard }: HomePageProps) {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedHub, setSelectedHub] = useState(() => {
    try {
      const stored = localStorage.getItem("befakor-selected-university");
      return stored ? stored.toLowerCase() : "harvard";
    } catch {
      return "harvard";
    }
  });

  // Advanced verification states
  const [isStudentVerified, setIsStudentVerified] = useState(() => {
    const user = auth.currentUser;
    return user ? (user.email?.toLowerCase().endsWith(".edu") || false) : false;
  });

  // Sync verification status
  useEffect(() => {
    const handleVerificationUpdate = () => {
      const user = auth.currentUser;
      setIsStudentVerified(user ? (user.email?.toLowerCase().endsWith(".edu") || false) : false);
    };
    window.addEventListener("befakor-verification-updated", handleVerificationUpdate);
    return () => window.removeEventListener("befakor-verification-updated", handleVerificationUpdate);
  }, []);

  // Sync likes update from other components/views
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

  // Advanced Filter Modal states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterCategories, setFilterCategories] = useState<string[]>(["all"]);
  const [filterPriceMax, setFilterPriceMax] = useState<number>(1000);
  const [filterConditions, setFilterConditions] = useState<string[]>(["new", "like_new", "good", "fair"]);
  const [notified, setNotified] = useState(false);

  // Active selected listing details modal state
  const [activeItem, setActiveItem] = useState<Listing | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Chat messaging inside details modal
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "seller"; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Buyer name capture for simulated notifications
  const [buyerFirstName, setBuyerFirstName] = useState(() => {
    return localStorage.getItem("befakor-buyer-first-name") || "";
  });
  const [showNameInput, setShowNameInput] = useState(false);

  const hubOptions = [
    { key: "harvard", label: "Harvard University", sub: "Cambridge, MA • 5.1k listings", icon: "school", defaultDorm: "Soldiers Field", city: "Cambridge, MA", lat: 42.3770, lng: -71.1167 },
    { key: "mit", label: "Boston, MA", sub: "MIT, BU, Northeastern • 4.2k listings", icon: "location_city", defaultDorm: "North Quad - Hall A", city: "Boston, MA", lat: 42.3591, lng: -71.0942 },
    { key: "nyu", label: "New York University", sub: "Manhattan, NY • 2.4k active listings", icon: "school", defaultDorm: "Off-Campus Housing", city: "New York, NY", lat: 40.7295, lng: -73.9965 },
    { key: "umich", label: "University of Michigan", sub: "Ann Arbor, MI • 1.8k active listings", icon: "school", defaultDorm: "West Residence Tower", city: "Ann Arbor, MI", lat: 42.2780, lng: -83.7382 },
    { key: "stanford", label: "Stanford University", sub: "Palo Alto, CA • 3.1k active listings", icon: "school", defaultDorm: "South Quad - Hall B", city: "Palo Alto, CA", lat: 37.4275, lng: -122.1697 },
    { key: "berkeley", label: "UC Berkeley", sub: "Berkeley, CA • 2.9k listings", icon: "school", defaultDorm: "West Residence Tower", city: "Berkeley, CA", lat: 37.8719, lng: -122.2585 },
    { key: "oxford", label: "University of Oxford", sub: "Oxford, UK • 1.5k listings", icon: "school", defaultDorm: "Off-Campus Housing", city: "Oxford, UK", lat: 51.7548, lng: -1.2544 },
  ];
  
  // Real active user profile settings
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => auth.currentUser !== null);
  const [userProfile, setUserProfile] = useState<{ university?: string; dorm?: string }>(() => {
    try {
      const storedUni = localStorage.getItem("befakor-selected-university") || "";
      const storedDorm = localStorage.getItem("befakor-selected-dorm") || "";
      return { university: storedUni, dorm: storedDorm };
    } catch {
      return { university: "", dorm: "" };
    }
  });

  const activeHubInfo = (() => {
    const rawUni = userProfile.university || "harvard";
    const cleanKey = rawUni.toLowerCase().trim();
    
    let found = hubOptions.find(h => h.key === cleanKey);
    if (!found) {
      found = hubOptions.find(h => 
        h.label.toLowerCase().includes(cleanKey) || 
        cleanKey.includes(h.key) ||
        cleanKey.includes(h.label.toLowerCase())
      );
    }
    return found || hubOptions[0];
  })();

  const displayUniName = activeHubInfo.label;
  const displayCityName = activeHubInfo.city;

  // Local storage favorites keying
  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("befakor-likes");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Default coordinate center for list/map (Harvard campus area)
  const defaultCenter = { lat: activeHubInfo.lat, lng: activeHubInfo.lng };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setIsUserLoggedIn(user !== null);
      setIsStudentVerified(user ? (user.email?.toLowerCase().endsWith(".edu") || false) : false);
      // Unsubscribe from previous profile snapshot if any
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      
      if (user) {
        unsubProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const uData = docSnap.data();
            const dbUni = uData.university !== undefined ? uData.university : "";
            const dbDorm = uData.dorm !== undefined ? uData.dorm : "";
            
            if (dbUni) {
              setUserProfile({
                university: dbUni,
                dorm: dbDorm
              });
              try {
                localStorage.setItem("befakor-selected-university", dbUni);
                localStorage.setItem("befakor-selected-dorm", dbDorm);
              } catch (e) {}
            } else {
              try {
                const storedUni = localStorage.getItem("befakor-selected-university") || "";
                const storedDorm = localStorage.getItem("befakor-selected-dorm") || "";
                setUserProfile({
                  university: storedUni,
                  dorm: storedDorm
                });
              } catch {
                setUserProfile({
                  university: "",
                  dorm: ""
                });
              }
            }
          } else {
            try {
              const storedUni = localStorage.getItem("befakor-selected-university") || "";
              const storedDorm = localStorage.getItem("befakor-selected-dorm") || "";
              setUserProfile({
                university: storedUni,
                dorm: storedDorm
              });
            } catch {
              setUserProfile({
                university: "",
                dorm: ""
              });
            }
          }
        }, (err) => {
          console.error("Failed to load user profile", err);
        });
      } else {
        try {
          const storedUni = localStorage.getItem("befakor-selected-university") || "";
          const storedDorm = localStorage.getItem("befakor-selected-dorm") || "";
          setUserProfile({
            university: storedUni,
            dorm: storedDorm
          });
        } catch {
          setUserProfile({
            university: "",
            dorm: ""
          });
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  useEffect(() => {
    if (userProfile.university) {
      setSelectedHub(userProfile.university.toLowerCase());
    }
  }, [userProfile.university]);

  // Deep link share parameters auto-open
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get("listing");
    if (listingId && listings.length > 0) {
      const foundItem = listings.find((item) => item.id === listingId);
      if (foundItem) {
        setActiveItem(foundItem);
      }
    }
  }, [listings]);

  useEffect(() => {
    if (!isUserLoggedIn) {
      setListings([]);
      return;
    }
    // Fetch user dynamic uploads
    const q = query(
      collection(db, "listings"),
      where("status", "==", "available")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Listing[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Listing);
      });
      // Sort database updates foremost
      data.sort((a, b) => b.createdAt - a.createdAt);
      setListings(data);
    }, (err) => {
      console.error("Failed to fetch listings", err);
    });
    return unsub;
  }, [isUserLoggedIn]);

  const toggleLike = (itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Registration Required: Guest users cannot have access to saved items. Please sign in first.");
      window.dispatchEvent(new Event("befakor-exit-guest-mode"));
      return;
    }
    if (!isStudentVerified) {
      alert("University Email Required: Please log in with a valid .edu university email address.");
      window.dispatchEvent(new CustomEvent("befakor-exit-guest-mode", { detail: { register: true } }));
      return;
    }
    const updatedLikes = { ...likes, [itemId]: !likes[itemId] };
    setLikes(updatedLikes);
    localStorage.setItem("befakor-likes", JSON.stringify(updatedLikes));
    window.dispatchEvent(new Event("befakor-likes-updated"));
  };

  const handleUniversityChange = (uniValue: string, dormValue: string) => {
    // 1. Optimistic UI update: Close modal and set local profile state immediately
    setUserProfile({ university: uniValue, dorm: dormValue });
    setShowLocationModal(false);

    try {
      localStorage.setItem("befakor-selected-university", uniValue);
      localStorage.setItem("befakor-selected-dorm", dormValue);
    } catch (e) {
      console.error("Failed to write selected university to localStorage", e);
    }

    // 2. Background Firestore synchronization
    const user = auth.currentUser;
    if (user) {
      setDoc(doc(db, "users", user.uid), {
        university: uniValue,
        dorm: dormValue
      }, { merge: true }).catch((err) => {
        console.error("Failed to persist location preference in background", err);
      });
    }
  };

  const handleConfirmHub = () => {
    const activeHub = hubOptions.find(h => h.key === selectedHub) || hubOptions[0];
    handleUniversityChange(activeHub.key, activeHub.defaultDorm);
  };

  // Combine live database items with standard high-fidelity model showcase entries project on active campus hub
  const allAvailableItems = [
    ...listings.filter(item => {
      if (!item.university) return true;
      return item.university.toLowerCase() === activeHubInfo.key;
    }),
    ...curatedShowcaseItems.map(item => {
      // Reposition mock curated entries closely around selected university geo position
      const offsetId = parseInt(item.id.replace(/\D/g, "")) || 1;
      const angle = offsetId * (Math.PI / 3);
      const radius = 0.0035; // around 350 meters radius
      const lat = activeHubInfo.lat + radius * Math.sin(angle);
      const lng = activeHubInfo.lng + radius * Math.cos(angle);

      // Re-map localized university building names based on current active hub key
      let building = item.buildingOrArea;
      if (activeHubInfo.key === "harvard") {
        building = item.buildingOrArea;
      } else {
        if (item.id === "curated-1") building = `${activeHubInfo.defaultDorm} Park`;
        else if (item.id === "curated-2") building = `${activeHubInfo.defaultDorm} Complex`;
        else if (item.id === "curated-3") building = `${activeHubInfo.defaultDorm} Hall`;
        else if (item.id === "curated-4") building = `${activeHubInfo.defaultDorm} Row`;
        else if (item.id === "curated-5") building = `${activeHubInfo.defaultDorm} Commons`;
        else building = `${activeHubInfo.defaultDorm} Quad`;
      }

      return {
        ...item,
        location: { lat, lng },
        buildingOrArea: building,
        createdAt: item.createdAt || Date.now()
      } as any;
    })
  ];

  // Advanced Filtering Logic
  const filteredItems = allAvailableItems.filter((item) => {
    // 1. Category Filter:
    const matchesCategory = (() => {
      const knownCategories = ["furniture", "electronics", "kitchen", "textbooks", "apparel", "clothing"];
      
      const checkMatch = (filterKey: string, itemCat?: string) => {
        if (!itemCat) return filterKey === "other";
        const catLower = itemCat.toLowerCase();
        const fKeyLower = filterKey.toLowerCase();
        
        if (fKeyLower === "all") return true;
        
        if (fKeyLower === "apparel" || fKeyLower === "clothing") {
          return catLower === "apparel" || catLower === "clothing";
        }
        
        if (fKeyLower === "other" || fKeyLower === "others") {
          return catLower === "other" || catLower === "others" || !knownCategories.includes(catLower);
        }
        
        return catLower === fKeyLower;
      };
      
      // If we are using filterCategories (advanced filter sidebar/popup)
      if (!filterCategories.includes("all") && filterCategories.length > 0) {
        return filterCategories.some(fCat => checkMatch(fCat, item.category));
      }
      
      // If we are using the main selectedCategory pill scroll tab
      return checkMatch(selectedCategory, item.category);
    })();

    // 2. Keyword Filter:
    const matchesSearch = 
      !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.buildingOrArea?.toLowerCase().includes(searchTerm.toLowerCase());

    // 3. Price Filter (Sale price <= filterPriceMax. If max price is 1000, treat it as no limit/1,000+):
    const matchesPrice = filterPriceMax >= 1000 || item.suggestedSalePrice <= filterPriceMax;

    // 4. Condition Filter:
    const itemCondition = (item.condition || "good").toLowerCase();
    const matchesCondition = filterConditions.includes(itemCondition);

    return matchesCategory && matchesSearch && matchesPrice && matchesCondition;
  });

  const toggleFilterCategory = (catKey: string) => {
    setFilterCategories(prev => {
      if (catKey === "all") {
        return ["all"];
      }
      
      const withoutAll = prev.filter(c => c !== "all");
      if (withoutAll.includes(catKey)) {
        const updated = withoutAll.filter(c => c !== catKey);
        return updated.length === 0 ? ["all"] : updated;
      } else {
        return [...withoutAll, catKey];
      }
    });
  };

  const toggleFilterCondition = (cond: string) => {
    setFilterConditions(prev => {
      if (prev.includes(cond)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== cond);
      } else {
        return [...prev, cond];
      }
    });
  };

  const googleMapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || "";

  return (
    <div className="flex flex-col gap-6 w-full pt-4 pb-4">

      {/* Location Selection Overlay Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-0 bg-primary/80 backdrop-blur-md">
          {/* Location Modal Container */}
          <div className="bg-background w-full max-w-[560px] md:rounded-xl shadow-2xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[85vh] animate-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="px-6 pt-10 pb-6 border-b border-border">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-display text-primary font-bold mb-1">Change Location</h1>
                  <p className="text-xs text-muted-foreground">Discover marketplace items in specific university hubs.</p>
                </div>
                <button 
                  onClick={() => setShowLocationModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors active:scale-90 cursor-pointer"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-card border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-sans text-sm transition-all text-primary shadow-xs" 
                  placeholder="Search for a city or university" 
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                />
              </div>

              {/* Recent Searches */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary/60 font-sans">Recent Searches:</h3>
                <div className="flex flex-wrap gap-1.5">
                  <button 
                    onClick={() => setModalSearch("Cambridge, MA")} 
                    className="px-2.5 py-1 bg-muted/60 rounded-full text-[11px] font-semibold text-primary hover:bg-[#c8f169]/20 transition-colors cursor-pointer"
                  >
                    Cambridge, MA
                  </button>
                  <button 
                    onClick={() => setModalSearch("Stanford")} 
                    className="px-2.5 py-1 bg-muted/60 rounded-full text-[11px] font-semibold text-primary hover:bg-[#c8f169]/20 transition-colors cursor-pointer"
                  >
                    Stanford
                  </button>
                  <button 
                    onClick={() => setModalSearch("Oxford")} 
                    className="px-2.5 py-1 bg-muted/60 rounded-full text-[11px] font-semibold text-primary hover:bg-[#c8f169]/20 transition-colors cursor-pointer"
                  >
                    Oxford, UK
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/30 max-h-[40vh] md:max-h-[50vh]">
              {/* Current Location Section */}
              <section>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-2.5 font-sans">Current Location</h2>
                <div className="flex items-center gap-4 p-4 bg-[#c8f169]/15 border border-[#c8f169]/30 rounded-xl group cursor-default">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-primary shrink-0 shadow-xs">
                    <MapPin className="w-5 h-5 fill-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-primary text-sm">{displayUniName}</div>
                    <div className="text-xs text-muted-foreground">
                      {displayCityName}
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              </section>

              {/* Popular Campus Hubs Section */}
              <section>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mb-3 font-sans">Popular Campus Hubs</h2>
                <div className="space-y-2">
                  {hubOptions
                    .filter(hub => 
                      hub.label.toLowerCase().includes(modalSearch.toLowerCase()) || 
                      hub.city.toLowerCase().includes(modalSearch.toLowerCase()) ||
                      hub.sub.toLowerCase().includes(modalSearch.toLowerCase())
                    )
                    .map((hub) => {
                      const isSelected = selectedHub === hub.key;
                      const IconComp = hub.icon === "location_city" ? Building2 : GraduationCap;
                      
                      return (
                        <button
                          key={hub.key}
                          onClick={() => {
                            setSelectedHub(hub.key);
                            handleUniversityChange(hub.key, hub.defaultDorm);
                          }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border ${
                            isSelected 
                              ? "bg-secondary/15 border-secondary/60 shadow-xs" 
                              : "bg-card border-transparent hover:bg-muted/10 hover:border-border"
                          } group cursor-pointer`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isSelected 
                              ? "bg-primary text-secondary" 
                              : "bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white"
                          }`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-primary text-sm">{hub.label}</div>
                            <div className="text-xs text-muted-foreground">{hub.sub}</div>
                          </div>
                          <CheckCircle className={`w-5 h-5 text-primary transition-opacity shrink-0 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                        </button>
                      );
                    })}
                </div>
              </section>

              {/* Map Visualization */}
              <div className="relative h-40 rounded-xl overflow-hidden group">
                <img 
                  className="w-full h-full object-cover grayscale brightness-110 contrast-75 group-hover:grayscale-0 transition-all duration-700" 
                  alt="Stylized map visual" 
                  referrerPolicy="no-referrer"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmhya4Kl3trk7KkAx0JnmTY9-MLSUdOWUQZDMwC4GKUB-QkeReK1E3ndyvMBDqeWO9rfdU84qFaeq_uLZSokhLqGaYpPv2qo31ufPaCisNRvN22zANdM7xp1ugvfln3RItbH3qhDiqM2sAoCXIAWVGVv-QojtkKkgfG8AtIrYNlKaoIygIprapbBIwMGl33cCvfTF8MIDiNx9j8s8zkJPGd_cJcUfvI4OLFUP_LpdnKhEL3eA8cPRzd4U51x9reAXCts1Rr2hLBEQ"
                />
                <div className="absolute inset-0 bg-[#043f2e]/10"></div>
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3.5 rounded-lg flex items-center justify-between border border-white/40 shadow-xs">
                  <span className="font-semibold text-primary text-xs">Explore Nearby Campus Hubs</span>
                  <MapIcon className="w-4 h-4 text-primary" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-border bg-muted/20 flex gap-3">
              <button 
                onClick={handleConfirmHub} 
                className="w-full py-3.5 bg-primary hover:bg-[#043f2e]/90 text-white font-semibold text-sm rounded-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Confirm Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovery Hub Primary Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">COMMUNITY PORTAL</p>
          <h2 className="text-4xl font-display font-medium text-primary">Discovery Hub</h2>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-1 group cursor-pointer text-sm font-semibold text-primary hover:opacity-80 transition-opacity bg-secondary/20 hover:bg-secondary/30 px-3 py-1 rounded"
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="border-b border-dashed border-primary">
                {displayUniName || "All Camupses"}
              </span>
              <svg className="w-4 h-4 text-primary ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Guest Mode & Skipped Onboarding Lime Highlight Nudge Banner */}
          {(!auth.currentUser || !userProfile.university) && (
            <div id="guest-mode-nudge-banner" className="mt-4 bg-[#c8f169] rounded-2xl p-6 space-y-5 shadow-xs border border-primary/5 text-left animate-in fade-in duration-300">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-5 h-5 text-[#00271b]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[#00271b] font-display font-bold text-base leading-snug">
                    Verify Your Status
                  </h3>
                  <p className="text-xs text-[#00271b]/90 leading-relaxed font-sans">
                    Verify status with a .edu email to see listings in your area.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!auth.currentUser) {
                    if (onExitGuestMode) onExitGuestMode();
                  } else {
                    if (onGoToAccount) onGoToAccount();
                  }
                }}
                className="w-full bg-[#00271b] hover:bg-black text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
              >
                COMPLETE PROFILE
              </button>
            </div>
          )}
          
          <p className="text-base text-muted-foreground max-w-xl leading-relaxed mt-1">
            Find reliable living and lifestyle essentials across our campus community.
          </p>
        </div>

        {/* Search, Filter, Mode Swappers */}
        <div className="flex items-center gap-4 self-start md:self-end">
          {/* Search Toggle Icon */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="flex items-center border border-primary/35 bg-background rounded-full px-3 py-1.5 shadow-sm animate-in slide-in-from-right duration-200">
                <Search className="w-4 h-4 text-primary/70 mr-1.5" />
                <input
                  type="text"
                  placeholder="Query marketplace..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent focus:outline-none text-sm w-44 font-sans text-primary outline-none"
                  autoFocus
                />
                <button onClick={() => { setIsSearchOpen(false); setSearchTerm(""); }} className="cursor-pointer">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 rounded-full border border-border bg-card shadow-xs text-primary hover:bg-muted cursor-pointer transition-colors"
                title="Search listings"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Advanced Filter Trigger */}
          <button 
            onClick={() => {
              setFilterKeyword(searchTerm);
              setFilterCategories(selectedCategory === "all" ? ["all"] : [selectedCategory]);
              setIsFilterOpen(true);
            }}
            className="flex items-center gap-1.5 p-2 rounded-full border border-border bg-card shadow-xs text-primary hover:bg-muted cursor-pointer transition-colors px-4.5 h-[34px]"
            title="Advanced Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Filters</span>
          </button>

          {/* List vs Map toggler */}
          <div className="bg-muted px-1 py-1 rounded-full flex items-center border border-border">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "list" ? "bg-primary shadow-xs text-white" : "text-primary/70 hover:text-primary"
              }`}
            >
              <List className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "map" ? "bg-primary shadow-xs text-white" : "text-primary/70 hover:text-primary"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </section>

      {/* Categories scroll panel */}
      <section className="overflow-x-auto select-none no-scrollbar flex items-center py-2 gap-2">
        {[
          { key: "all", label: "All Items" },
          { key: "furniture", label: "Furniture" },
          { key: "electronics", label: "Electronics" },
          { key: "kitchen", label: "Kitchen" },
          { key: "textbooks", label: "Textbooks" },
          { key: "apparel", label: "Clothing" },
          { key: "other", label: "Others" }
        ].map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`cursor-pointer px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full border transition-all text-nowrap duration-200 ${
              selectedCategory === cat.key
                ? "bg-secondary border-secondary text-primary shadow-sm"
                : "bg-card border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </section>

      {/* Primary Discovery Content panel */}
      {viewMode === "list" ? (
        <div className="space-y-8 min-h-[460px]">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-8 pb-12 px-4 max-w-[1200px] mx-auto min-h-[500px] w-full">
              {/* Illustration Section */}
              <div className="relative w-full max-w-lg mb-8 group text-center">
                {/* Decorative atmospheric circles */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 bg-card rounded-2xl shadow-xs p-6 overflow-hidden flex flex-col items-center border border-border">
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-muted mb-6 relative">
                    <img 
                      className="w-full h-full object-cover opacity-75 grayscale mix-blend-multiply" 
                      alt="An abstract, high-angle architectural map of a modern university campus focused on a dormitory with green spaces and clean lines." 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAodisQ5w9F3IgfaL6jswB3doC_dp1Q92JbSdd9440hhcdFLGvYG59m11peAWSAFxMfsNI0a3fHMEkFodHJECY5RbIW_spRWYwk40qgs9pwhGXfp7u6YaijKZgDhehWoDigigQUG1_AfBqLKmNm3OZvJRLhC30ni3Id9lYJSBbQyqOEGoO8GrESBDJL_zTwxQzB6obksteYryAP5b1M218ajK5pJUu--p1uKiyeawRLUY0DFyWGJWSGCYa5z31HE1flf9Xe0j-izug"
                      referrerPolicy="no-referrer"
                    />
                    {/* Search Icon Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-md border border-secondary/50 scale-110 group-hover:scale-125 transition-transform duration-500 flex items-center justify-center">
                        <ZoomIn className="w-10 h-10 text-primary" />
                      </div>
                    </div>
                    {/* Campus Pins */}
                    <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-primary rounded-full"></div>
                    <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-secondary rounded-full animate-bounce"></div>
                    <div className="absolute bottom-1/3 left-1/2 w-3 h-3 bg-primary/40 rounded-full"></div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="font-display text-xl md:text-2xl font-bold text-primary mb-2 leading-tight">
                      {searchTerm ? `No items found matching "${searchTerm}"` : "No items found in this section yet"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      Try broadening your search or checking other categories. New items are posted daily by fellow scholars.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Cluster */}
              <div className="w-full max-w-lg">
                <div className="flex flex-col items-center gap-1 mb-6">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Quick Actions</h4>
                  <div className="h-[2px] w-8 bg-secondary rounded-full"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Action 1: Clear Filters */}
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterKeyword("");
                      setFilterCategories(["all"]);
                      setFilterPriceMax(1000);
                      setFilterConditions(["new", "like_new", "good", "fair"]);
                      setSelectedCategory("all");
                      setNotified(false);
                    }}
                    className="group flex flex-col items-center justify-center p-5 bg-card border border-border rounded-xl shadow-xs hover:shadow-xs hover:border-primary transition-all duration-300 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-secondary/40 transition-colors">
                      <FilterX className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-primary tracking-wide">Clear Filters</span>
                  </button>

                  {/* Action 2: Browse All Campus */}
                  <button 
                    onClick={() => {
                      setSearchTerm("");
                      setFilterKeyword("");
                      setFilterCategories(["all"]);
                      setFilterPriceMax(1000);
                      setFilterConditions(["new", "like_new", "good", "fair"]);
                      setSelectedCategory("all");
                      setNotified(false);
                    }}
                    className="group flex flex-col items-center justify-center p-5 bg-secondary border border-secondary/30 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.02] transition-all duration-300 relative overflow-hidden cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <MapIcon className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-xs font-black text-primary tracking-wide">Browse Campus</span>
                  </button>

                  {/* Action 3: Notify Me */}
                  <button 
                    onClick={() => {
                      setNotified(true);
                      setTimeout(() => {
                        setNotified(false);
                      }, 5000);
                    }}
                    className={`group flex flex-col items-center justify-center p-5 border rounded-xl shadow-xs transition-all duration-300 cursor-pointer ${
                      notified 
                        ? "bg-primary border-primary text-white" 
                        : "bg-card border-border hover:border-primary text-primary"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      notified ? "bg-secondary text-primary" : "bg-muted group-hover:bg-secondary/40"
                    }`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-bold tracking-wide ${notified ? "text-secondary" : "text-primary"}`}>
                      {notified ? "Notify Active" : "Notify Me"}
                    </span>
                  </button>
                </div>

                {/* Notification success banner */}
                {notified && (
                  <div className="mt-4 p-3 bg-secondary/20 border border-secondary text-primary text-xs rounded-xl flex items-center justify-center gap-2 animate-in fade-in duration-300">
                    <span className="font-bold">✓</span>
                    <span>Alert activated! We will notify you when matching items are listed in this quadrant.</span>
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
                <span 
                  onClick={() => {
                    setSearchTerm("Soldiers Field");
                    setSelectedCategory("all");
                  }}
                  className="px-4 py-1.5 bg-card hover:bg-muted text-primary rounded-full text-xs font-bold border border-border cursor-pointer transition-colors"
                >
                  Soldiers Field Park
                </span>
                <span 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("textbooks");
                  }}
                  className="px-4 py-1.5 bg-card hover:bg-muted text-primary rounded-full text-xs font-bold border border-border cursor-pointer transition-colors"
                >
                  Textbooks
                </span>
                <span 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("furniture");
                  }}
                  className="px-4 py-1.5 bg-card hover:bg-muted text-primary rounded-full text-xs font-bold border border-border cursor-pointer transition-colors"
                >
                  Dorm Furniture
                </span>
                <span 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("electronics");
                  }}
                  className="px-4 py-1.5 bg-card hover:bg-muted text-primary rounded-full text-xs font-bold border border-border cursor-pointer transition-colors"
                >
                  Electronics
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
              
              {/* Highlight Featured Bento Spot (Large blocks) */}
              {filteredItems.some(item => (item as any).featured) && selectedCategory === "all" && !searchTerm && (() => {
                const feat = filteredItems.find(item => (item as any).featured) || filteredItems[0];
                return (
                  <div onClick={() => setActiveItem(feat)} className="md:col-span-2 md:row-span-2 bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
                    <div className="flex flex-col h-full bg-primary text-white relative">
                      {/* Image area with absolute badges */}
                      <div className="relative aspect-[16/10] md:h-[420px] md:aspect-auto overflow-hidden bg-muted shrink-0">
                        <div className="relative w-full h-full">
                          <img 
                            src={feat.imageUrls?.[0]} 
                            alt={feat.title}
                            onError={(e) => handleImageErrorEvent(e, feat.category, feat.title)}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                          />

                        </div>
                        {(feat as any).badge && (
                          <div className="absolute top-4 left-4 bg-secondary text-primary font-bold px-3 py-1.5 text-xs uppercase tracking-wider rounded-lg shadow-sm z-10">
                            {(feat as any).badge}
                          </div>
                        )}
                        <button 
                          onClick={(e) => toggleLike(feat.id, e)}
                          className="absolute top-4 right-4 bg-card/90 hover:bg-card text-primary p-2 rounded-full shadow-sm transition-all hover:scale-110 cursor-pointer z-10"
                        >
                          <Heart className={`w-5 h-5 ${likes[feat.id] ? "fill-red-500 text-red-500" : "text-primary"}`} />
                        </button>
                      </div>
                      
                      {/* Dynamic Solid-to-Overlay Info Section - Stacked sub-panel on mobile to avoid overlapping, absolutely overlayed in desktop mode */}
                      <div className="md:absolute md:bottom-0 md:left-0 md:right-0 p-5 md:p-6 bg-primary md:bg-gradient-to-t md:from-black/95 md:via-black/60 md:to-transparent flex flex-col justify-end">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[10px] md:text-xs font-bold text-secondary bg-primary-foreground/10 md:bg-primary/75 px-3 py-1 rounded-full inline-block">
                            {feat.buildingOrArea}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#c8f169] tracking-wider md:hidden">
                            ★ Featured Listing
                          </span>
                        </div>
                        
                        <h3 className="text-xl md:text-3xl font-display font-medium text-white mb-2 leading-tight">
                          {feat.title}
                        </h3>
                        
                        <p className="text-xs md:text-sm text-stone-200/95 line-clamp-3 md:line-clamp-2 max-w-xl mb-4 font-sans leading-relaxed">
                          {feat.description}
                        </p>
                        
                        <div className="flex items-baseline gap-2 pt-2 border-t border-white/10 md:border-t-0 md:pt-0">
                          <span className="text-xl md:text-2xl font-bold text-secondary">${feat.suggestedSalePrice}</span>
                          <span className="text-xs line-through text-white/50">${feat.estimatedOriginalPrice}</span>
                          {feat.estimatedOriginalPrice > feat.suggestedSalePrice && (
                            <span className="bg-[#c8f169] text-[#043f2e] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                              {Math.round(((feat.estimatedOriginalPrice - feat.suggestedSalePrice) / feat.estimatedOriginalPrice) * 100)}% OFF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Grid of Other standard sized listings cards */}
              {(() => {
                const itemsToRender = filteredItems.filter(item => selectedCategory !== "all" || searchTerm || !(item as any).featured);
                return itemsToRender.map((item, idx) => {
                  const showBannerHere = idx === 2 && !searchTerm;
                  return (
                    <div key={item.id} className="contents">
                      {showBannerHere && (
                        <div 
                          key="moving-soon-cta-banner"
                          className="bg-gradient-to-br from-[#043f2e] to-[#0c4a37] rounded-xl overflow-hidden border border-[#c8f169]/10 shadow-sm flex flex-col justify-between p-5 text-left text-white relative group animate-in fade-in duration-300"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#c8f169]/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-300" />
                          <div className="space-y-2 relative z-10">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#c8f169] bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
                              CAMPUS MOBILITY
                            </span>
                            <h3 className="font-display font-medium text-lg text-white leading-tight">
                              Moving soon? Or clearing space?
                            </h3>
                            <p className="text-[11px] text-stone-200/90 font-sans leading-relaxed">
                              Set up a private Seller Space with a few taps. List items directly to your peers and handle handoffs without the hassle.
                            </p>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onGoToSellerDashboard?.("create");
                            }}
                            className="mt-4 w-full bg-[#c8f169] hover:bg-white text-[#043f2e] hover:text-black py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-sm active:scale-95 text-center block"
                          >
                            Launch My Space +
                          </button>
                        </div>
                      )}
                      
                      <article 
                        onClick={() => setActiveItem(item)}
                        className="bg-card rounded-xl overflow-hidden border border-border shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col h-full cursor-pointer"
                      >
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                      {item.imageUrls?.[0] ? (
                        <div className="relative w-full h-full">
                          <img 
                            src={item.imageUrls[0]} 
                            alt={item.title} 
                            onError={(e) => handleImageErrorEvent(e, item.category, item.title)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-105 contrast-[1.08] saturate-[1.12]"
                          />
                          {/* Studio Spotlight Mask to hide background clutter */}
                          <div 
                            className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-55"
                            style={{
                              background: "radial-gradient(circle at center, transparent 35%, rgba(15, 23, 42, 0.8) 100%)"
                            }}
                          />

                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                          No Visual Added
                        </div>
                      )}
                      
                      {(item as any).badge && (
                        <div className="absolute top-3 left-3 bg-red-100 text-red-800 font-bold px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded">
                          {(item as any).badge}
                        </div>
                      )}

                      <button 
                        onClick={(e) => toggleLike(item.id, e)}
                        className="absolute top-3 right-3 bg-card/90 hover:bg-card text-primary p-1.5 rounded-full shadow-xs transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${likes[item.id] ? "fill-red-500 text-red-500" : "text-primary"}`} />
                      </button>
                    </div>

                    <div className="p-4 flex flex-col flex-grow justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 bg-primary/5 px-2 py-0.5 rounded-sm w-fit">
                          <span className="text-[9px] font-bold tracking-wider uppercase text-primary">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="font-display font-semibold text-lg text-primary leading-tight line-clamp-1 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground/90 line-clamp-2 md:line-clamp-3">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary text-base">${item.suggestedSalePrice}</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] line-through text-muted-foreground opacity-60">${item.estimatedOriginalPrice}</span>
                            {item.estimatedOriginalPrice > item.suggestedSalePrice && (
                              <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                {Math.round(((item.estimatedOriginalPrice - item.suggestedSalePrice) / item.estimatedOriginalPrice) * 100)}% OFF
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium line-clamp-1 max-w-[100px]">{item.buildingOrArea}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                    </div>
                  );
                });
              })()}

            </div>
          )}
        </div>
      ) : (
        /* Dynamic Map view panel */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[460px]">
          
          {/* Vector Map grid canvas */}
          <div className="lg:col-span-8 bg-card border border-border rounded-xl h-[460px] relative overflow-hidden flex flex-col shadow-xs">
            {googleMapsApiKey ? (
              <APIProvider apiKey={googleMapsApiKey}>
                <Map
                  defaultZoom={14}
                  defaultCenter={defaultCenter}
                  mapId="befakor-hub-map"
                  disableDefaultUI={true}
                >
                  {filteredItems.map((item) => (
                    <AdvancedMarker
                      key={item.id}
                      position={{ lat: item.location?.lat || defaultCenter.lat, lng: item.location?.lng || defaultCenter.lng }}
                      title={item.title}
                    >
                      <Pin background={"#043f2e"} borderColor={"#c8f169"} glyphColor={"#fff"} />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            ) : (
              /* High-fidelity Vector Grid map fallback matching designed mockup perfectly */
              <div className="w-full h-full bg-[#f4f7eb] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-12 bg-[radial-gradient(#043F2E_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
                
                {/* Dynamic grid vector road layouts representing Cambridge/university corridors */}
                <svg className="absolute inset-0 w-full h-full text-primary/10" xmlns="http://www.w3.org/2000/svg">
                  <line x1="10%" y1="0%" x2="15%" y2="100%" stroke="currentColor" strokeWidth="8" />
                  <line x1="50%" y1="0%" x2="45%" y2="100%" stroke="currentColor" strokeWidth="12" />
                  <line x1="85%" y1="0%" x2="80%" y2="100%" stroke="currentColor" strokeWidth="8" />
                  <line x1="0%" y1="35%" x2="100%" y2="40%" stroke="currentColor" strokeWidth="10" />
                  <line x1="0%" y1="75%" x2="100%" y2="70%" stroke="currentColor" strokeWidth="8" />
                  <circle cx="45%" cy="38%" r="40" fill="#c8f169" fillOpacity="0.2" stroke="#043f2e" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {/* Animated bouncing location network markers with prices */}
                {filteredItems.slice(0, 4).map((item, idx) => {
                  const offsets = [
                    { top: "28%", left: "42%", icon: <Laptop className="w-3.5 h-3.5" /> },
                    { top: "48%", left: "64%", icon: <Coffee className="w-3.5 h-3.5" /> },
                    { top: "22%", left: "18%", icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { top: "72%", left: "46%", icon: <SupportIcon className="w-3.5 h-3.5" /> }
                  ];
                  const pos = offsets[idx % offsets.length];
                  return (
                    <div 
                      key={item.id} 
                      className="absolute animate-bounce"
                      style={{ top: pos.top, left: pos.left, animationDelay: `${idx * 0.2}s` }}
                    >
                      <div className="bg-primary hover:bg-primary/95 text-white py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer border border-secondary transition-all hover:scale-105">
                        {pos.icon}
                        <span className="text-[11px] font-bold">${item.suggestedSalePrice}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="absolute bottom-4 left-4 bg-primary/90 text-white px-3 py-1.5 rounded text-xs backdrop-blur font-semibold">
                  Mock Campus Coordinates Network
                </div>
              </div>
            )}
          </div>

          {/* Near Your Location Sidebar Panel */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-5 h-5 text-primary animate-pulse" />
                <h4 className="text-lg font-display font-medium text-primary">Near {displayUniName}</h4>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {filteredItems.slice(0, 3).map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => setActiveItem(item)}
                    className="flex gap-3 items-center p-2 hover:bg-muted/30 border border-border/40 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex-shrink-0">
                      <img className="w-full h-full object-cover" src={item.imageUrls?.[0]} alt={item.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-primary text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">Within walking bounds • {item.buildingOrArea}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-primary">${item.suggestedSalePrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4 text-xs text-muted-foreground">
              <p className="font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>Common Lobby drop-offs active inside walking radius.</span>
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Interactive Bottom Accent Badges block */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="p-6 bg-muted/60 border border-border rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h5 className="font-display font-semibold text-primary text-base mb-1">Strict Verification</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All users must be authenticated through their .edu credentials.
            </p>
          </div>
        </div>

        <div className="p-6 bg-muted/60 border border-border rounded-xl flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h5 className="font-display font-semibold text-primary text-base mb-1">Delivery Networks</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Find essential desks, monitors, books, and appliances listed in your direct vicinity, minimizing transport effort.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Listing Details Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-primary/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-background w-full max-w-[680px] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] border border-border animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-card border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-primary uppercase bg-secondary px-2.5 py-0.5 rounded-full">
                  Verified Scholar
                </span>
                <span className="text-xs text-muted-foreground">• Active Listing</span>
              </div>
              <button 
                id="detail-modal-close"
                onClick={() => { setActiveItem(null); setChatOpen(false); }}
                className="p-1 hover:bg-muted rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </button>
            </div>

            {/* Scrollable details view */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Image */}
              <div className="relative aspect-[16/10] bg-muted rounded-xl overflow-hidden shadow-xs border border-border/40">
                <div className="relative w-full h-full">
                  <img 
                    src={activeItem.imageUrls?.[0]} 
                    alt={activeItem.title} 
                    onError={(e) => handleImageErrorEvent(e, activeItem.category, activeItem.title)}
                    className="w-full h-full object-cover brightness-105 contrast-[1.08] saturate-[1.12]"
                  />
                  {/* Studio Refine Spotlight vignette Mask */}
                  <div 
                    className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-50"
                    style={{
                      background: "radial-gradient(circle at center, transparent 38%, rgba(15, 23, 42, 0.8) 100%)"
                    }}
                  />

                </div>
                <button 
                  onClick={async () => {
                    const shareUrl = `${window.location.origin}${window.location.pathname}?listing=${activeItem.id}`;
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (err) {
                      console.error("Failed to copy share link", err);
                    }
                  }}
                  className="absolute top-4 right-4 bg-card hover:bg-muted text-primary px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? "Copied Link!" : "Share Link"}</span>
                </button>
              </div>

              {/* Title & Demographics */}
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h1 className="text-2xl font-display font-medium text-primary tracking-tight">
                      {activeItem.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold capitalize text-primary bg-primary/5 px-2 py-0.5 rounded">
                        {activeItem.category}
                      </span>
                      <span className="text-xs text-muted-foreground">• Listed {formatDistanceToNow(activeItem.createdAt || Date.now())} ago</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary block">${activeItem.suggestedSalePrice}</span>
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <span className="text-xs line-through text-muted-foreground opacity-60">Orig. ${activeItem.estimatedOriginalPrice}</span>
                      {activeItem.estimatedOriginalPrice > activeItem.suggestedSalePrice && (
                        <span className="text-[10px] font-extrabold text-[#043f2e] bg-[#c8f169] border border-[#c8f169]/40 px-2 py-0.5 rounded-md shadow-xs">
                          {Math.round(((activeItem.estimatedOriginalPrice - activeItem.suggestedSalePrice) / activeItem.estimatedOriginalPrice) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="p-4 bg-muted/40 border border-border/80 rounded-xl flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <h5 className="text-xs font-bold text-primary tracking-wide uppercase">Pickup Destination</h5>
                  <p className="text-sm text-primary font-medium">
                    {activeItem.buildingOrArea}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Item Details</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {activeItem.description}
                </p>
              </div>

              {/* Contact Seller Area */}
              <div className="pt-4 border-t border-border">
                {(!auth.currentUser || !isStudentVerified) ? (
                  /* Guest or Unverified Mode verification gate inside the premium student status card style */
                  <div className="bg-[#c8f169] rounded-2xl p-5 space-y-4 shadow-xs border border-primary/5 text-left animate-in fade-in duration-300">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-5 h-5 text-[#00271b]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[#00271b] font-display font-bold text-base leading-snug">
                          University Email Required
                        </h4>
                        <p className="text-xs text-[#00271b]/90 leading-relaxed font-sans">
                          {!auth.currentUser 
                            ? "Sign in with a valid (.edu) university email to see listings and touch base with sellers."
                            : "Your current registered email is not a university address. Please sign out and register or sign in with a valid (.edu) email to verify."}
                        </p>
                      </div>
                    </div>

                    {!auth.currentUser ? (
                      <button 
                        onClick={() => {
                          setActiveItem(null);
                          if (onExitGuestMode) {
                            onExitGuestMode();
                          } else {
                            window.dispatchEvent(new Event("befakor-exit-guest-mode"));
                          }
                        }}
                        className="w-full bg-[#00271b] hover:bg-black text-[#f9fbf6] text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
                      >
                        COMPLETE PROFILE
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          auth.signOut();
                          setActiveItem(null);
                          alert("Signed out. Please register or sign in using a valid .edu university email address.");
                        }}
                        className="w-full bg-[#00271b] hover:bg-black text-white text-[#f9fbf6] text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
                      >
                        SIGN OUT
                      </button>
                    )}
                  </div>
                ) : (
                  /* Verified Seller conversation and status interaction */
                  <div className="space-y-4">
                    {/* Message Seller on WhatsApp with Name Capturing */}
                    {!buyerFirstName || showNameInput ? (
                      <div className="bg-[#fcfdfa] border border-[#043f2e]/10 rounded-xl p-4 space-y-3 text-left">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-mono font-black tracking-wider text-[#043f2e] block">
                            👤 Enter Your Name to Message
                          </label>
                          <p className="text-[11px] text-muted-foreground leading-normal font-sans">
                            Enter your first name so we can inform the seller. They will see who contacted them and can follow up directly if needed!
                          </p>
                        </div>
                        <input
                          type="text"
                          placeholder="Your First Name (e.g. Liam, Alexis)"
                          value={buyerFirstName}
                          onChange={(e) => {
                            setBuyerFirstName(e.target.value.substring(0, 20));
                          }}
                          className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                        />
                        <div className="flex justify-end gap-2 pt-1">
                          {buyerFirstName && (
                            <button
                              onClick={() => {
                                localStorage.setItem("befakor-buyer-first-name", buyerFirstName.trim());
                                setShowNameInput(false);
                                
                                // Perform the contact operation
                                const sellerNum = activeItem.whatsappNumber ? activeItem.whatsappNumber.replace(/\D/g, '') : "16175550241";
                                const predesignedMsg = `Hi! I am ${buyerFirstName.trim()}. I am highly interested in your item "${activeItem.title}" listed on Befakor. Is it still available for pick up?`;
                                const encodedMsg = encodeURIComponent(predesignedMsg);
                                
                                try {
                                  const records = JSON.parse(localStorage.getItem("befakor-whatsapp-chats") || "[]");
                                  const filtered = records.filter((r: any) => r.listingId !== activeItem.id);
                                  const isCurated = activeItem.id.startsWith("curated-");
                                  const sellerId = isCurated ? "mock-seller-id" : (activeItem.sellerId || "mock-seller-id");
                                  const currentUserUid = auth.currentUser?.uid || "guest";
                                  
                                  filtered.unshift({
                                    listingId: activeItem.id,
                                    title: activeItem.title,
                                    sellerId: sellerId,
                                    sellerEmail: activeItem.sellerEmail || "julian.roberts@harvard.edu",
                                    buyerId: currentUserUid,
                                    buyerName: buyerFirstName.trim(),
                                    buyerRating: "⭐ 4.9",
                                    contactedAt: Date.now(),
                                    suggestedSalePrice: activeItem.suggestedSalePrice || 0,
                                    imageUrls: activeItem.imageUrls || [],
                                    category: activeItem.category || "Other"
                                  });
                                  localStorage.setItem("befakor-whatsapp-chats", JSON.stringify(filtered));
                                  
                                  window.dispatchEvent(new CustomEvent("befakor-whatsapp-contacted", { 
                                    detail: { listingId: activeItem.id } 
                                  }));
                                } catch (err) {
                                  console.error("Failed to record WhatsApp contact details", err);
                                }
                                window.open(`https://wa.me/${sellerNum}?text=${encodedMsg}`, "_blank");
                              }}
                              className="bg-[#c8f169] text-[#043f2e] hover:bg-[#b8de5d] transition-all px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer"
                            >
                              Confirm & Open WhatsApp
                            </button>
                          )}
                          {showNameInput && (
                            <button
                              onClick={() => setShowNameInput(false)}
                              className="text-[11px] font-bold text-muted-foreground hover:text-primary cursor-pointer px-2"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-[#f3f6ee] border border-neutral-200/70 py-1.5 px-3 rounded-lg text-left">
                          <span className="text-[10.5px] text-muted-foreground font-sans">
                            Messaging as: <strong className="text-primary font-bold">{buyerFirstName}</strong> (Your rating: ⭐ 4.9)
                          </span>
                          <button
                            onClick={() => setShowNameInput(true)}
                            className="text-[#043f2e] hover:underline text-[10px] font-bold uppercase tracking-wider cursor-pointer font-sans"
                          >
                            Change Name
                          </button>
                        </div>

                        <button 
                          onClick={() => {
                            const sellerNum = activeItem.whatsappNumber ? activeItem.whatsappNumber.replace(/\D/g, '') : "16175550241";
                            
                            // Human label & customized buyer-to-seller predesigned message
                            const predesignedMsg = `Hi! I am ${buyerFirstName}. I am highly interested in your item "${activeItem.title}" listed on Befakor. Is it still available for pick up?`;
                            const encodedMsg = encodeURIComponent(predesignedMsg);
                            
                            // Record WhatsApp initiation inside localStorage so we can simulate notifications and calculate duration
                            try {
                              const records = JSON.parse(localStorage.getItem("befakor-whatsapp-chats") || "[]");
                              const filtered = records.filter((r: any) => r.listingId !== activeItem.id);
                              const isCurated = activeItem.id.startsWith("curated-");
                              const sellerId = isCurated ? "mock-seller-id" : (activeItem.sellerId || "mock-seller-id");
                              const currentUserUid = auth.currentUser?.uid || "guest";
                              
                              filtered.unshift({
                                listingId: activeItem.id,
                                title: activeItem.title,
                                sellerId: sellerId,
                                sellerEmail: activeItem.sellerEmail || "julian.roberts@harvard.edu",
                                buyerId: currentUserUid,
                                buyerName: buyerFirstName,
                                buyerRating: "⭐ 4.9",
                                contactedAt: Date.now(),
                                suggestedSalePrice: activeItem.suggestedSalePrice || 0,
                                imageUrls: activeItem.imageUrls || [],
                                category: activeItem.category || "Other"
                              });
                              localStorage.setItem("befakor-whatsapp-chats", JSON.stringify(filtered));
                              
                              // Dispatch event to refresh the application header or page notifications
                              window.dispatchEvent(new CustomEvent("befakor-whatsapp-contacted", { 
                                detail: { listingId: activeItem.id } 
                              }));
                            } catch (err) {
                              console.error("Failed to record WhatsApp contact details", err);
                            }

                            window.open(`https://wa.me/${sellerNum}?text=${encodedMsg}`, "_blank");
                          }}
                          className="w-full py-3.5 bg-[#add450] hover:bg-[#9cbd44] text-primary font-bold text-sm rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs border border-[#9cbd44]/10 animate-in fade-in duration-200"
                        >
                          <svg className="w-4.5 h-4.5 fill-current text-primary" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.388 2.01 13.911 1 11.997 1 6.561 1 2.137 5.371 2.133 10.8c-.001 1.63.447 3.224 1.298 4.64l-.995 3.635 3.738-.971z" />
                          </svg>
                          <span>Message Seller on WhatsApp</span>
                        </button>
                      </div>
                    )}

                    {/* Secondary Actions Row */}
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => toggleLike(activeItem.id, e)}
                        className="flex-1 py-3 bg-muted/30 hover:bg-muted/60 border border-border text-primary font-semibold text-sm rounded-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart className={`w-4 h-4 ${likes[activeItem.id] ? "fill-red-500 text-red-500" : "text-primary"}`} />
                        <span>{likes[activeItem.id] ? "Saved in Favorites" : "Save for Later"}</span>
                      </button>

                      <button 
                        onClick={async () => {
                          const shareUrl = `${window.location.origin}${window.location.pathname}?listing=${activeItem.id}`;
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            console.error("Failed to copy share link", err);
                          }
                        }}
                        className="px-4 py-3 bg-muted/30 hover:bg-muted/60 border border-border rounded-lg active:scale-95 transition-all text-primary flex items-center justify-center gap-1.5 cursor-pointer"
                        title={copied ? "Copied!" : "Share Listing"}
                      >
                        <Share2 className="w-4 h-4 text-primary" />
                        {copied ? <span className="text-xs font-semibold">Copied!</span> : null}
                      </button>
                    </div>

                    {/* Seller Profile Box */}
                    {(() => {
                      const isCurated = activeItem.id.startsWith("curated-");
                      const sellerEmail = activeItem.sellerEmail || "julian.roberts@harvard.edu";
                      const emailPrefix = sellerEmail.split('@')[0];
                      const formattedName = isCurated 
                        ? (activeItem.id === "curated-1" ? "John Roberts" : activeItem.id === "curated-2" ? "Juliana Chen" : activeItem.id === "curated-3" ? "David Lee" : activeItem.id === "curated-4" ? "Marcus Johnson" : "Julian Roberts")
                        : emailPrefix.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                      
                      const charSum = emailPrefix.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
                      const salesCount = isCurated ? (20 + (charSum % 15)) : ((charSum % 12) + 1);
                      
                      // Nice stable portraits from Unsplash
                      const avatarUrls = [
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop", // Female
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop", // Male
                        "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop", // Female
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop", // Male
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&auto=format&fit=crop"  // Female
                      ];
                      const avatarUrl = avatarUrls[charSum % avatarUrls.length];

                      return (
                        <div 
                          onClick={() => {
                            // Close detail modal
                            const detailModalCloseBtn = document.getElementById("detail-modal-close");
                            if (detailModalCloseBtn) {
                              detailModalCloseBtn.click();
                            }
                            const event = new CustomEvent("befakor-view-seller-space", { detail: { sellerEmail } });
                            window.dispatchEvent(event);
                          }}
                          className="p-3.5 bg-muted/20 border border-border/60 hover:border-primary/40 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-muted/40 transition-all active:scale-[0.98]"
                        >
                          <img 
                            src={avatarUrl} 
                            alt={formattedName} 
                            className="w-10 h-10 rounded-xl object-cover border border border-border shadow-xs"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-primary">{formattedName}</h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs text-[#8ab221] font-bold">★★★★★</span>
                              <span className="text-xs text-muted-foreground font-medium">[{salesCount} sales]</span>
                            </div>
                            <span className="text-[10px] text-[#4d6700] font-bold hover:underline block mt-0.5">View Seller's Space →</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Advanced Discovery Filters Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-primary/70 backdrop-blur-xs">
          {/* Backdrop click close */}
          <div className="absolute inset-0" onClick={() => setIsFilterOpen(false)}></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-auto max-h-[750px] overflow-hidden transform transition-all animate-in slide-in-from-bottom duration-300">
            {/* Handle for Mobile Dragging */}
            <div className="w-full flex justify-center py-2 sm:hidden shrink-0">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full"></div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-primary"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-display font-bold text-primary flex items-center gap-2">
                <SlidersHorizontal className="w-4.5 h-4.5 text-primary" />
                <span>Filters</span>
              </h2>
              <button 
                onClick={() => {
                  setFilterKeyword("");
                  setFilterCategories(["all"]);
                  setFilterPriceMax(1000);
                  setFilterConditions(["new", "like_new", "good", "fair"]);
                }}
                className="text-xs font-bold text-primary hover:underline uppercase tracking-wider cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* Keyword Search Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-primary block">Keyword Search</label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Search className="w-4 h-4" />
                  </span>
                  <input 
                    type="text"
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    placeholder="Search textbooks, furniture, appliances..."
                    className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-primary"
                  />
                </div>
              </div>

              {/* Categories Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-primary">Category</label>
                  <span className="text-[11px] text-muted-foreground">Select one or more</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "all", label: "All Items", icon: Grid },
                    { key: "furniture", label: "Furniture", icon: Armchair },
                    { key: "electronics", label: "Electronics", icon: Laptop },
                    { key: "kitchen", label: "Kitchen", icon: Coffee },
                    { key: "textbooks", label: "Textbooks", icon: BookOpen },
                    { key: "apparel", label: "Clothing", icon: Shirt },
                    { key: "other", label: "Others", icon: HelpCircle }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isActive = filterCategories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        onClick={() => toggleFilterCategory(cat.key)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                          isActive 
                            ? "bg-secondary border-secondary text-primary font-semibold shadow-xs scale-98 animate-pulse-once" 
                            : "bg-card border-border text-muted-foreground hover:border-primary/20 hover:text-primary"
                        }`}
                      >
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                          isActive ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className="text-xs text-center leading-none tracking-tight">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-primary">Price Range</label>
                  <span className="text-xs font-bold text-primary bg-secondary px-3 py-1 rounded-full">
                    $0 - {filterPriceMax >= 1000 ? "$1,000+" : `$${filterPriceMax}`}
                  </span>
                </div>
                <div className="relative pt-1 font-sans">
                  <input 
                    type="range"
                    min="0"
                    max="1000"
                    step="25"
                    value={filterPriceMax}
                    onChange={(e) => setFilterPriceMax(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer active:scale-98 transition-transform"
                  />
                  <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground px-0.5">
                    <span>$0</span>
                    <span>$1,000+</span>
                  </div>
                </div>
              </div>

              {/* Condition Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-primary block">Condition</label>
                <div className="flex flex-wrap gap-2">
                  {(["new", "like_new", "good", "fair"] as const).map((cond) => {
                    const isActive = filterConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => toggleFilterCondition(cond)}
                        className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                          isActive 
                            ? "bg-secondary border-primary text-primary font-bold shadow-xs ml-0"
                            : "bg-card border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {cond === "like_new" ? "Like New" : cond.charAt(0).toUpperCase() + cond.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic matched results count visual tag */}
              <div className="rounded-xl overflow-hidden py-3 px-4 relative bg-card border border-border">
                <div className="absolute inset-x-0 bottom-0 top-0 bg-primary/5"></div>
                <div className="relative flex items-center justify-center gap-1 text-center">
                  <span className="text-xs text-muted-foreground italic">
                    Discovering <strong className="text-primary font-bold not-italic">{filteredItems.length} matching items</strong> across campus networks...
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-border bg-card shrink-0">
              <button 
                onClick={() => {
                  setSearchTerm(filterKeyword);
                  if (filterCategories.length === 1 && filterCategories[0] !== "all") {
                    setSelectedCategory(filterCategories[0]);
                  } else {
                    setSelectedCategory("all");
                  }
                  setIsFilterOpen(false);
                }}
                className="w-full h-12 bg-primary hover:bg-[#032e22] text-white font-semibold rounded-lg shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Show {filteredItems.length} Results</span>
                <ArrowRight className="w-4 h-4 text-[#c8f169]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
