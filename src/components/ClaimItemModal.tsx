import { useState, useEffect } from "react";
import { runTransaction, doc, getDoc, collection, addDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Star, School, ShieldAlert, Loader2, Sparkles, CheckCircle2, X } from "lucide-react";

interface ClaimItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimItemId: string;
  claimSellerId: string;
  claimSpaceId: string;
  claimToken: string;
  onSuccess: (points: number, rating: number) => void;
}

export default function ClaimItemModal({
  isOpen,
  onClose,
  claimItemId,
  claimSellerId,
  claimSpaceId,
  claimToken,
  onSuccess
}: ClaimItemModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [collectorNote, setCollectorNote] = useState("");
  const [claimComplete, setClaimComplete] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(0);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchItemAndValidate = async () => {
      setLoading(true);
      setErrorMsg(null);
      setItemDetails(null);
      setClaimComplete(false);

      try {
        // 1. Check if user is logged in
        if (!currentUser) {
          setErrorMsg("AUTH_REQUIRED");
          setLoading(false);
          return;
        }

        // 2. Perform verification of distinct student accounts (State 04)
        if (currentUser.uid === claimSellerId) {
          setErrorMsg("SELF_CLAIM");
          setLoading(false);
          return;
        }

        const isEdu = currentUser.email?.toLowerCase().endsWith(".edu");
        if (!isEdu) {
          setErrorMsg("EDU_REQUIRED");
          setLoading(false);
          return;
        }

        // 3. Load item details
        if (claimItemId.startsWith("sell-act-")) {
          // Mock static active listing retrieval
          let title = "Chemistry 101 Syllabus & Binder Notes";
          let imageUrl = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80";
          
          if (claimItemId === "sell-act-free-1") {
            title = "Chemistry 101 Syllabus & Binder Notes";
          } else if (claimItemId === "sell-act-4") {
            title = "Marshall Stanmore Speaker";
            imageUrl = "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=300&q=80";
          } else if (claimItemId === "sell-act-5") {
            title = "Fjallraven Kanken Backpack";
            imageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80";
          }

          setItemDetails({
            id: claimItemId,
            title,
            suggestedSalePrice: 0,
            imageUrls: [imageUrl],
            buildingOrArea: claimSpaceId || "North Quad"
          });
        } else {
          // Real Firestore document fetch
          const docSnap = await getDoc(doc(db, "listings", claimItemId));
          if (!docSnap.exists()) {
            setErrorMsg("This listing no longer exists or was removed.");
            setLoading(false);
            return;
          }

          const data = docSnap.data();
          if (data.status !== "available") {
            setErrorMsg("This item has already been successfully claimed or is marked as sold.");
            setLoading(false);
            return;
          }

          // Verify token if it was initiated
          if (data.claimToken && data.claimToken !== claimToken) {
            setErrorMsg("This claim link has expired or is invalid. Please request a new claim link from the seller.");
            setLoading(false);
            return;
          }

          setItemDetails({ id: docSnap.id, ...data });
        }
      } catch (err: any) {
        console.error("Error verifying claim parameters", err);
        setErrorMsg("Failed to verify transaction variables: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItemAndValidate();
  }, [isOpen, claimItemId, claimSellerId, claimToken, currentUser]);

  const handleDoubleUnlock = async () => {
    if (!currentUser || !itemDetails) return;
    setSubmitting(true);
    setErrorMsg(null);

    // Algorithmic Scoring Formula: Base 10 + selectedRating * 2
    const totalPayout = 10 + selectedRating * 2;

    try {
      if (itemDetails.id.startsWith("sell-act-")) {
        // Complete mock transaction in local storage
        const localClaims = JSON.parse(localStorage.getItem("befakor-claims-history") || "[]");
        localClaims.unshift({
          id: `claim-${Date.now()}`,
          itemId: itemDetails.id,
          itemTitle: itemDetails.title,
          sellerId: claimSellerId,
          buyerEmail: currentUser.email,
          buyerName: currentUser.email?.split("@")[0] || "Student",
          rating: selectedRating,
          points: totalPayout,
          createdAt: Date.now(),
          imageUrl: itemDetails.imageUrls?.[0]
        });
        localStorage.setItem("befakor-claims-history", JSON.stringify(localClaims));

        // Increment local score variables
        const localUserStats = JSON.parse(localStorage.getItem(`befakor-stats-${currentUser.uid}`) || "{}");
        localUserStats.karmaEarned = (localUserStats.karmaEarned || 1240) + totalPayout;
        localUserStats.itemsRehomed = (localUserStats.itemsRehomed || 42) + 1;
        localStorage.setItem(`befakor-stats-${currentUser.uid}`, JSON.stringify(localUserStats));

        setPointsAwarded(totalPayout);
        setClaimComplete(true);
        setTimeout(() => {
          onSuccess(totalPayout, selectedRating);
        }, 1800);
      } else {
        // Real Firestore secure transaction (Completion: State 05 with scoring transaction)
        const itemRef = doc(db, "listings", itemDetails.id);
        const sellerRef = doc(db, "users", claimSellerId);

        await runTransaction(db, async (transaction) => {
          const itemSnap = await transaction.get(itemRef);
          if (!itemSnap.exists()) {
            throw new Error("Free listing no longer exists.");
          }
          const itemData = itemSnap.data();
          if (itemData.status !== "available") {
            throw new Error("This item has already been claimed.");
          }

          // Update listing in-transaction
          transaction.update(itemRef, {
            status: "sold", // Mark as sold
            claimedBy: currentUser.uid,
            claimedAt: Date.now(),
            claimRating: selectedRating,
            claimCollectorNote: collectorNote
          });

          // Write secure hand-off record
          const handoffRef = doc(collection(db, "handoffs"));
          transaction.set(handoffRef, {
            itemId: itemDetails.id,
            itemTitle: itemData.title,
            sellerId: claimSellerId,
            sellerEmail: itemData.sellerEmail || "seller@university.edu",
            buyerId: currentUser.uid,
            buyerEmail: currentUser.email,
            rating: selectedRating,
            points: totalPayout,
            imageUrl: itemData.imageUrls?.[0] || "",
            createdAt: Date.now()
          });

          // Fetch and increment seller score & items count
          const sellerSnap = await transaction.get(sellerRef);
          let currentKarma = 1240;
          let currentRehomed = 42;
          if (sellerSnap.exists()) {
            const sd = sellerSnap.data();
            currentKarma = Number(sd.karmaEarned) || 0;
            currentRehomed = Number(sd.itemsRehomed) || 0;
          }
          transaction.update(sellerRef, {
            karmaEarned: currentKarma + totalPayout,
            itemsRehomed: currentRehomed + 1,
            updatedAt: new Date()
          });
        });

        // Trigger score state listeners locally
        window.dispatchEvent(new Event("befakor-karma-updated"));

        setPointsAwarded(totalPayout);
        setClaimComplete(true);
        setTimeout(() => {
          onSuccess(totalPayout, selectedRating);
        }, 1800);
      }
    } catch (err: any) {
      console.error("Firestore claiming transaction error", err);
      setErrorMsg("Transaction execution failed: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="claim-verification-overlay" className="fixed inset-0 bg-[#043f2e]/60 backdrop-blur-sm flex items-center justify-center p-4 z-100 overflow-y-auto">
      <div 
        id="claim-portal-container"
        className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col border border-neutral-100 animate-in zoom-in-95 duration-250 relative text-left"
      >
        
        {/* Header Ribbon */}
        <div className="bg-[#043f2e] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <School className="w-4 h-4 text-[#c8f169]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c8f169]">Verified Free Claim Portal</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Dynamic Loading block */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#043f2e] animate-spin" />
            <p className="text-xs text-muted-foreground font-sans">Synchronizing ledger...</p>
          </div>
        ) : claimComplete ? (
          /* SUCCESS TRANSACTION COMPLETION SCREEN (State 05 Execution Success) */
          <div className="p-8 flex flex-col items-center justify-center gap-5 text-center animate-in fade-in-50 duration-300">
            <div className="w-16 h-16 bg-[#d4f878] rounded-full flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-9 h-9 text-[#043f2e]" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-[#043f2e]">Double-Unlock Succeeded!</h3>
              <p className="text-xs text-muted-foreground font-sans px-4">
                You successfully marked this item as collected, authorizing points allocation.
              </p>
            </div>

            <div className="bg-neutral-50 px-5 py-4 border border-neutral-200/60 rounded-xl flex flex-col items-center gap-1">
              <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">PAYOUT DEPLOYED</span>
              <span className="font-display font-black text-2xl text-[#2A6F2B]">+{pointsAwarded} Karma Pts</span>
              <span className="text-[9px] text-[#505a54] font-medium font-sans">Credited securely via Transaction Ledger</span>
            </div>

            <p className="text-[10px] text-muted-foreground font-sans italic animate-pulse">
              Finalizing local state databases...
            </p>
          </div>
        ) : errorMsg === "AUTH_REQUIRED" ? (
          /* State 04 Authentication Requirement Panel */
          <div className="p-6 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200/60 p-4 rounded-xl flex gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-sans font-bold text-xs text-yellow-800">Registration Requirement</h4>
                <p className="text-[11px] text-yellow-700 font-sans mt-1 leading-relaxed">
                  Only verified members can view or claim listed items.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                To collect this free index offering, please complete your registration or login cycle now.
              </p>
              <button
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new Event("befakor-exit-guest-mode"));
                }}
                className="w-full py-3.5 bg-[#043f2e] hover:bg-black text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm text-center"
              >
                Sign In or Register with .EDU Email
              </button>
            </div>
          </div>
        ) : errorMsg === "EDU_REQUIRED" ? (
          /* State 04 EDU requirement error */
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-[#043f2e]">Verified Student Email Required</h4>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                You are currently logged in with a non-.edu profile (<strong>{currentUser?.email}</strong>). Free claiming is restricted to .edu addresses.
              </p>
            </div>

            <div className="bg-neutral-50 p-4 border border-neutral-200/80 rounded-xl text-left text-[11px] text-neutral-600 leading-relaxed font-sans">
              To farm prevent, our security engines enforce that both parties of a hand-off are registered .edu academic domain accounts.
            </div>

            <button
              onClick={() => {
                auth.signOut();
                onClose();
                window.dispatchEvent(new Event("befakor-exit-guest-mode"));
              }}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
            >
              Log Out and Change Account
            </button>
          </div>
        ) : errorMsg === "SELF_CLAIM" ? (
          /* STATE 04 FARM PREVENTION GUARD RAIL (Self-Claiming Block) */
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-red-600">Self-Claim Prevention Guardrail</h4>
              <p className="text-xs text-[#043f2e] font-sans leading-relaxed">
                You are registered as the listing owner of this item (<strong>{currentUser?.email}</strong>).
              </p>
            </div>

            <div className="bg-red-50/50 p-4 border border-red-100 rounded-xl text-left text-[11px] text-red-800 leading-relaxed font-sans font-medium">
              ⚠️ <strong>ANTI-FARMING STANDARD:</strong> To prevent a user from creating fake accounts or trying to claim their own free list to farm points, you are prevented from conducting transaction collection on items you published.
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-950 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
            >
              Decline Collection
            </button>
          </div>
        ) : errorMsg ? (
          /* General Error state */
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <p className="text-xs text-rose-600 font-sans leading-relaxed px-4">{errorMsg}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-bold text-primary cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        ) : (
          /* STATE 05 THE DOUBLE-UNLOCK (VERIFICATION & RATING) */
          <div className="p-5 flex flex-col gap-4">
            
            {/* Item Mini Card */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200/60 flex items-center gap-3">
              <div className="w-14 h-14 bg-neutral-100 rounded-lg overflow-hidden shrink-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={itemDetails.imageUrls?.[0] || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150&q=80"} 
                  alt={itemDetails.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <h4 className="font-sans font-bold text-xs text-[#043f2e] truncate">{itemDetails.title}</h4>
                <p className="text-[10px] text-emerald-700 font-bold font-sans mt-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Free re-homing item</span>
                </p>
                <p className="text-[9px] text-neutral-400 font-sans mt-0.5">Spot: {itemDetails.buildingOrArea}</p>
              </div>
            </div>

            {/* Buyer Verification Explanation */}
            <div className="text-xs text-neutral-500 leading-relaxed font-sans text-left space-y-1">
              <p>
                By proceeding, you verify that you have successfully met with <strong>{(itemDetails.sellerEmail || "the seller").split("@")[0]}</strong> and received the item.
              </p>
              <p className="text-[10px] text-neutral-400 italic">
                Authorized under verified account: {currentUser?.email}
              </p>
            </div>

            {/* Double Unlock Interactive Rating Selector */}
            <div className="border-t border-neutral-100 pt-3.5 space-y-2.5">
              <label className="text-[10px] font-bold text-[#505a54] uppercase tracking-wider block text-left">
                Rate Seller Coordination Support
              </label>
              
              <div className="flex justify-center gap-2 py-1">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isActive = (hoverRating !== null ? hoverRating : selectedRating) >= starValue;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setSelectedRating(starValue)}
                      className={`p-1 hover:scale-110 transition-transform cursor-pointer shrink-0`}
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors ${
                          isActive 
                            ? "fill-[#add450] text-[#043f2e]" 
                            : "text-neutral-200 fill-none"
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>

              {/* Real time rating context note */}
              <p className="text-[10px] text-center font-bold text-[#4d6700]">
                {selectedRating === 5 && "⭐ Excellent: Quick and highly organized hand-off coordination!"}
                {selectedRating === 4 && "⭐ Very Good: Clean and timely collection."}
                {selectedRating === 3 && "⭐ Good: Seamless hand-off."}
                {selectedRating === 2 && "⭐ Average: Communication was a bit slow."}
                {selectedRating === 1 && "⭐ Needs Improvement."}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <textarea
                placeholder="Leave an optional thank you note for the seller (visible in their Karma logs)..."
                rows={2}
                value={collectorNote}
                onChange={(e) => setCollectorNote(e.target.value)}
                className="w-full text-xs p-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#043f2e]/20"
              />
            </div>

            {/* Completion execution button */}
            <button
              onClick={handleDoubleUnlock}
              disabled={submitting}
              className="w-full py-3.5 bg-[#add450] hover:bg-[#9cbd44] text-[#043f2e] font-display text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs border border-[#9cbd44]/15 flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Invoking double-lock transactional ledger...</span>
                </>
              ) : (
                <>
                  <span>Successfully Collected & Unlock Karma</span>
                </>
              )}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
