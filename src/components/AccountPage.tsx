import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { doc, getDoc, updateDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from "../lib/firebase";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { compressImageToBase64 } from "../lib/imageUtils";
import { validateUsernameFormat, checkUsernameAvailability } from "../lib/authValidation";
import { 
  User as UserIcon, 
  Mail, 
  MapPin, 
  GraduationCap, 
  LogOut, 
  Star, 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  School,
  Camera
} from "lucide-react";

interface AccountPageProps {
  mode?: "buyer" | "seller";
  onGoToSellerDashboard?: (initialView?: "create" | "space" | "vault") => void;
}

export default function AccountPage({ mode, onGoToSellerDashboard }: AccountPageProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorsMsg, setErrorsMsg] = useState("");
  
  const [uni, setUni] = useState("");
  const [dorm, setDorm] = useState("");
  const [usernameVal, setUsernameVal] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  
  // Custom Karma parameters
  const [karmaEarned, setKarmaEarned] = useState(1240);
  const [itemsRehomed, setItemsRehomed] = useState(42);
  const [showHandoffs, setShowHandoffs] = useState(false);

  const activeRole = mode || localStorage.getItem("befakor-mode") || "buyer";

  const [purchasedItems, setPurchasedItems] = useState<any[]>(() => {
    const defaultPurchases = [
      {
        id: "purchase-1",
        itemTitle: "Aeropress Go Mug & Filter",
        seller: "clara_physics",
        price: 25,
        date: "Yesterday",
        rating: 5,
        comment: "Excellent transaction near Science Center!",
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=150&q=80"
      },
      {
        id: "purchase-2",
        itemTitle: "Microeconomics Study Guide",
        seller: "econ_guru",
        price: 15,
        date: "3 days ago",
        rating: null,
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzB91Lm2UyPWXRt3CLQEWRHjUqS9TsQR1SLwI39cgSF54xeF-8rjf5B49ldWdM0xUdrrZUJoqKEoIU7-i3gh4roUwgxCMUuJ2jgeTh-Dcabi7W6l4UIpDALBPmWtXaxBS8yv9gLM-Zi_w9A4W3IlQ1r0izxYl0MQHkwwV5olmKuJIGq38D12Zo-55DWvVn4VaNzpzPbrR9uOGf-nZA8dkOCS2Lb8U9GxiSUcHlQ-GdB74D7gfvlDzJPxcqj-foxV9CHjJ5qM6rq1s"
      },
      {
        id: "purchase-3",
        itemTitle: "Comfort Dorm Desk Chair",
        seller: "alexis_m",
        price: 40,
        date: "5 days ago",
        rating: null,
        imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVia3vi9Edkfrm3TxiOP6dsYlM_CUWwXMsX6QoOu5fPnxLxSWyYFYIqgceT6kRxuWZxPz-jYqroet0Euuyin6XwikYOJKyqP2KwfcI4Hp4o6EGY2Ac18UOfi6k4EoeIBBXEl9sOKMLsxjmnVodW3Grg4NOOYbmWMNWtlWq2iqOEH89KYuFf56qTZClvjn8fFdR5tzNxVCKAPPrEFKk1vRsncN3yvlIePIGpLp0nnHPwwdL2LOug4j8c4vTMMmHT4vDR0xo1XOPDOw"
      }
    ];
    try {
      const stored = localStorage.getItem("befakor-purchased-items");
      if (stored) {
        return JSON.parse(stored);
      } else {
        localStorage.setItem("befakor-purchased-items", JSON.stringify(defaultPurchases));
        return defaultPurchases;
      }
    } catch {
      return defaultPurchases;
    }
  });

  const [ratingItemId, setRatingItemId] = useState<string | null>(null);
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"settings" | "purchases">("settings");

  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUni(data.university || "");
            setDorm(data.dorm || "");
            setUsernameVal(data.username || "");
            setInitialUsername(data.username || "");
            setFullName(data.fullName || "");
            setPhotoUrl(data.photoUrl || "");
            
            // Load verified dynamic Karma scores
            setKarmaEarned(data.karmaEarned !== undefined ? Number(data.karmaEarned) : 1240);
            setItemsRehomed(data.itemsRehomed !== undefined ? Number(data.itemsRehomed) : 42);
          }
          
          // Merge local score caches if any exists for preview fidelity
          try {
            const localStatsStr = localStorage.getItem(`befakor-stats-${user.uid}`);
            if (localStatsStr) {
              const localStats = JSON.parse(localStatsStr);
              if (localStats.karmaEarned !== undefined) {
                setKarmaEarned(localStats.karmaEarned);
              }
              if (localStats.itemsRehomed !== undefined) {
                setItemsRehomed(localStats.itemsRehomed);
              }
            }
          } catch (localErr) {
            console.warn("Could not parse local score cached variables", localErr);
          }
        } catch (err) {
          console.error("Failed to load user document info", err);
        }
      };
      fetchProfile();
      
      // Listen to dynamic karma update events
      const handleKarmaUpdate = () => {
        fetchProfile();
      };
      window.addEventListener("befakor-karma-updated", handleKarmaUpdate);
      return () => window.removeEventListener("befakor-karma-updated", handleKarmaUpdate);
    }
  }, [user]);

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setSuccessMsg("");
    setErrorsMsg("");

    const trimmedUser = usernameVal.trim().toLowerCase();
    
    if (trimmedUser !== initialUsername) {
      const formatCheck = validateUsernameFormat(trimmedUser);
      if (!formatCheck.valid) {
        setErrorsMsg(formatCheck.error || "Please choose a valid username (3-20 characters: letters, numbers, or underscores).");
        setLoading(false);
        return;
      }

      const avail = await checkUsernameAvailability(trimmedUser, user.uid);
      if (!avail.available) {
        setErrorsMsg(avail.error || `The username "@${trimmedUser}" is already taken by another student.`);
        setLoading(false);
        return;
      }
    }

    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", user.uid), {
        university: uni,
        dorm: dorm,
        username: trimmedUser,
        fullName: fullName.trim(),
        photoUrl: photoUrl,
        updatedAt: new Date()
      });

      if (trimmedUser !== initialUsername) {
        batch.set(doc(db, "usernames", trimmedUser), {
          uid: user.uid,
          createdAt: serverTimestamp()
        });
        if (initialUsername) {
          batch.delete(doc(db, "usernames", initialUsername));
        }
      }

      await batch.commit();
      setInitialUsername(trimmedUser);

      try {
        localStorage.setItem("befakor-selected-university", uni);
        localStorage.setItem("befakor-selected-dorm", dorm);
      } catch (e) {}
      setSuccessMsg("Your student profile has been saved successfully!");
    } catch (err: any) {
      setErrorsMsg(err.message || "Failed to update profile settings.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setSuccessMsg("");
    setErrorsMsg("");
    try {
      const base64 = await compressImageToBase64(file);
      if (base64) {
        if (auth.currentUser) {
          const fileRef = ref(storage, `profiles/${auth.currentUser.uid}/avatar.jpg`);
          // Upload to Firebase Storage
          await uploadString(fileRef, base64, "data_url");
          const cloudUrl = await getDownloadURL(fileRef);
          if (cloudUrl) {
            setPhotoUrl(cloudUrl);
            setSuccessMsg("Profile photo updated, uploaded, and optimized! Click 'Apply Settings' below to save changes.");
          } else {
            throw new Error("Could not retrieve upload URL.");
          }
        } else {
          setPhotoUrl(base64);
          setSuccessMsg("Profile photo updated. Remember to click 'Apply Settings' to save.");
        }
      }
    } catch (uploadErr) {
      console.error("Photo upload failed", uploadErr);
      setErrorsMsg("Failed to upload photo to Cloud Storage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCleanUniversityName = (val: string) => {
    if (!val) return "Not Configured";
    const clean = val.toLowerCase().trim();
    if (clean === "stanford") return "Stanford University";
    if (clean === "berkeley") return "UC Berkeley";
    if (clean === "mit") return "Boston, MA (MIT, BU, Northeastern)";
    if (clean === "harvard") return "Harvard University";
    if (clean === "oxford") return "University of Oxford";
    if (clean === "nyu") return "New York University";
    if (clean === "umich") return "University of Michigan";
    return val;
  };

  const getCleanDormName = (val: string) => {
    if (!val) return "Not Configured";
    return val.replace("hall-a", "North Quad - Hall A")
      .replace("hall-b", "South Quad - Hall B")
      .replace("hall-c", "West Residence Tower")
      .replace("off-campus", "Off-Campus Housing")
      .replace("Soldiers Field", "Soldiers Field Park");
  };

  const handleSubmitReview = (itemId: string) => {
    const updated = purchasedItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          rating: ratingVal,
          comment: ratingComment || "Verified transaction. Everything was great!"
        };
      }
      return item;
    });

    setPurchasedItems(updated);
    localStorage.setItem("befakor-purchased-items", JSON.stringify(updated));

    // Reset rating states & notify
    setRatingItemId(null);
    setRatingComment("");
    setRatingVal(5);
    setSuccessMsg("✓ Thank you! Your review has been saved, raising the seller's trust level across the network!");

    // Dispatch the custom karma updated event
    window.dispatchEvent(new Event("befakor-karma-updated"));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full py-4 pb-12 animate-in fade-in-50 duration-300">
      
      {/* Account Info Profile Header Card */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <header className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 font-sans">
            MEMBER SETTINGS & PASSPORT
          </p>
          <h2 className="text-4xl font-display font-medium text-primary">
            Profile Dashboard
          </h2>
          <p className="text-base text-muted-foreground max-w-xl">
            Update your college dorm coordinates and inspect your purchase history.
          </p>
        </header>

        {/* Profile Dashboard Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Options Navigation List (Left Sidebar) */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#505a54] px-1 font-mono">
              Dashboard Options
            </h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveSubTab("settings")}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col gap-1.5 border ${
                  activeSubTab === "settings"
                    ? "bg-[#043f2e] text-[#c8f169] border-[#043f2e] shadow-xs"
                    : "bg-card hover:bg-[#ecf0e1]/30 border-border text-primary"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${activeSubTab === "settings" ? "text-[#c8f169]" : "text-primary"}`}>⚙️</span>
                  <span className="font-display font-bold text-xs uppercase tracking-wider">Profile & Dorm</span>
                </div>
                <p className={`text-[10px] leading-normal ${activeSubTab === 'settings' ? 'text-stone-300' : 'text-muted-foreground'}`}>
                  Update your registered college domain, active hall/dorm room, and customized peer name.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab("purchases")}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col gap-1.5 border ${
                  activeSubTab === "purchases"
                    ? "bg-[#043f2e] text-[#c8f169] border-[#043f2e] shadow-xs"
                    : "bg-card hover:bg-[#ecf0e1]/30 border-border text-primary"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${activeSubTab === "purchases" ? "text-[#c8f169]" : "text-primary"}`}>🛍️</span>
                    <span className="font-display font-bold text-xs uppercase tracking-wider">Orders & Ratings</span>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${activeSubTab === 'purchases' ? 'bg-[#c8f169] text-[#043f2e] font-black' : 'bg-muted text-muted-foreground font-bold'}`}>
                    {purchasedItems.length}
                  </span>
                </div>
                <p className={`text-[10px] leading-normal ${activeSubTab === 'purchases' ? 'text-stone-300' : 'text-muted-foreground'}`}>
                  Review previous transactions, trace receipt timelines, and rate active sellers.
                </p>
              </button>
            </div>
          </div>

          {/* Active Navigation Panel (Right side) */}
          <div className="md:col-span-8">
            {activeSubTab === "settings" ? (
              <div className="bg-card p-6 rounded-xl border border-border shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center font-display font-bold text-2xl uppercase select-none overflow-hidden group border border-border shrink-0">
                      {photoUrl ? (
                        <img src={photoUrl} alt="Student profile" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{usernameVal ? usernameVal[0] : (user?.email ? user.email[0] : "S")}</span>
                      )}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-5 h-5 text-white" />
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="space-y-0.5 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-primary">{fullName || usernameVal || "Member"}</h3>
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          Verified (.edu)
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {user?.email}
                      </p>
                      {usernameVal && (
                        <p className="text-[11px] font-mono text-primary/80">
                          @{usernameVal}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => auth.signOut()}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all active:scale-[0.98] shrink-0 self-start sm:self-center"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>

                <form onSubmit={handleUpdate} className="space-y-5">
                  {successMsg && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-semibold">
                      {successMsg}
                    </div>
                  )}
                  
                  {errorsMsg && (
                    <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-lg text-xs font-semibold">
                      {errorsMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="fullName">Name</label>
                      <input 
                        id="fullName"
                        type="text"
                        placeholder="e.g. Alexis Carter"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-primary"
                      />
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="usernameVal">Username</label>
                      <input 
                        id="usernameVal"
                        type="text"
                        placeholder="e.g. alex_campus"
                        value={usernameVal}
                        onChange={(e) => setUsernameVal(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="uni">Registered College</label>
                      <div className="relative">
                        <select 
                          id="uni"
                          value={uni}
                          onChange={(e) => setUni(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-primary cursor-pointer hover:border-primary appearance-none"
                        >
                          <option value="harvard">Harvard University</option>
                          <option value="mit">MIT</option>
                          <option value="berkeley">UC Berkeley</option>
                          <option value="stanford">Stanford University</option>
                          <option value="oxford">University of Oxford</option>
                          <option value="nyu">New York University</option>
                          <option value="umich">University of Michigan</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="dormSelection">Active Hall/Dorm Registry</label>
                      <div className="relative">
                        <select 
                          id="dormSelection"
                          value={dorm}
                          onChange={(e) => setDorm(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg pl-3 pr-10 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none text-primary cursor-pointer hover:border-primary appearance-none"
                        >
                          <option value="hall-a">North Quad - Hall A</option>
                          <option value="hall-b">South Quad - Hall B</option>
                          <option value="hall-c">West Residence Tower</option>
                          <option value="off-campus">Off-Campus Housing</option>
                          <option value="Soldiers Field">Soldiers Field Park</option>
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving parameters...</>
                    ) : (
                      <>Apply Settings</>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* BUYER PAST ORDERS & RATINGS LIST */
              <div className="bg-card p-6 rounded-xl border border-border shadow-xs space-y-6">
                <div className="border-b border-border/60 pb-3">
                  <h3 className="text-lg font-bold text-primary">Your Purchase History</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can submit ratings and peer reviews for each seller below to increase trust across the network.
                  </p>
                </div>

                {successMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="flex flex-col gap-4 text-left">
                  {purchasedItems.map((item) => (
                    <div key={item.id} className="bg-neutral-50 rounded-xl p-4 border border-neutral-200/80 flex flex-col gap-3">
                      <div className="flex items-start gap-4">
                        <img 
                          referrerPolicy="no-referrer"
                          src={item.imageUrl} 
                          alt={item.itemTitle} 
                          className="w-14 h-14 rounded-lg object-cover bg-neutral-100 border shrink-0" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className="font-bold text-[#043f2e] text-sm truncate">{item.itemTitle}</h4>
                            <span className="font-extrabold text-[#043f2e] text-sm">${item.price}</span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Purchased from <strong className="text-primary">@{item.seller}</strong> • {item.date}
                          </p>
                          
                          {item.rating ? (
                            <div className="mt-2.5 inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, idx) => (
                                  <Star 
                                    key={idx} 
                                    className={`w-3.5 h-3.5 ${idx < item.rating ? "fill-amber-400 text-amber-500" : "text-neutral-200"}`} 
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-muted-foreground">" {item.comment} "</span>
                            </div>
                          ) : (
                            <div className="mt-2.5">
                              {ratingItemId !== item.id ? (
                                <button
                                  onClick={() => {
                                    setRatingItemId(item.id);
                                    setRatingVal(5);
                                    setRatingComment("");
                                  }}
                                  className="bg-primary hover:bg-[#002e21] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  ★ Rate Seller & Trade
                                </button>
                              ) : (
                                <div className="bg-white border rounded-xl p-4 mt-3 space-y-4 shadow-3xs animate-in slide-in-from-top-2 duration-150">
                                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#043f2e]">
                                    Submit Peer Review for @{item.seller}
                                  </p>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase block text-left">Star Level:</label>
                                    <div className="flex gap-1.5 items-center">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => setRatingVal(star)}
                                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                                        >
                                          <Star className={`w-6 h-6 ${star <= ratingVal ? "fill-amber-400 text-amber-500" : "text-neutral-200"}`} />
                                        </button>
                                      ))}
                                      <span className="text-xs font-mono font-bold text-muted-foreground ml-2">({ratingVal} out of 5)</span>
                                    </div>
                                  </div>

                                  <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase block" htmlFor="ratingReviewText">Optional Review Comment:</label>
                                    <textarea
                                      id="ratingReviewText"
                                      rows={2}
                                      placeholder="e.g. Alexis met me super fast at the student lounge and the item is like new!"
                                      value={ratingComment}
                                      onChange={(e) => setRatingComment(e.target.value)}
                                      className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-2.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-normal"
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSubmitReview(item.id)}
                                      className="bg-emerald-800 hover:bg-emerald-950 text-white rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide cursor-pointer transition-all"
                                    >
                                      Submit Peer Review
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRatingItemId(null)}
                                      className="text-[11px] text-neutral-500 hover:text-black font-semibold uppercase tracking-wide cursor-pointer px-2"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Sidebar Metrics Panel */}
      <div className="lg:col-span-4 flex flex-col gap-6">

        {/* Unified Seeker Profile Card */}
        <div className="bg-[#032e22] text-[#f9fbf6] p-6 rounded-xl space-y-4 shadow-sm text-left relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#c8f169]">Student Profile Score</p>
            <h4 className="text-2xl font-display font-extrabold flex items-baseline gap-1">
              4.9 <span className="text-xs font-bold text-[#c8f169]">Member Score</span>
            </h4>
          </div>
          
          <div className="bg-white/10 p-3.5 rounded-lg flex justify-between items-center text-xs border border-white/5">
            <div>
              <p className="text-[8.5px] uppercase font-bold text-white/70">WANTED ITEMS CLAIMED</p>
              <p className="font-extrabold text-sm text-[#add450] mt-0.5">8 Claims</p>
            </div>
            <div className="text-right">
              <p className="text-[8.5px] uppercase font-bold text-white/70">STATUS TIER</p>
              <p className="font-extrabold text-sm text-white mt-0.5 font-bold">Highly Active Seeker</p>
            </div>
          </div>

          <p className="text-xs text-white/80 leading-relaxed font-sans">
            Your registered status guarantees a safe campus ecosystem, promoting friendly peer interactions.
          </p>
        </div>

        {/* Custom Sparkle tip panel */}
        <div className="p-6 bg-secondary/15 border border-primary/5 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>Safe Campus Meetups</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed font-sans">
            For safe transactions, we recommend meeting during daylight hours in public on-campus spaces like the student lounge, library, or cafes.
          </p>
        </div>

      </div>

    </div>
  );
}
