import { useState, useEffect, MouseEvent, FormEvent } from "react";
import { 
  Shield, 
  Lock, 
  Key, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  FileText, 
  ExternalLink, 
  ChevronRight, 
  Info, 
  Heart, 
  MapPin, 
  Share2, 
  Trash2, 
  SlidersHorizontal, 
  X, 
  MessageSquare, 
  Bookmark, 
  Sparkle, 
  ArrowRight, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2,
  TrendingUp,
  Eye,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from "firebase/firestore";
import { Listing } from "../types";
import { formatDistanceToNow } from "date-fns";
import { handleImageErrorEvent } from "../lib/imageUtils";
import { loadStripe } from "@stripe/stripe-js";

interface VaultPageProps {
  onGoToExplore?: () => void;
  mode?: "buyer" | "seller";
}

// Curated items to fall back on or merge if those are in likes
const curatedShowcaseItems: Listing[] = [
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
    sellerId: "curated-seller-1",
    sellerEmail: "c.adams@harvard.edu"
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
    status: "available",
    sellerId: "curated-seller-2",
    sellerEmail: "m.ross@mit.edu"
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
    sellerId: "curated-seller-3",
    sellerEmail: "l.vance@harvard.edu"
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
    status: "available",
    sellerId: "curated-seller-4",
    sellerEmail: "j.davis@harvard.edu"
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
    status: "available",
    sellerId: "curated-seller-5",
    sellerEmail: "m.tanner@harvard.edu"
  }
];

export default function VaultPage({ onGoToExplore, mode }: VaultPageProps) {
  // Authentication check
  const [isLoggedIn, setIsLoggedIn] = useState(() => auth.currentUser !== null);

  // Toggle between Saved Items vs Drafts
  const [activeTab, setActiveTab] = useState<"saved" | "drafts">("saved");

  // Seller Vault State Toggles
  const [vaultMode, setVaultMode] = useState<"seller" | "buyer">(() => mode || "seller");

  useEffect(() => {
    if (mode) {
      setVaultMode(mode);
    }
  }, [mode]);
  const [sellerSubTab, setSellerSubTab] = useState<"active" | "drafts" | "sold">("active");

  // High-Fidelity local states representing lists matching the user's screenshot
  const [sellerActiveListings, setSellerActiveListings] = useState<any[]>([
    {
      id: "sell-act-free-1",
      title: "Chemistry 101 Syllabus & Binder Notes",
      suggestedSalePrice: 0,
      imageUrls: ["https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80"],
      views: 74,
      boosted: false,
      category: "Other",
      buildingOrArea: "North Quad - Hall A",
      freeTier: true,
      sellerId: "mock-seller-id"
    },
    {
      id: "sell-act-1",
      title: "Ergo-Zen Desk Chair",
      suggestedSalePrice: 85,
      imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuCJkYQW85GIKo-e0u_avIIRXrMpoFzMUGAQLYKs0APrLfktDCSfEdivAhFctKnFlnupswkOrNXj7OtE2bGzTAISRZhoeLdkjmAxCoyUWjstl4ZDWw2AEdw6LXUh1_bEadgsVbSWSnm-S_vC3ppMPowzyO2xWldV1Ko01gQCvAPEl08w5y2YUNvYqtczrEkjmROU5HhvAZW88FN5KIr5t2527c1Rj0d3soKVxD_Rpp3tSNu0N6oMnpSyeagjG49gp8PzcrX1LcLufw4"],
      views: 124,
      boosted: false,
      category: "Furniture",
      buildingOrArea: "North Quad"
    },
    {
      id: "sell-act-2",
      title: "Series X Smartwatch",
      suggestedSalePrice: 210,
      imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuA_mGYhAHJEmEwh6L90QDHAdRYlRMFnsyCbFivbiFbMZetkLnT6xPRzfTtCOfzhf9vmgKt4Rv7ZvBzPtunJI2sezQkogHFnq2RwqMMKWSimZpHWw6LFHjY1WMUhhP7mLoeXaCq8yqQ_YLjIco4Zjm4WKUr_wIYjmdyckRnndjaNwUEL2Ava8ZbXaPi9YSeIWJ-w2FH-1eBBmCpXAv21kJ6rAPfWaAqB-myyDTN7qAlK8smq5FJYIhR2BX_Gu2YLYTOp48P34EMeXzU"],
      views: 45,
      boosted: false,
      category: "Electronics",
      buildingOrArea: "MIT Student Center"
    },
    {
      id: "sell-act-3",
      title: "27\" 4K Creator Panel",
      suggestedSalePrice: 340,
      imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuAYCEdzV2IIPrNkuSbhvddzrmex-31HJnDIKtpXohJv05_ixLpBHCvfK9bdDjl-7jQyxrBxidBoFuJnoUasJo0ZNXzNdJUeT-mKRm0jNYvmTl3y90a6kLmX_k1QIWwAHK5txMSbRR67XHFhjA8Y4sjcHpGQLSPZXoBOrmI8Jo5mogYB3S3zQkJqbz8tIzzD9hqAg6m55ahq9F9pKGuT9927l-LLYwGkeZV1Ayo6ovYwZIDA2uLp--KbkVxzjSNhS7CxaPnmGaEHEzA"],
      views: 312,
      boosted: true,
      category: "Electronics",
      buildingOrArea: "Harvard Yards"
    },
    {
      id: "sell-act-4",
      title: "Marshall Stanmore Speaker",
      suggestedSalePrice: 120,
      imageUrls: ["https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=80"],
      views: 98,
      boosted: false,
      category: "Electronics",
      buildingOrArea: "Soldiers Field"
    },
    {
      id: "sell-act-5",
      title: "Fjallraven Kanken Backpack",
      suggestedSalePrice: 45,
      imageUrls: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80"],
      views: 189,
      boosted: false,
      category: "Other",
      buildingOrArea: "Peabody Terrace"
    },
    {
      id: "sell-act-6",
      title: "Retro Mini Fridge",
      suggestedSalePrice: 150,
      imageUrls: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80"],
      views: 65,
      boosted: false,
      category: "Appliances",
      buildingOrArea: "Quincy House"
    },
    {
      id: "sell-act-7",
      title: "Chemex Coffee Maker",
      suggestedSalePrice: 50,
      imageUrls: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80"],
      views: 42,
      boosted: false,
      category: "Kitchen",
      buildingOrArea: "Kirkland House"
    },
    {
      id: "sell-act-8",
      title: "Solid Oak Study Desk",
      suggestedSalePrice: 450,
      imageUrls: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80"],
      views: 321,
      boosted: false,
      category: "Furniture",
      buildingOrArea: "Dunster House"
    }
  ]);

  const [sellerDraftListings, setSellerDraftListings] = useState<any[]>([
    {
      id: "sell-dr-1",
      title: "Untitled iPhone 13",
      suggestedSalePrice: 320,
      status: "reviewing",
      imageUrls: ["https://lh3.googleusercontent.com/aida-public/AB6AXuDw-l524nsLjZwDKKCn5DVd3E9qLnPqezOCjDOjBUVJl81Bl61oeXkAOihua4gnEL13K_8DZSWg3f3kCBkqKKcKgwi2riHG_FuvYMj9gOD8Gxo6TFcnRmu44zOuYJTn-vi9-u9tqbM8FrmUZzcREPTMoPbqETZ2MZpj_j1ycmQJt3izhMYBj5kuO8jB4Yd2mqZantjLeS4CU6SR91PLLMmog4y-8G_aW5OoB6smAFIji_SdTLkKICeaVwWWOtx4OXs6V-tlKuXUUxY"],
      category: "Electronics",
      description: "iPhone in clean condition. Storage model holds 128GB.",
      buildingOrArea: "Dunster House"
    },
    {
      id: "sell-dr-2",
      title: "Nike Zoom Runner",
      suggestedSalePrice: 55,
      status: "needs_price",
      estimatedRange: "$55-70",
      imageUrls: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff"],
      category: "Other",
      description: "Nike runner series shoes, size 10. Barely worn twice.",
      buildingOrArea: "MIT Student Center"
    },
    {
      id: "sell-dr-3",
      title: "IKEA Study Light",
      suggestedSalePrice: 20,
      status: "reviewing",
      estimatedRange: "$15-25",
      imageUrls: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c"],
      category: "Furniture",
      description: "Halogen direct task lamp with long study extension arm.",
      buildingOrArea: "Wigglesworth Hall"
    }
  ]);

  const [sellerSoldListings, setSellerSoldListings] = useState<any[]>(() => {
    const list = [
      { id: "sell-sd-1", title: "Audio-Technica M50x", suggestedSalePrice: 120, imageUrls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"], category: "Electronics", karma: 15 },
      { id: "sell-sd-2", title: "Sony WH-1000XM4", suggestedSalePrice: 220, imageUrls: ["https://images.unsplash.com/photo-1484704849700-f032a568e944"], category: "Electronics", karma: 25 },
      { id: "sell-sd-3", title: "Hydro Flask 32oz", suggestedSalePrice: 18, imageUrls: ["https://images.unsplash.com/photo-1602143407151-7111542de6e8"], category: "Other", karma: 10 },
      { id: "sell-sd-4", title: "IKEA Kivik Couch", suggestedSalePrice: 250, imageUrls: ["https://images.unsplash.com/photo-1540518614846-7eded433c457"], category: "Furniture", karma: 30 },
      { id: "sell-sd-5", title: "Bose SoundLink Core", suggestedSalePrice: 80, imageUrls: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1"], category: "Electronics", karma: 15 },
      { id: "sell-sd-6", title: "Standard Micro Waves", suggestedSalePrice: 45, imageUrls: ["https://images.unsplash.com/photo-1574269909862-7e1d70bb8078"], category: "Appliances", karma: 15 }
    ];
    for (let i = 7; i <= 24; i++) {
      list.push({
        id: `sell-sd-${i}`,
        title: `Pre-owned Student Item #${i}`,
        suggestedSalePrice: Math.floor(Math.random() * 80) + 15,
        imageUrls: [`https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=300&q=80`],
        category: "Other",
        karma: 15
      });
    }
    return list;
  });

  const [completingDraftId, setCompletingDraftId] = useState<string | null>(null);
  const [completeDraftPrice, setCompleteDraftPrice] = useState<string>("");

  // Draft management states
  const [draftListings, setDraftListings] = useState<Listing[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isPublishingDraftId, setIsPublishingDraftId] = useState<string | null>(null);

  // Boost response check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("boost_success") === "true") {
      const itemId = params.get("item_id");
      if (itemId) {
        setSellerActiveListings(prev => prev.map(p => p.id === itemId ? { ...p, boosted: true, views: p.views + 150 } : p));
        alert(`Payment successful! Your item has been boosted in nearby search streams.`);
      }
      // Remove query parameters to clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get("boost_cancel") === "true") {
      alert("Boost payment cancelled.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Interactive Verification states
  const [isVerified, setIsVerified] = useState(() => {
    const user = auth.currentUser;
    return user ? (user.email?.toLowerCase().endsWith(".edu") || false) : false;
  });
  const [isVerifying, setIsVerifying] = useState(false);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(user !== null);
      if (user) {
        setIsVerified(user.email?.toLowerCase().endsWith(".edu") || false);
      } else {
        setIsVerified(false);
      }
    });
    return unsubscribe;
  }, []);
  
  // Likes list state (localStorage loaded)
  const [likes, setLikes] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("befakor-likes");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // DB listings fetched from firestore
  const [dbListings, setDbListings] = useState<Listing[]>([]);
  
  // Sorting options
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [copiedList, setCopiedList] = useState(false);

  // Escrow specific states
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Detail Modal states
  const [activeItem, setActiveItem] = useState<Listing | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "seller", text: string, time: string }>>([]);
  const [copiedItemLink, setCopiedItemLink] = useState(false);

  // Real Escrows
  const activeEscrows = [
    {
      id: "escrow-101",
      itemTitle: "Complete Study Set: Desk & Chair",
      price: 120,
      seller: "Marcus T. (m.tanner@harvard.edu)",
      lobbyBox: "North Quad Locker #4B",
      pickupCode: "BF-4929",
      status: "ready_for_pickup",
      expires: "Tomorrow, 8 PM"
    },
    {
      id: "escrow-102",
      itemTitle: "MacBook Air M2 - 2023",
      price: 850,
      seller: "Sarah L. (s_li@mit.edu)",
      lobbyBox: "Student Center Locker #12",
      pickupCode: "BF-7731",
      status: "pending_verification",
      expires: "June 25, 4 PM"
    }
  ];

  const transactionLedger = [
    {
      id: "tx-201",
      itemTitle: "Nespresso Vertuo & Pods",
      price: 45,
      role: "Buyer",
      date: "June 12, 2026",
      status: "completed"
    },
    {
      id: "tx-202",
      itemTitle: "Adv. Economics (Mankiw)",
      price: 30,
      role: "Seller",
      date: "May 28, 2026",
      status: "completed"
    }
  ];

  // Fetch live database listings
  useEffect(() => {
    if (!isLoggedIn) {
      setDbListings([]);
      return;
    }
    const q = query(
      collection(db, "listings"),
      where("status", "==", "available")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Listing[] = [];
      snapshot.forEach((docSnap) => {
        data.push({ id: docSnap.id, ...docSnap.data() } as Listing);
      });
      setDbListings(data);
    }, (err) => {
      console.error("Failed to fetch listings for vault", err);
    });
    return unsub;
  }, [isLoggedIn]);

  // Fetch user drafts from Firestore and localStorage falls back
  useEffect(() => {
    if (!isLoggedIn || !auth.currentUser) {
      setDraftListings([]);
      return;
    }
    const q = query(
      collection(db, "listings"),
      where("sellerId", "==", auth.currentUser.uid),
      where("status", "==", "draft")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const dbDrafts: Listing[] = [];
      snapshot.forEach((docSnap) => {
        dbDrafts.push({ id: docSnap.id, ...docSnap.data() } as Listing);
      });
      // Load also local storage drafts to merge
      let mergedDrafts = [...dbDrafts];
      try {
        const stored = localStorage.getItem("befakor-saved-drafts");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.forEach((item: any, idx: number) => {
            const isDup = dbDrafts.some(d => d.title.trim().toLowerCase() === item.title.trim().toLowerCase());
            if (!isDup) {
              mergedDrafts.push({
                id: `local-draft-${idx}`,
                title: item.title,
                category: item.category,
                description: item.description || "Draft details...",
                suggestedSalePrice: item.suggestedSalePrice || 0,
                estimatedOriginalPrice: item.estimatedOriginalPrice || 0,
                imageUrls: [item.previewUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300"],
                createdAt: Date.now(),
                status: "draft",
                sellerId: auth.currentUser?.uid,
                isLocalOnly: true
              } as any);
            }
          });
        }
      } catch (err) {
        console.error("Local drafts fetch error", err);
      }
      setDraftListings(mergedDrafts);
    }, (err) => {
      console.error("Failed to fetch drafts for vault", err);
    });
    return unsub;
  }, [isLoggedIn]);

  // Actions for Draft management
  const handleStartEditDraft = (draft: Listing) => {
    setEditingDraftId(draft.id);
    setEditTitle(draft.title);
    setEditPrice(draft.suggestedSalePrice);
    setEditCategory(draft.category);
    setEditDescription(draft.description || "");
  };

  const handleSaveDraftChanges = async (draftId: string, isLocalOnly?: boolean) => {
    try {
      if (isLocalOnly) {
        // Update in localStorage
        const stored = localStorage.getItem("befakor-saved-drafts");
        if (stored) {
          let parsed = JSON.parse(stored);
          parsed = parsed.map((item: any, idx: number) => {
            if (`local-draft-${idx}` === draftId) {
              return {
                ...item,
                title: editTitle,
                category: editCategory,
                suggestedSalePrice: Number(editPrice) || 0,
                description: editDescription
              };
            }
            return item;
          });
          localStorage.setItem("befakor-saved-drafts", JSON.stringify(parsed));
        }
        setDraftListings(prev => prev.map(d => d.id === draftId ? {
          ...d,
          title: editTitle,
          category: editCategory,
          suggestedSalePrice: Number(editPrice) || 0,
          description: editDescription
        } : d));
      } else {
        // Update in Firestore
        await updateDoc(doc(db, "listings", draftId), {
          title: editTitle,
          category: editCategory,
          suggestedSalePrice: Number(editPrice) || 0,
          description: editDescription
        });
      }
      setEditingDraftId(null);
    } catch (err: any) {
      console.error("Failed to update draft", err);
      alert("Error saving draft modifications: " + err.message);
    }
  };

  const [claimUrlForFeedback, setClaimUrlForFeedback] = useState<string | null>(null);

  const handleGenerateClaimLink = async (item: any) => {
    try {
      const claimToken = "claim-" + Math.random().toString(36).substring(2, 10);
      const spaceId = item.buildingOrArea || "stanford";
      const itemId = item.id;
      const sellerId = item.sellerId || auth.currentUser?.uid || "mock-seller-id";
      
      const claimUrl = `${window.location.origin}${window.location.pathname}?claimSpaceId=${encodeURIComponent(spaceId)}&claimItemId=${encodeURIComponent(itemId)}&claimSellerId=${encodeURIComponent(sellerId)}&claimToken=${claimToken}`;
      
      if (!item.id.startsWith("sell-act-")) {
        await updateDoc(doc(db, "listings", item.id), {
          claimToken: claimToken,
          claimStatus: "initiated",
          freeTier: true
        });
      } else {
        const localTokens = JSON.parse(localStorage.getItem("befakor-mock-claim-tokens") || "{}");
        localTokens[item.id] = { claimToken, spaceId, itemId, sellerId };
        localStorage.setItem("befakor-mock-claim-tokens", JSON.stringify(localTokens));
      }
      
      setClaimUrlForFeedback(claimUrl);
      navigator.clipboard.writeText(claimUrl);
      alert(`🎉 Handoff initiation sequence validated! Single-use claim link has been automatically copied to your clipboard:\n\n${claimUrl}\n\nSend this securely to the buyer on WhatsApp so they can verify the collection and unlock your Karma points!`);
    } catch (err: any) {
      console.error("Failed to generate claim link", err);
      alert("Error generating claim link: " + err.message);
    }
  };

  const [isBoostingItemId, setIsBoostingItemId] = useState<string | null>(null);

  const handleBoostListing = async (item: any) => {
    setIsBoostingItemId(item.id);
    try {
      // Use current window location as returnUrl
      const returnUrl = window.location.href.split("?")[0].split("#")[0];

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: item.id,
          title: item.title,
          returnUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }

      const session = await response.json();
      
      if (session.url) {
        // Open Stripe Checkout in a new tab to avoid breaking out of AI Studio iframe
        const newTab = window.open(session.url, "_blank");
        if (!newTab || newTab.closed || typeof newTab.closed === "undefined") {
          window.location.href = session.url;
        }
      } else {
        throw new Error("No checkout session URL received from server.");
      }
    } catch (error: any) {
      console.error("Boost Listing error:", error);
      alert("There was an issue initiating the boost: " + error.message);
    } finally {
      setIsBoostingItemId(null);
    }
  };

  const handlePublishDraft = async (draft: Listing) => {
    setIsPublishingDraftId(draft.id);
    try {
      if (draft.isLocalOnly || !draft.id || draft.id.startsWith("local-draft-")) {
        // Convert to database listing doc with available status
        const activeUser = auth.currentUser;
        if (!activeUser) return;
        
        await addDoc(collection(db, "listings"), {
          sellerId: activeUser.uid,
          sellerEmail: activeUser.email || "student@stanford.edu",
          title: draft.title,
          category: draft.category,
          description: draft.description || "",
          estimatedOriginalPrice: Number(draft.estimatedOriginalPrice) || 0,
          suggestedSalePrice: Number(draft.suggestedSalePrice) || 0,
          imageUrls: draft.imageUrls || [],
          location: draft.location || { lat: 37.4275, lng: -122.1697 },
          buildingOrArea: draft.buildingOrArea || "Campus Hub",
          createdAt: Date.now(),
          status: "available",
          condition: draft.condition || "good"
        });

        // Delete from local storage list
        const stored = localStorage.getItem("befakor-saved-drafts");
        if (stored) {
          const parsed = JSON.parse(stored).filter((_: any, idx: number) => `local-draft-${idx}` !== draft.id);
          localStorage.setItem("befakor-saved-drafts", JSON.stringify(parsed));
        }
      } else {
        // Update Firestore status to available
        await updateDoc(doc(db, "listings", draft.id), {
          status: "available",
          createdAt: Date.now()
        });
      }
      alert(`Success! "${draft.title}" has been published and is now live on the marketplace.`);
    } catch (err: any) {
      console.error("Publishing draft failed", err);
      alert("Error publishing: " + err.message);
    } finally {
      setIsPublishingDraftId(null);
    }
  };

  const handleDeleteDraft = async (draftId: string, isLocalOnly?: boolean) => {
    if (!confirm("Are you sure you want to discard this draft? This cannot be undone.")) return;
    try {
      if (isLocalOnly || draftId.startsWith("local-draft-")) {
        const stored = localStorage.getItem("befakor-saved-drafts");
        if (stored) {
          const parsed = JSON.parse(stored).filter((_: any, idx: number) => `local-draft-${idx}` !== draftId);
          localStorage.setItem("befakor-saved-drafts", JSON.stringify(parsed));
        }
        setDraftListings(prev => prev.filter(d => d.id !== draftId));
      } else {
        await deleteDoc(doc(db, "listings", draftId));
      }
    } catch (err: any) {
      console.error("Failed to delete draft", err);
      alert("Error deleting draft: " + err.message);
    }
  };

  // Merge and deduplicate
  const allAvailableListings = (() => {
    const merged = [...curatedShowcaseItems, ...dbListings];
    // filter uniques
    const uniqueMap = new Map<string, Listing>();
    merged.forEach(item => {
      uniqueMap.set(item.id, item);
    });
    return Array.from(uniqueMap.values());
  })();

  // Filter those that are favorited/saved
  const savedItems = allAvailableListings.filter(item => likes[item.id] === true);

  // Sort them
  const sortedSavedItems = [...savedItems].sort((a, b) => {
    if (sortBy === "price-low") {
      return a.suggestedSalePrice - b.suggestedSalePrice;
    }
    if (sortBy === "price-high") {
      return b.suggestedSalePrice - a.suggestedSalePrice;
    }
    // "newest"
    const timeA = a.createdAt || 0;
    const timeB = b.createdAt || 0;
    return timeB - timeA;
  });

  // Handle Unfavoriting
  const handleRemoveFavorite = (itemId: string, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updatedLikes = { ...likes, [itemId]: false };
    setLikes(updatedLikes);
    localStorage.setItem("befakor-likes", JSON.stringify(updatedLikes));
    // Dispatch custom event to notify HomePage of change
    window.dispatchEvent(new Event("befakor-likes-updated"));
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  // Share entire list
  const handleShareList = () => {
    if (savedItems.length === 0) return;
    const itemListText = savedItems.map((item, idx) => 
      `${idx + 1}. ${item.title} — $${item.suggestedSalePrice} (${item.buildingOrArea})`
    ).join("\n");
    const shareText = `Check out my Befakor Saved List:\n\n${itemListText}\n\nJoin Befakor with your university .edu email!`;
    
    navigator.clipboard.writeText(shareText);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2000);
  };

  // Dynamic Chat Auto-Responders
  const handleSendChatMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeItem) return;

    const userMsg = { sender: "user" as const, text: chatInput, time: "Just now" };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    // Seller auto reply delay
    setTimeout(() => {
      let replyText = "Awesome! Let me look up my schedule. Yes, we can meet up near the library later today.";
      if (chatInput.toLowerCase().includes("offer") || chatInput.toLowerCase().includes("low") || chatInput.toLowerCase().includes("price")) {
        replyText = "The price is fairly firm since it's in awesome shape, but let's chat about options or quick lobby meetups!";
      } else if (chatInput.toLowerCase().includes("when") || chatInput.toLowerCase().includes("time")) {
        replyText = "Does round 4:30 PM work for you? I can meet you near the student union center.";
      }
      setChatMessages(prev => [...prev, { sender: "seller" as const, text: replyText, time: "Just now" }]);
    }, 1200);
  };

  if (!isLoggedIn) {
    return (
      <div id="vault-guest-locked-container" className="max-w-md mx-auto w-full pt-16 pb-24 px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#c8f169] rounded-2xl p-6 space-y-5 shadow-sm border border-primary/5 text-left">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <Info className="w-5 h-5 text-[#00271b]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-[#00271b] font-display font-bold text-base leading-snug">
                Verify Your Status
              </h3>
              <p className="text-xs text-[#00271b]/90 leading-relaxed font-sans">
                Verify status with a .edu email to view listings, save favorites, and message sellers.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent("befakor-exit-guest-mode", { detail: { register: true } }));
            }}
            className="w-full bg-[#00271b] hover:bg-black text-[#f9fbf6] text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-sm text-center"
          >
            COMPLETE PROFILE
          </button>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div id="vault-unverified-locked-container" className="max-w-md mx-auto w-full pt-10 pb-20 px-4 animate-in fade-in duration-300">
        <div className="space-y-6">
          <div className="bg-[#c8f169] rounded-2xl p-6 space-y-4 shadow-sm border border-primary/5 text-left">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-[#00271b]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[#00271b] font-display font-bold text-base leading-snug">
                  University Email Required
                </h3>
                <p className="text-xs text-[#00271b]/90 leading-relaxed font-sans">
                  Please log in with a valid university email to keep trades secure. No ID or enrollment documents are ever collected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const myActiveDbListings = dbListings.filter(
    (l) => l.sellerId === auth.currentUser?.uid && l.status === "available"
  );
  
  // Filter out any mock active listings that were marked sold via WhatsApp notification simulation
  const mockSoldIds = JSON.parse(localStorage.getItem("befakor-mock-sold-ids") || "[]");
  const filteredActiveListings = sellerActiveListings.filter(p => !mockSoldIds.includes(p.id));
  const combinedActiveListings = [...filteredActiveListings, ...myActiveDbListings];

  const totalActiveValue = combinedActiveListings.reduce((sum, item) => sum + item.suggestedSalePrice, 0);
  const clearedPercentage = Math.round((sellerSoldListings.length / (combinedActiveListings.length + sellerDraftListings.length + sellerSoldListings.length)) * 100);

  return (
    <div id="vault-vault-container" className="flex flex-col gap-6 w-full py-4 pb-4 animate-in fade-in-50 duration-300">

      {vaultMode === "seller" ? (
        <div id="seller-command-center" className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
          
          {/* Summary Dashboard Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Active Value Card */}
            <div className="bg-[#043f2e] text-[#f9fbf6] p-6 rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-sm text-left">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#c8f169]/90">Active Inventory Value</p>
                <h1 className="font-display text-[44px] md:text-5xl font-extrabold leading-tight mt-1">
                  ${totalActiveValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h1>
              </div>
              <div className="mt-8 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#c8f169]" />
                <span className="text-xs font-bold text-[#c8f169]">+12.5% from last week</span>
              </div>
            </div>

            {/* Liquidation Progress Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#ecf0e1] flex flex-col justify-between shadow-sm text-left">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-[#505a54] uppercase tracking-wider">Liquidation Progress</p>
                  <span className="font-display font-black text-[#043f2e] text-lg">{clearedPercentage}%</span>
                </div>
                <div className="w-full bg-[#ecf0e1] h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#c8f169] h-full rounded-full shadow-[0_0_8px_rgba(200,241,105,0.7)] transition-all duration-500"
                    style={{ width: `${clearedPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-[#505a54] mt-3 font-semibold leading-relaxed">
                  Approx. {clearedPercentage}% of apartment inventory cleared. {sellerActiveListings.length + sellerDraftListings.length} items remaining.
                </p>
              </div>
              <div className="mt-5 flex gap-3 items-center">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#043f2e] flex items-center justify-center text-[10px] font-bold text-white">JD</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#b8eed6] flex items-center justify-center text-[10px] font-bold text-[#043f2e]">AS</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#add450] flex items-center justify-center text-[10px] font-bold text-[#043f2e]">MK</div>
                </div>
                <span className="text-[11px] text-[#505a54] font-bold">+4 active buyers watchlists</span>
              </div>
            </div>
          </section>

          {/* Segmented Sub-Navigation Tabs */}
          <nav className="mt-2 border-b border-[#ecf0e1] flex gap-8 overflow-x-auto hide-scrollbar pb-3">
            <button 
              onClick={() => setSellerSubTab("active")}
              className={`pb-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
                sellerSubTab === "active" 
                  ? "border-b-3 border-[#043f2e] text-[#043f2e]" 
                  : "text-[#505a54] hover:text-[#043f2e]"
              }`}
            >
              Active ({combinedActiveListings.length})
            </button>
            <button 
              onClick={() => setSellerSubTab("drafts")}
              className={`pb-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
                sellerSubTab === "drafts" 
                  ? "border-b-3 border-[#043f2e] text-[#043f2e]" 
                  : "text-[#505a54] hover:text-[#043f2e]"
              }`}
            >
              Drafts ({sellerDraftListings.length})
            </button>
            <button 
              onClick={() => setSellerSubTab("sold")}
              className={`pb-2 font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
                sellerSubTab === "sold" 
                  ? "border-b-3 border-[#043f2e] text-[#043f2e]" 
                  : "text-[#505a54] hover:text-[#043f2e]"
              }`}
            >
              Sold ({sellerSoldListings.length})
            </button>
          </nav>

          {/* Sub-Tab Grid Renders */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-2">
            
            {/* RENDER - SELLER ACTIVE LISTINGS */}
            {sellerSubTab === "active" && combinedActiveListings.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl border border-[#ecf0e1] overflow-hidden group hover:shadow-md transition-shadow duration-300 flex flex-col justify-between shadow-2xs relative"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-50">
                  <img 
                    referrerPolicy="no-referrer"
                    src={item.imageUrls?.[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-black text-[#043f2e] flex items-center gap-1 shadow-3xs border border-[#ecf0e1]">
                    <Eye className="w-3.5 h-3.5 text-[#043f2e]" />
                    <span>{item.views || 0}</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1 text-left flex-1 justify-between">
                  <div className="space-y-1">
                    <h3 className="font-sans font-bold text-xs text-[#043f2e] truncate">{item.title}</h3>
                    {item.suggestedSalePrice === 0 || item.freeTier ? (
                      <span className="inline-flex bg-emerald-100 text-[#043f2e] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                        Free tier item
                      </span>
                    ) : (
                      <p className="font-sans font-extrabold text-xs text-[#2A6F2B] mt-0.5">${item.suggestedSalePrice.toFixed(2)}</p>
                    )}
                  </div>
                  
                  <div className="mt-3.5 flex flex-col gap-1.5">
                    {item.suggestedSalePrice === 0 || item.freeTier ? (
                      <button 
                        onClick={() => handleGenerateClaimLink(item)}
                        className="w-full py-2 bg-[#2A6F2B] hover:bg-[#1E521E] text-white font-sans font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center shadow-3xs hover:scale-[1.02] active:scale-98"
                      >
                        Generate Claim Link
                      </button>
                    ) : item.boosted ? (
                      <button 
                        onClick={() => {
                          setSellerActiveListings(prev => prev.map(p => p.id === item.id ? { ...p, boosted: false, views: Math.max(0, p.views - 150) } : p));
                        }}
                        className="w-full py-2 bg-[#c8f169] text-[#043f2e] font-sans font-extrabold text-[11px] rounded-lg uppercase tracking-wider hover:bg-[#b0d550] transition-colors shadow-3xs cursor-pointer text-center"
                      >
                        Active Boost
                      </button>
                    ) : (
                      <button 
                        disabled={isBoostingItemId === item.id}
                        onClick={() => handleBoostListing(item)}
                        className="w-full py-2 bg-white border border-[#043f2e] text-[#043f2e] font-sans font-extrabold text-[11px] rounded-lg uppercase tracking-wider hover:bg-[#043f2e] hover:text-white transition-all cursor-pointer text-center flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isBoostingItemId === item.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Redirecting...
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-3.5 h-3.5" />
                            Boost Listing ($1.99)
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const confirmSold = confirm(`Do you want to archive "${item.title}" as sold? This will move it to your Sold records and update liquidation metrics.`);
                        if (!confirmSold) return;
                        setSellerActiveListings(prev => prev.filter(p => p.id !== item.id));
                        setSellerSoldListings(prev => [
                          { ...item, karma: 20, dateSold: "Just now" },
                          ...prev
                        ]);
                      }}
                      className="text-[10px] text-[#2A6F2B] hover:underline font-extrabold text-center cursor-pointer mt-1"
                    >
                      Mark Sold ✓
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* RENDER - SELLER DRAFTS LISTINGS */}
            {sellerSubTab === "drafts" && sellerDraftListings.map((item) => (
              <div 
                key={item.id}
                className="bg-white/70 rounded-xl border border-[#c0c9c2] overflow-hidden group flex flex-col justify-between shadow-3xs relative text-left"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100 grayscale opacity-82">
                  <img 
                    referrerPolicy="no-referrer"
                    src={item.imageUrls[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover opacity-60"
                  />
                  
                  {item.status === "reviewing" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="bg-[#043f2e] text-white px-3 py-1.5 rounded-full text-[9px] font-black tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 text-[#c8f169] animate-pulse" /> AI REVIEWING
                      </span>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <span className="bg-[#ba1a1a] text-white px-3 py-1.5 rounded-full text-[9px] font-black tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Info className="w-3.5 h-3.5 text-white" /> NEEDS PRICE
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-1 flex-1 justify-between">
                  <div>
                    <h3 className="font-sans font-bold text-xs text-[#505a54] truncate">{item.title}</h3>
                    {item.status === "reviewing" ? (
                      <p className="font-sans font-extrabold text-[11px] text-neutral-400 italic mt-0.5">Pending Price...</p>
                    ) : (
                      <p className="font-sans font-extrabold text-[11px] text-[#4d6700] italic mt-0.5">AI Suggests: {item.estimatedRange}</p>
                    )}
                  </div>

                  <div className="mt-4">
                    {item.status === "reviewing" ? (
                      <button 
                        disabled
                        className="w-full py-2.5 bg-neutral-100 text-neutral-300 font-sans font-bold text-[11px] rounded-lg uppercase tracking-wider cursor-not-allowed text-center"
                      >
                        Complete Draft
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setCompletingDraftId(item.id);
                          setCompleteDraftPrice("");
                        }}
                        className="w-full py-2.5 bg-[#ecf0e1] hover:bg-[#043f2e] hover:text-white text-[#043f2e] font-sans font-bold text-[11px] rounded-lg uppercase tracking-wider transition-colors cursor-pointer text-center"
                      >
                        Complete Draft
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* RENDER - SELLER SOLD LISTINGS */}
            {sellerSubTab === "sold" && sellerSoldListings.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-xl border border-[#ecf0e1] overflow-hidden opacity-90 flex flex-col justify-between shadow-3xs relative text-left"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100 filter saturate-50">
                  <img 
                    referrerPolicy="no-referrer"
                    src={item.imageUrls[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-[#043f2e] px-3.5 py-1.5 rounded-md font-black uppercase text-[10px] tracking-widest shadow-sm">SOLD</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-sans font-bold text-xs text-primary truncate">{item.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="font-sans font-extrabold text-xs text-primary">${item.suggestedSalePrice.toFixed(2)}</p>
                    <span className="bg-[#c8f169]/30 text-[#043f2e] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#c8f169]/30">
                      +{item.karma || 15} Karma
                    </span>
                  </div>
                </div>
              </div>
            ))}

          </div>
        </div>
      ) : (
        /* ORIGINAL BUYER TABS CONTENT */
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
          
          {/* Header and Pill Tab Control */}
          <div className="flex flex-col gap-5 border-b border-border pb-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#4d6700] block mb-1 font-sans">Your Favorites</span>
                <h2 className="text-4xl font-display font-medium text-primary tracking-tight">
                  Favorites List
                </h2>
              </div>
            </div>
          </div>

          {/* RENDER - SAVED ITEMS VIEW */}
          <div id="vault-saved-items-view" className="space-y-6">
              
              {/* Subtitle Bar and Action Controls */}
              {savedItems.length > 0 && (
                <div className="flex items-center justify-between gap-3 bg-card p-4 border border-border/80 rounded-xl shadow-2xs">
                  <span className="text-xs font-medium text-muted-foreground font-sans">
                    Review, sort, and share your favorite saved items below.
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="bg-background border border-border px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-[#ecf0e1]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Sort: <span className="text-[#4d6700] uppercase font-bold">{sortBy === "newest" ? "Newest" : sortBy === "price-low" ? "Price ↑" : "Price ↓"}</span></span>
                      </button>

                      <AnimatePresence>
                        {showSortDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden"
                          >
                            <button
                              onClick={() => { setSortBy("newest"); setShowSortDropdown(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#ecf0e1]/40 transition-colors ${sortBy === "newest" ? "text-primary bg-[#043f2e]/5" : "text-muted-foreground"}`}
                            >
                              Newest Added
                            </button>
                            <button
                              onClick={() => { setSortBy("price-low"); setShowSortDropdown(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#ecf0e1]/40 transition-colors ${sortBy === "price-low" ? "text-primary bg-[#043f2e]/5" : "text-muted-foreground"}`}
                            >
                              Price: Low to High
                            </button>
                            <button
                              onClick={() => { setSortBy("price-high"); setShowSortDropdown(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-[#ecf0e1]/40 transition-colors ${sortBy === "price-high" ? "text-primary bg-[#043f2e]/5" : "text-muted-foreground"}`}
                            >
                              Price: High to Low
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      onClick={handleShareList}
                      className="bg-[#043f2e] hover:bg-[#032e22] text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedList ? "Copied!" : "Share List"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Items Grid with Motion Animations */}
              {sortedSavedItems.length > 0 ? (
                <motion.div 
                  layout
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {sortedSavedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 15 }}
                        transition={{ duration: 0.25 }}
                        className="bg-card rounded-xl border border-border/80 overflow-hidden relative flex flex-col h-full group hover:shadow-md transition-all duration-300"
                      >
                        <div className="relative aspect-[4/3] bg-muted overflow-hidden shrink-0">
                          <img 
                            src={item.imageUrls?.[0] || "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80"} 
                            alt={item.title} 
                            onError={(e) => handleImageErrorEvent(e, item.category, item.title)}
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                          
                          <button
                            onClick={(e) => handleRemoveFavorite(item.id, e)}
                            className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-card/90 backdrop-blur-md flex items-center justify-center text-[#ba1a1a] hover:bg-card transition-all shadow-xs shrink-0 cursor-pointer"
                            title="Remove from Favorites"
                          >
                            <Heart className="w-4.5 h-4.5 fill-current" />
                          </button>

                          <div className="absolute bottom-3 left-3">
                            <span className="bg-[#043f2e] text-[#fafaf3] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                              <MapPin className="w-3 h-3 text-[#c8f169]" />
                              <span>{item.buildingOrArea}</span>
                            </span>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-1 gap-3 text-left">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-sans font-bold text-sm text-primary leading-tight line-clamp-2 pr-2">
                              {item.title}
                            </h3>
                             <div className="flex flex-col items-end shrink-0 gap-0.5">
                              <span className="font-sans font-extrabold text-sm text-[#2A6F2B]">
                                ${item.suggestedSalePrice}
                              </span>
                              {item.estimatedOriginalPrice > item.suggestedSalePrice && (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">
                                  {Math.round(((item.estimatedOriginalPrice - item.suggestedSalePrice) / item.estimatedOriginalPrice) * 100)}% OFF
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground font-sans line-clamp-2 leading-relaxed italic">
                            {item.description}
                          </p>

                          <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground/80 font-sans">
                            <span>
                              {item.createdAt ? `Posted ${formatDistanceToNow(item.createdAt)} ago` : "Recently posted"}
                            </span>
                            
                            <button
                              onClick={() => {
                                setActiveItem(item);
                                setChatOpen(false);
                                setChatMessages([
                                  { sender: "seller", text: `Hi there! Thanks for your interest in the "${item.title}". It's still available. Standard pickup is in the lobby this afternoon. What time works for you?`, time: "Just now" }
                                ]);
                              }}
                              className="text-[#043f2e] font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>View Details</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div id="vault-empty-state" className="py-20 flex flex-col items-center text-center max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="w-20 h-20 bg-[#ecf0e1] rounded-full flex items-center justify-center mb-5 border border-primary/5">
                    <Heart className="w-9 h-9 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-primary mb-2">Favorites List is Empty</h3>
                  <p className="text-xs text-[#505a54] leading-relaxed mb-6 font-sans">
                    You haven't saved any listings yet. Explore verified posts on campus and bookmark favorites to lock them down!
                  </p>
                  <button 
                    onClick={onGoToExplore}
                    className="bg-[#043f2e] hover:bg-[#032e22] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Start Exploring</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

            </div>


        </div>
      )}

      {/* ENTER PRICE FOR DRAFT DIALOG/MODAL */}
      <AnimatePresence>
        {completingDraftId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background w-full max-w-sm rounded-xl p-6 shadow-2xl border border-border text-left"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-display font-bold text-lg text-primary">Lock in Price & Publish</h3>
                <button onClick={() => setCompletingDraftId(null)} className="text-muted-foreground p-1 hover:bg-slate-100 rounded-full cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-xs text-muted-foreground mb-4 font-sans">
                The AI suggests listing this item between <b className="text-[#2A6F2B]">
                  {sellerDraftListings.find(d => d.id === completingDraftId)?.estimatedRange || "$55 - $70"}
                </b> based on current student demand. Standard campus offline pickup.
              </p>

              <div className="space-y-3 mb-6">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block font-sans">Your Sale Price ($)</label>
                <input
                  type="number"
                  placeholder="Enter custom price e.g. 60"
                  value={completeDraftPrice}
                  onChange={(e) => setCompleteDraftPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-bold text-primary focus:outline-hidden focus:ring-2 focus:ring-[#043f2e] text-left"
                />
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    const finalPrice = Number(completeDraftPrice);
                    if (!finalPrice || finalPrice <= 0) {
                      alert("Please enter a valid price greater than 0");
                      return;
                    }
                    const draftToPublish = sellerDraftListings.find(d => d.id === completingDraftId);
                    if (!draftToPublish) return;

                    // Move to active listings!
                    setSellerActiveListings(prev => [
                      {
                        id: `sell-act-new-${Date.now()}`,
                        title: draftToPublish.title,
                        suggestedSalePrice: finalPrice,
                        imageUrls: draftToPublish.imageUrls,
                        views: 12,
                        boosted: false,
                        category: draftToPublish.category,
                        buildingOrArea: draftToPublish.buildingOrArea
                      },
                      ...prev
                    ]);
                    setSellerDraftListings(prev => prev.filter(d => d.id !== completingDraftId));
                    setCompletingDraftId(null);
                    alert(`Published! "${draftToPublish.title}" is now active in the Market.`);
                  }}
                  className="flex-1 py-3 bg-[#c8f169] text-[#00271b] hover:bg-black hover:text-[#c8f169] transition-all font-sans font-bold text-xs uppercase rounded-lg text-center cursor-pointer shadow-xs"
                >
                  Publish Listing
                </button>
                <button
                  onClick={() => setCompletingDraftId(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs uppercase rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL SCREEN - INTERACTIVE SAVED DETAILS MODAL */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-primary/75 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-background w-full max-w-[650px] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-card border-b border-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary uppercase bg-[#c8f169] px-2.5 py-0.5 rounded-full">
                    Verified Scholar Item
                  </span>
                  <span className="text-xs text-muted-foreground">• Favorites List</span>
                </div>
                <button 
                  onClick={() => { setActiveItem(null); setChatOpen(false); }}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scroll Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Photo */}
                <div className="relative aspect-[16/10] bg-muted rounded-xl overflow-hidden border border-border/45 shadow-3xs">
                  <img 
                    src={activeItem.imageUrls?.[0] || "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80"} 
                    alt={activeItem.title} 
                    onError={(e) => handleImageErrorEvent(e, activeItem.category, activeItem.title)}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}${window.location.pathname}?listing=${activeItem.id}`;
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setCopiedItemLink(true);
                        setTimeout(() => setCopiedItemLink(false), 2000);
                      } catch (err) {
                        console.error("Failed to copy link", err);
                      }
                    }}
                    className="absolute top-4 right-4 bg-card hover:bg-muted text-primary px-3 py-1.5 rounded-full shadow-md text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-border/10"
                  >
                    <Share2 className="w-3 text-primary animate-pulse" />
                    <span>{copiedItemLink ? "Link Copied!" : "Share Link"}</span>
                  </button>
                </div>

                {/* Details info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl font-display font-medium text-primary leading-tight">{activeItem.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold uppercase text-primary bg-[#043f2e]/5 px-2.5 py-0.75 rounded font-sans">
                          {activeItem.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • Listed {activeItem.createdAt ? formatDistanceToNow(activeItem.createdAt) + " ago" : "Recently"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-[#043f2e] block">${activeItem.suggestedSalePrice}</span>
                      {activeItem.estimatedOriginalPrice > activeItem.suggestedSalePrice && (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs text-muted-foreground line-through opacity-70">
                            Orig: ${activeItem.estimatedOriginalPrice}
                          </span>
                          <span className="text-[10px] font-bold text-white bg-emerald-700 px-1.5 py-0.5 rounded shadow-xs">
                            {Math.round(((activeItem.estimatedOriginalPrice - activeItem.suggestedSalePrice) / activeItem.estimatedOriginalPrice) * 100)}% OFF
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location card spec */}
                  <div className="p-4 bg-[#ecf0e1]/30 border border-primary/5 rounded-xl flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <h4 className="text-[10px] font-bold text-primary uppercase tracking-wide">Exchange Location Hub</h4>
                      <p className="text-sm font-semibold text-primary">{activeItem.buildingOrArea}</p>
                    </div>
                  </div>

                  {/* Description text */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4d6700] font-sans">Item Details & Condition</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-sans whitespace-pre-line bg-card p-4 rounded-xl border border-border/40">
                      {activeItem.description}
                    </p>
                  </div>
                </div>

                {/* Secure Negotiations Area */}
                <div className="border-t border-border pt-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase text-primary font-sans">Secure On-Campus Safe Trade</h4>
                  </div>

                  {!chatOpen ? (
                    <button
                      onClick={() => {
                        setChatOpen(true);
                      }}
                      className="w-full py-3.5 bg-[#043f2e] hover:bg-[#032e22] text-white font-bold text-xs rounded-lg active:scale-95 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message Seller / Arrange Meetup</span>
                    </button>
                  ) : (
                    /* Peer Chat Box details */
                    <div className="border border-border rounded-xl bg-card overflow-hidden flex flex-col h-[280px] shadow-sm animate-in fade-in-50 zoom-in-95 duration-200">
                      <div className="bg-[#043f2e] px-4 py-2.5 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#c8f169] rounded-full animate-ping"></span>
                          <span className="text-xs font-bold font-sans">Chatting with seller</span>
                        </div>
                        <span className="text-[10.5px] italic text-white/75 font-sans">({activeItem.sellerEmail})</span>
                      </div>

                      {/* Msg Area */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans max-h-48">
                        {chatMessages.map((msg, idx) => (
                          <div 
                            key={idx}
                            className={`flex flex-col max-w-[80%] ${msg.sender === "user" ? "ml-auto items-end animate-in fade-in slide-in-from-bottom-2" : "mr-auto items-start animate-in fade-in slide-in-from-bottom-1"}`}
                          >
                            <div className={`p-3 rounded-lg text-xs leading-relaxed ${msg.sender === "user" ? "bg-[#043f2e] text-white" : "bg-muted text-primary"}`}>
                              {msg.text}
                            </div>
                            <span className="text-[8.5px] text-muted-foreground opacity-65 mt-0.75">{msg.time}</span>
                          </div>
                        ))}
                      </div>

                      {/* Chat Input form overlay */}
                      <form onSubmit={handleSendChatMessage} className="p-3 border-t border-border flex items-center gap-2 bg-background shrink-0">
                        <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask about meeting times or item state..."
                          className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                        <button
                          type="submit"
                          className="bg-[#043f2e] text-white hover:bg-primary px-3.5 py-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                        >
                          Send
                        </button>
                      </form>
                    </div>
                  )}

                  <div className="text-[10px] text-muted-foreground leading-tight text-center italic font-sans animate-pulse">
                    *Meet in public, well-lit spaces like campus libraries or lounges. Befakor advocates for student peer trade safety.
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
