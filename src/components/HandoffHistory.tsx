import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { ArrowLeft, Filter, TrendingUp, Box, Award, ShieldCheck, Star } from "lucide-react";

interface HandoffHistoryProps {
  onBack: () => void;
  currentUserKarma?: number;
  currentUserRehomed?: number;
}

interface HandoffRecord {
  id: string;
  itemTitle: string;
  buyerEmail?: string;
  buyerName?: string;
  rating: number;
  points: number;
  createdAt: number;
  imageUrl?: string;
  comment?: string;
  role?: "buyer" | "seller";
}

export default function HandoffHistory({ onBack, currentUserKarma = 1240, currentUserRehomed = 42 }: HandoffHistoryProps) {
  const [handoffList, setHandoffList] = useState<HandoffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "high" | "low">("all");

  // Replicate user's exact mockup items from screenshots
  const mockHandoffs: HandoffRecord[] = [
    {
      id: "mock-h-1",
      itemTitle: "Organic Chemistry Textbook",
      buyerName: "Sarah Jenkins",
      rating: 5,
      points: 15,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJkYQW85GIKo-e0u_avIIRXrMpoFzMUGAQLYKs0APrLfktDCSfEdivAhFctKnFlnupswkOrNXj7OtE2bGzTAISRZhoeLdkjmAxCoyUWjstl4ZDWw2AEdw6LXUh1_bEadgsVbSWSnm-S_vC3ppMPowzyO2xWldV1Ko01gQCvAPEl08w5y2YUNvYqtczrEkjmROU5HhvAZW88FN5KIr5t2527c1Rj0d3soKVxD_Rpp3tSNu0N6oMnpSyeagjG49gp8PzcrX1LcLufw4",
      comment: "Super convenient! Alexis met me near the library with the book in mint shape.",
      role: "seller"
    },
    {
      id: "mock-h-2",
      itemTitle: "AeroPress Go Coffee Maker",
      buyerName: "Michael Chen",
      rating: 5,
      points: 25,
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA_mGYhAHJEmEwh6L90QDHAdRYlRMFnsyCbFivbiFbMZetkLnT6xPRzfTtCOfzhf9vmgKt4Rv7ZvBzPtunJI2sezQkogHFnq2RwqMMKWSimZpHWw6LFHjY1WMUhhP7mLoeXaCq8yqQ_YLjIco4Zjm4WKUr_wIYjmdyckRnndjaNwUEL2Ava8ZbXaPi9YSeIWJ-w2FH-1eBBmCpXAv21kJ6rAPfWaAqB-myyDTN7qAlK8smq5FJYIhR2BX_Gu2YLYTOp48P34EMeXzU",
      comment: "Excellent coffee setup. Saved me so much money for coffee runs in the morning.",
      role: "seller"
    },
    {
      id: "mock-h-3",
      itemTitle: "Logitech MX Master 3",
      buyerName: "Aria Vance",
      rating: 4,
      points: 30,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 1 week ago
      imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=150&q=80",
      comment: "Mouse corresponds exactly to the description, minor wear but functions perfectly.",
      role: "seller"
    },
    {
      id: "mock-h-4",
      itemTitle: "Artist's Drawing Set (12pcs)",
      buyerName: "David Miller",
      rating: 4,
      points: 10,
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 2 weeks ago
      imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=150&q=80",
      comment: "Quick and easy handoff. Alexis responsive and helpful with the product coordinates.",
      role: "seller"
    }
  ];

  useEffect(() => {
    const fetchHandoffHistory = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, "handoffs"),
          where("sellerId", "==", auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        const liveRecords: HandoffRecord[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          const emailPrefix = d.buyerEmail ? d.buyerEmail.split("@")[0] : "Student";
          const capitalized = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          liveRecords.push({
            id: docSnap.id,
            itemTitle: d.itemTitle || "Campus exchange item",
            buyerName: d.buyerName || capitalized,
            rating: d.rating || 5,
            points: d.points || 15,
            createdAt: d.createdAt || Date.now(),
            imageUrl: d.imageUrl || "",
            comment: d.comment || "Smooth trade meetup!",
            role: "seller"
          });
        });
        
        // Merge with any custom rated purchases from localStorage
        const storedPurchasesStr = localStorage.getItem("befakor-purchased-items");
        const customRatedList: HandoffRecord[] = [];
        if (storedPurchasesStr) {
          const parsedPurchases = JSON.parse(storedPurchasesStr);
          parsedPurchases.forEach((item: any, idx: number) => {
            if (item.rating) {
              customRatedList.push({
                id: `custom-p-rev-${idx}`,
                itemTitle: item.itemTitle,
                buyerName: `@${item.seller}`,
                rating: item.rating,
                points: 15,
                createdAt: Date.now() - idx * 24 * 3600 * 1000,
                imageUrl: item.imageUrl,
                comment: item.comment || "Verified transaction. Alexis was super friendly!",
                role: "buyer"
              });
            }
          });
        }
        
        // Merge real Firestore records, custom ratings and high fidelity mock records
        setHandoffList([...customRatedList, ...liveRecords, ...mockHandoffs]);
      } catch (err) {
        console.error("Failed to load handoff history from DB", err);
        setHandoffList(mockHandoffs);
      } finally {
        setLoading(false);
      }
    };

    fetchHandoffHistory();
  }, []);

  const getRelativeTimeString = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days <= 0) return "Just now";
    if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`;
    if (days < 14) return "1 week ago";
    return `${Math.floor(days / 7)} weeks ago`;
  };

  const filteredList = handoffList.filter((item) => {
    if (categoryFilter === "high") return item.points >= 25;
    if (categoryFilter === "low") return item.points < 25;
    return true;
  });

  return (
    <div id="handoff-history-view" className="w-full max-w-xl mx-auto py-2 animate-in fade-in-50 duration-300 flex flex-col gap-6 text-left pb-16">
      
      {/* Title Header Row */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#043f2e] font-bold text-sm tracking-wide bg-white border border-neutral-200/80 hover:bg-neutral-50 px-3.5 py-2.0 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        
        <h2 className="text-xl font-display font-bold text-[#043f2e] italic">Hand-off History</h2>
        
        <div className="w-9 h-9 rounded-full bg-[#043f2e]/10 flex items-center justify-center text-[10px] font-bold text-[#043f2e] cursor-help" title="Student Circular Scorecard active">
          H✓
        </div>
      </div>

      {/* Hero Stats Panel (Deep Green & Light Lime) */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* TOTAL KARMA EARNED CARD */}
        <div className="bg-[#043f2e] text-[#f9fbf6] p-6 rounded-2xl flex flex-col justify-between relative shadow-sm overflow-hidden min-h-[140px]">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#c8f169]">TOTAL KARMA EARNED</p>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight mt-1 flex items-baseline gap-1.5">
              {currentUserKarma.toLocaleString()} <span className="text-xs font-bold text-[#c8f169]">Pts</span>
            </h1>
          </div>
          
          <div className="mt-4 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#c8f169]" />
            <span className="text-[11px] font-bold text-[#c8f169]/90">+85 pts this month</span>
          </div>
          
          {/* Watermark leaf pattern in the corner */}
          <div className="absolute right-[-10px] bottom-[-20px] opacity-10 pointer-events-none select-none">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L8.21,15.75C11.1,14 14,12.5 17,12.5C19.74,12.5 22,11 22,8C22,5 19,3 17,3C14.2,3 13.12,4.88 11.75,6.67C10.38,8.46 8,11.5 8,11.5L11,11.5C11,11.5 12.62,9.36 13.87,7.7C15.12,6.04 15.5,5 17,5C18.1,5 20,6.1 20,8C20,9.9 18.1,10.5 17,10.5C15.2,10.5 13.4,11.4 11.6,12.3L15.3,13C16,11 16.5,9.5 17,8Z" />
            </svg>
          </div>
        </div>

        {/* ITEMS RE-HOMED CARD */}
        <div className="bg-[#d4f878] text-[#043f2e] p-6 rounded-2xl flex flex-row items-center justify-between relative shadow-sm border border-[#c3eb64]">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#043f2e]/70">ITEMS RE-HOMED</p>
            <h1 className="font-display text-4xl font-extrabold leading-none mt-1">
              {currentUserRehomed}
            </h1>
            <p className="text-xs text-[#043f2e]/85 mt-2 max-w-[240px] leading-relaxed font-sans font-medium">
              Contributing to a circular campus economy.
            </p>
          </div>
          <div className="w-14 h-14 bg-white/40 border border-[#043f2e]/10 rounded-xl flex items-center justify-center shrink-0 shadow-3xs">
            <Box className="w-7 h-7 text-[#043f2e]" />
          </div>
        </div>

      </div>

      {/* Action Title and Filter Header */}
      <div className="flex items-center justify-between mt-2 border-b border-neutral-100 pb-3">
        <h3 className="font-display font-bold text-lg text-[#043f2e] italic">Successful Hand-offs</h3>
        
        {/* Dynamic Category Pill Filters */}
        <div className="flex gap-1.5 items-center bg-neutral-100 p-1 rounded-lg">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${categoryFilter === "all" ? "bg-white text-[#043f2e] shadow-3xs" : "text-neutral-500 hover:text-neutral-950"}`}
          >
            All
          </button>
          <button
            onClick={() => setCategoryFilter("high")}
            className={`px-3 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${categoryFilter === "high" ? "bg-white text-[#043f2e] shadow-3xs" : "text-neutral-500 hover:text-neutral-950"}`}
          >
            High pts
          </button>
        </div>
      </div>

      {/* Successful Exchanges List elements */}
      <div className="flex flex-col gap-4">
        {filteredList.map((item) => (
          <div 
            key={item.id}
            className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-3xs flex flex-col gap-3 hover:border-neutral-300 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              {/* Product Thumbnail view */}
              <div className="w-16 h-16 rounded-xl border border-neutral-100 overflow-hidden bg-neutral-50 shrink-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={item.imageUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150&q=80"} 
                  alt={item.itemTitle} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Product description block */}
              <div className="flex-1 min-w-0 flex flex-col text-left gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-sans font-bold text-sm text-[#043f2e] truncate">{item.itemTitle}</h4>
                  {item.role === "buyer" ? (
                    <span className="bg-blue-50 text-blue-800 text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-blue-100">
                      Purchased
                    </span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-800 text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-emerald-100">
                      Re-Homed
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 font-sans flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2A6F2B]" />
                  <span>
                    {item.role === "buyer" ? "Reviewed Seller " : "Handed off to "}
                    <strong className="text-[#043f2e] font-semibold">{item.buyerName}</strong>
                  </span>
                </p>
                <span className="text-[10px] text-neutral-400 font-sans">{getRelativeTimeString(item.createdAt)}</span>
              </div>

              {/* Earned Score points badges */}
              <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
                <span className="font-display font-black text-lg text-[#2A6F2B]">+{item.points} Pts</span>
                <span className="text-[7.5px] uppercase font-extrabold tracking-widest text-[#505a54]">Karma Awarded</span>
              </div>
            </div>

            {/* Stars and Comment block if rating exists */}
            {item.rating && (
              <div className="bg-neutral-50/80 rounded-xl p-3 border border-neutral-100 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      className={`w-3.5 h-3.5 ${idx < item.rating ? "fill-amber-400 text-amber-500" : "text-neutral-200"}`} 
                    />
                  ))}
                  <span className="text-[10px] font-mono font-bold text-neutral-500 ml-1">Rating: {item.rating}.0 / 5.0</span>
                </div>
                {item.comment && (
                  <p className="text-xs text-neutral-600 leading-relaxed font-sans italic">
                    "{item.comment}"
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        
        {filteredList.length === 0 && (
          <div className="p-8 text-center italic text-neutral-400 text-xs">
            No hand-offs registered under this filter.
          </div>
        )}
      </div>

      {/* Load More Trigger Button */}
      <button 
        onClick={() => alert("All circular verified transactions synchronized from your campus ledger.")}
        className="w-full py-3 bg-[#fafbf7] hover:bg-[#ecf0e1] border border-neutral-200 text-[#043f2e] font-display font-extrabold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center"
      >
        Load More History
      </button>

    </div>
  );
}
