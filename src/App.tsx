import React, { useState, useRef, useMemo, useEffect } from "react";
import { Camera, ScanLine, Users, ChevronLeft, Plus, Phone, Mail, Globe, Building2, MapPin, Briefcase, Save, Loader2, User, Search, Tag, QrCode, Edit2, X, Settings, Cloud, Download, LogIn, LogOut, Chrome, Eye, EyeOff, Lock } from "lucide-react";
import { Contact, UserProfile } from "./types";
import { QRCodeSVG } from "qrcode.react";
import Logo from "./Logo";
import { auth, isFirebaseConfigured } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

type ViewState = "contacts" | "scanner" | "editor" | "detail" | "profile" | "profile-editor" | "settings";
type Language = "en" | "vi";

const THEMES = {
  liquidGlass: {
    name: "Liquid Glass",
    background: "#4158D0",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%), radial-gradient(at 0% 100%, hsla(262,45%,54%,1) 0, transparent 50%), radial-gradient(at 50% 100%, hsla(349,69%,76%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(225,39%,30%,1) 0, transparent 50%)"
  },
  midnightPurple: {
    name: "Midnight Purple",
    background: "#1e1b4b",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(267,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(289,49%,30%,1) 0, transparent 50%)"
  },
  emeraldAurora: {
    name: "Emerald Aurora",
    background: "#064e3b",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(160,16%,7%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(140,39%,30%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(170,49%,30%,1) 0, transparent 50%)"
  },
  sunsetGlow: {
    name: "Sunset Glow",
    background: "#7f1d1d",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(10,50%,20%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(30,50%,30%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(350,50%,30%,1) 0, transparent 50%)"
  },
  oceanBlue: {
    name: "Ocean Blue",
    background: "#0f172a",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(210,50%,20%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(190,60%,30%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(230,50%,30%,1) 0, transparent 50%)"
  },
  goldenAmber: {
    name: "Golden Amber",
    background: "#78350f",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(45,80%,30%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(35,80%,40%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(25,80%,30%,1) 0, transparent 50%)"
  },
  slateGray: {
    name: "Slate Gray",
    background: "#1f2937",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(210,10%,15%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(210,10%,25%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(210,10%,20%,1) 0, transparent 50%)"
  },
  silverFrost: {
    name: "Silver Frost",
    background: "#4b5563",
    backgroundImage: "radial-gradient(at 0% 0%, hsla(210,5%,35%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(210,10%,45%,1) 0, transparent 50%), radial-gradient(at 100% 100%, hsla(210,5%,40%,1) 0, transparent 50%)"
  }
};

const TRANSLATIONS = {
  en: {
    myCards: "My Cards",
    scanning: "Scanning...",
    reviewDetails: "Review Details",
    editContact: "Edit Contact",
    contact: "Contact",
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    settings: "Settings",
    searchPlaceholder: "Search by name or company...",
    all: "All",
    noMatches: "No matches found",
    noCards: "No cards yet",
    tryAdjusting: "Try adjusting your filters.",
    tapToScan: "Tap the scan button below to digitize your first business card.",
    fullName: "Full Name",
    jobTitle: "Job Title",
    company: "Company",
    phone: "Phone",
    email: "Email",
    website: "Website",
    address: "Address",
    tags: "Tags (comma separated)",
    saveContact: "Save Contact",
    noName: "No Name",
    areYouSureDelete: "Are you sure you want to delete this contact?",
    cancel: "Cancel",
    delete: "Delete",
    deleteContact: "Delete Contact",
    createDigitalCard: "Create Your Digital Card",
    setUpProfileDesc: "Set up your profile to generate a QR code that others can easily scan to save your details.",
    setUpProfile: "Set Up Profile",
    scanToAdd: "Scan to add to contacts",
    saveProfile: "Save Profile",
    contacts: "Contacts",
    myCard: "My Card",
    language: "Language",
    theme: "Theme",
    english: "English",
    vietnamese: "Tiếng Việt",
    manualAdd: "Manual Add",
    unknown: "Unknown",
    loginTitle: "Unlock Premium Features",
    loginDesc: "Create a free account to securely backup your contacts, sync across devices, and unlock advanced AI features.",
    loginDescLimit: "You've saved your first 5 contacts! Create a free account to ensure they are safely backed up to the cloud and synced across your devices.",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple",
    continueWithEmail: "Continue with Email",
    notNow: "Not Now",
    cloudSync: "Cloud Sync & Backup",
    exportData: "Export Data (CSV/vCard)",
    premiumFeature: "Premium Feature"
  },
  vi: {
    myCards: "Danh thiếp",
    scanning: "Đang quét...",
    reviewDetails: "Kiểm tra thông tin",
    editContact: "Sửa liên hệ",
    contact: "Liên hệ",
    myProfile: "Hồ sơ của tôi",
    editProfile: "Sửa hồ sơ",
    settings: "Cài đặt",
    searchPlaceholder: "Tìm theo tên hoặc công ty...",
    all: "Tất cả",
    noMatches: "Không tìm thấy kết quả",
    noCards: "Chưa có danh thiếp",
    tryAdjusting: "Thử thay đổi bộ lọc.",
    tapToScan: "Nhấn nút quét bên dưới để số hóa danh thiếp đầu tiên của bạn.",
    fullName: "Họ và Tên",
    jobTitle: "Chức danh",
    company: "Công ty",
    phone: "Số điện thoại",
    email: "Email",
    website: "Trang web",
    address: "Địa chỉ",
    tags: "Thẻ (cách nhau bằng dấu phẩy)",
    saveContact: "Lưu Liên Hệ",
    noName: "Không có tên",
    areYouSureDelete: "Bạn có chắc chắn muốn xóa liên hệ này không?",
    cancel: "Hủy",
    delete: "Xóa",
    deleteContact: "Xóa Liên Hệ",
    createDigitalCard: "Tạo Danh Thiếp Số",
    setUpProfileDesc: "Thiết lập hồ sơ của bạn để tạo mã QR mà người khác có thể quét để lưu thông tin.",
    setUpProfile: "Thiết Lập Hồ Sơ",
    scanToAdd: "Quét để thêm vào danh bạ",
    saveProfile: "Lưu Hồ Sơ",
    contacts: "Liên hệ",
    myCard: "Thẻ của tôi",
    language: "Ngôn ngữ",
    theme: "Giao diện",
    english: "English",
    vietnamese: "Tiếng Việt",
    manualAdd: "Thêm thủ công",
    unknown: "Chưa rõ",
    loginTitle: "Mở khóa tính năng Premium",
    loginDesc: "Tạo tài khoản miễn phí để sao lưu an toàn, đồng bộ hóa trên các thiết bị và mở khóa tính năng AI nâng cao.",
    loginDescLimit: "Bạn đã lưu 5 danh thiếp! Tạo tài khoản miễn phí để đảm bảo chúng được sao lưu an toàn và đồng bộ hóa trên các thiết bị của bạn.",
    continueWithGoogle: "Tiếp tục với Google",
    continueWithApple: "Tiếp tục với Apple",
    continueWithEmail: "Tiếp tục với Email",
    notNow: "Để sau",
    cloudSync: "Đồng bộ & Sao lưu đám mây",
    exportData: "Xuất dữ liệu (CSV/vCard)",
    premiumFeature: "Tính năng Premium"
  }
};

export default function App() {
  const [view, setView] = useState<ViewState>("contacts");
  
  // Settings
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("lang") as Language) || "vi";
  });
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>(() => {
    return (localStorage.getItem("theme") as keyof typeof THEMES) || "liquidGlass";
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const theme = THEMES[themeKey];
    document.body.style.backgroundColor = theme.background;
    document.body.style.backgroundImage = theme.backgroundImage;
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundSize = "cover";
  }, [themeKey]);
  
  // State: Contacts
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem("contacts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Auth & Login Prompt
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("isLoggedIn") === "true");
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState<"limit" | "feature">("feature");

  
  // State: Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("userProfile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setIsLoggedIn(true);
          localStorage.setItem("isLoggedIn", "true");
          // If profile is empty, set user profile from firebase user data
          if (!localStorage.getItem("userProfile")) {
            const profile: UserProfile = {
              name: user.displayName || user.email?.split("@")[0] || "User",
              jobTitle: "Developer",
              company: "Firebase Org",
              phone: user.phoneNumber || "",
              email: user.email || "",
              website: "",
              address: ""
            };
            setUserProfile(profile);
            localStorage.setItem("userProfile", JSON.stringify(profile));
          }
        } else {
          setIsLoggedIn(false);
          localStorage.setItem("isLoggedIn", "false");
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (authMode === "register" && !displayName)) {
      setAuthError(lang === "vi" ? "Vui lòng nhập đầy đủ thông tin." : "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setAuthError(lang === "vi" ? "Mật khẩu phải từ 6 ký tự." : "Password must be at least 6 characters.");
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    if (isFirebaseConfigured && auth) {
      try {
        if (authMode === "register") {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName });
          const profile: UserProfile = {
            name: displayName,
            jobTitle: "Developer",
            company: "Firebase Org",
            phone: "",
            email: email,
            website: "",
            address: ""
          };
          setUserProfile(profile);
          localStorage.setItem("userProfile", JSON.stringify(profile));
        } else {
          await signInWithEmailAndPassword(auth, email, password);
        }
        setShowLoginPrompt(false);
        setEmail("");
        setPassword("");
        setDisplayName("");
      } catch (err: any) {
        console.error("Firebase auth error:", err);
        setAuthError(err.message || "Authentication failed");
      } finally {
        setAuthLoading(false);
      }
    } else {
      setTimeout(() => {
        try {
          if (authMode === "register") {
            const users = JSON.parse(localStorage.getItem("mockUsers") || "[]");
            if (users.some((u: any) => u.email === email)) {
              setAuthError(lang === "vi" ? "Email đã được đăng ký." : "Email already registered.");
              setAuthLoading(false);
              return;
            }
            users.push({ email, password, displayName });
            localStorage.setItem("mockUsers", JSON.stringify(users));
            
            const profile: UserProfile = {
              name: displayName,
              jobTitle: "Senior Software Engineer",
              company: "CardScanner Corp",
              phone: "+84 901 234 567",
              email: email,
              website: "https://cardscanner.io",
              address: "Quận 1, TP. Hồ Chí Minh, Việt Nam"
            };
            setUserProfile(profile);
            localStorage.setItem("userProfile", JSON.stringify(profile));
          } else {
            const users = JSON.parse(localStorage.getItem("mockUsers") || "[]");
            const foundUser = users.find((u: any) => u.email === email && u.password === password);
            
            if (email === "phuc.cao@cardscanner.io" && password === "123456") {
              const profile: UserProfile = {
                name: "Phúc Cao",
                jobTitle: "Senior Software Engineer",
                company: "CardScanner Corp",
                phone: "+84 901 234 567",
                email: "phuc.cao@cardscanner.io",
                website: "https://cardscanner.io",
                address: "Quận 1, TP. Hồ Chí Minh, Việt Nam"
              };
              setUserProfile(profile);
              localStorage.setItem("userProfile", JSON.stringify(profile));
            } else if (!foundUser) {
              setAuthError(lang === "vi" ? "Sai email hoặc mật khẩu." : "Incorrect email or password.");
              setAuthLoading(false);
              return;
            } else {
              const profile: UserProfile = {
                name: foundUser.displayName || "User",
                jobTitle: "Developer",
                company: "CardScanner Corp",
                phone: "",
                email: email,
                website: "",
                address: ""
              };
              setUserProfile(profile);
              localStorage.setItem("userProfile", JSON.stringify(profile));
            }
          }
          
          setIsLoggedIn(true);
          localStorage.setItem("isLoggedIn", "true");
          setShowLoginPrompt(false);
          setEmail("");
          setPassword("");
          setDisplayName("");
        } catch (e) {
          console.error(e);
        } finally {
          setAuthLoading(false);
        }
      }, 1200);
    }
  };

  const handleSignOut = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Sign out error:", err);
      }
    } else {
      setIsLoggedIn(false);
      localStorage.setItem("isLoggedIn", "false");
    }
  };

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // For scanning & editing
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>(userProfile || {});
  const [tagInput, setTagInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const saveContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem("contacts", JSON.stringify(newContacts));
  };

  const saveProfile = () => {
    const newProfile = profileForm as UserProfile;
    setUserProfile(newProfile);
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
    setView("profile");
  };

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreviewImage(base64);
      setView("scanner");
      setIsProcessing(true);

      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!res.ok) throw new Error("Failed to extract details");
        
        const { data } = await res.json();
        setEditForm(data);
        setTagInput("");
        setView("editor");
      } catch (err) {
        console.error(err);
        alert("Could not process the card. Please try again.");
        setView("contacts");
      } finally {
        setIsProcessing(false);
        setPreviewImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const saveNewContact = () => {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    const newContact: Contact = {
      id: editForm.id || crypto.randomUUID(),
      name: editForm.name || "",
      jobTitle: editForm.jobTitle || "",
      company: editForm.company || "",
      phone: editForm.phone || "",
      email: editForm.email || "",
      website: editForm.website || "",
      address: editForm.address || "",
      tags: tags,
      createdAt: editForm.createdAt || Date.now(),
    };
    
    // If editing existing
    if (editForm.id) {
      saveContacts(contacts.map(c => c.id === editForm.id ? newContact : c));
      setSelectedContact(newContact);
      setView("detail");
    } else {
      const updatedContacts = [...contacts, newContact];
      saveContacts(updatedContacts);
      setView("contacts");
      if (!isLoggedIn && updatedContacts.length === 5) {
        setLoginPromptReason("limit");
        setShowLoginPrompt(true);
      }
    }
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = (c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             c.company?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = selectedTag ? c.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    }).sort((a,b) => b.createdAt - a.createdAt);
  }, [contacts, searchQuery, selectedTag]);

  const generateVCard = (profile: UserProfile | null) => {
    if (!profile) return "";
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${profile.name || ""}\nORG:${profile.company || ""}\nTITLE:${profile.jobTitle || ""}\nTEL:${profile.phone || ""}\nEMAIL:${profile.email || ""}\nURL:${profile.website || ""}\nADR:;;${profile.address || ""};;;;\nEND:VCARD`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-white max-w-md mx-auto relative pb-24">
      
      {/* HEADER */}
      <header className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-4 flex items-center justify-between sticky top-4 z-20 shadow-sm rounded-3xl mx-4 mt-4 mb-2">
        {["editor", "detail", "profile-editor", "settings"].includes(view) ? (
          <button 
            onClick={() => {
              if (view === "profile-editor") setView("profile");
              else if (view === "editor" && editForm.id) setView("detail");
              else setView("contacts");
            }} 
            className="p-2 -ml-2 rounded-full hover:bg-white/20 text-white transition"
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <button 
            onClick={() => setView("settings")}
            className="p-2 -ml-2 rounded-full hover:bg-white/20 text-white transition"
          >
            <Settings size={24} />
          </button>
        )}
        
        <div className="flex items-center gap-2">
          {view === "contacts" && <Logo size={28} className="rounded-xl shadow-md border border-white/20" />}
          <h1 className="text-lg font-semibold tracking-tight drop-shadow-md">
            {view === "contacts" && t.myCards}
            {view === "scanner" && t.scanning}
            {view === "editor" && (editForm.id ? t.editContact : t.reviewDetails)}
            {view === "detail" && t.contact}
            {view === "profile" && t.myProfile}
            {view === "profile-editor" && t.editProfile}
            {view === "settings" && t.settings}
          </h1>
        </div>
        
        <div className="w-10 flex justify-end">
          {view === "contacts" && (
            <button 
              onClick={() => {
                setEditForm({});
                setTagInput("");
                setView("editor");
              }}
              className="p-2 -mr-2 rounded-full hover:bg-white/20 text-white transition"
            >
              <Plus size={24} />
            </button>
          )}
          {view === "detail" && (
            <button 
              onClick={() => {
                setEditForm(selectedContact!);
                setTagInput(selectedContact!.tags?.join(", ") || "");
                setView("editor");
              }}
              className="p-2 -mr-2 rounded-full hover:bg-white/20 text-white transition"
            >
              <Edit2 size={20} />
            </button>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        
        {/* CONTACTS LIST WITH SEARCH & TAGS */}
        {view === "contacts" && (
          <div className="p-4 space-y-4">
            
            {contacts.length > 0 && (
              <>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                  <input 
                    type="text" 
                    placeholder={t.searchPlaceholder} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-11 pr-4 text-white placeholder:text-white/50 outline-none focus:bg-black/20 focus:border-white/40 transition shadow-inner"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {allTags.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    <button 
                      onClick={() => setSelectedTag(null)}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm border ${!selectedTag ? 'bg-white text-blue-900 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                    >
                      {t.all}
                    </button>
                    {allTags.map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm border ${tag === selectedTag ? 'bg-white text-blue-900 border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                      >
                        <Tag size={12} className={tag === selectedTag ? "text-blue-600" : "text-white/70"} />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/30 shadow-lg">
                  {searchQuery || selectedTag ? <Search size={32} /> : <ScanLine size={32} />}
                </div>
                <h2 className="text-xl font-medium text-white mb-2 shadow-sm drop-shadow-md">
                  {searchQuery || selectedTag ? t.noMatches : t.noCards}
                </h2>
                <p className="text-white/80 drop-shadow-sm">
                  {searchQuery || selectedTag ? t.tryAdjusting : t.tapToScan}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => { setSelectedContact(contact); setView("detail"); }}
                    className="w-full bg-white/10 backdrop-blur-lg p-4 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] border border-white/20 flex items-center gap-4 hover:bg-white/20 active:scale-[0.98] transition-all text-left group"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0 border border-white/30 group-hover:scale-105 transition-transform shadow-sm">
                      {contact.name.charAt(0).toUpperCase() || <User size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate drop-shadow-sm">{contact.name || t.unknown}</h3>
                      <p className="text-sm text-white/70 truncate drop-shadow-sm">
                        {contact.jobTitle}{contact.jobTitle && contact.company ? " at " : ""}{contact.company}
                      </p>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2 overflow-hidden">
                          {contact.tags.map(tag => (
                            <span key={tag} className="text-[10px] font-medium px-2 py-0.5 bg-white/15 rounded-full border border-white/10 truncate max-w-[80px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SCANNER OVERLAY (Processing State) */}
        {view === "scanner" && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {previewImage && (
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg mb-8 border-4 border-white/30">
                <img src={previewImage} alt="Card Preview" className="w-full h-full object-cover filter brightness-75" />
                
                {/* Scanner Frame Guide */}
                <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                  
                  {/* Scanning line animation */}
                  <div className="absolute left-0 right-0 top-0 h-1 bg-blue-400/80 shadow-[0_0_10px_rgba(96,165,250,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                   <Loader2 size={40} className="text-white animate-spin mb-4 drop-shadow-md" />
                   <p className="text-white font-medium drop-shadow-md">{t.scanning}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EDITOR (Contact) */}
        {view === "editor" && (
          <div className="p-4 space-y-6">
            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/20 space-y-4">
              <FormField 
                icon={<User size={18} />} 
                label={t.fullName} 
                value={editForm.name} 
                onChange={(val) => setEditForm({...editForm, name: val})} 
              />
              <FormField 
                icon={<Briefcase size={18} />} 
                label={t.jobTitle} 
                value={editForm.jobTitle} 
                onChange={(val) => setEditForm({...editForm, jobTitle: val})} 
              />
              <FormField 
                icon={<Building2 size={18} />} 
                label={t.company} 
                value={editForm.company} 
                onChange={(val) => setEditForm({...editForm, company: val})} 
              />
              <FormField 
                icon={<Phone size={18} />} 
                label={t.phone} 
                value={editForm.phone} 
                onChange={(val) => setEditForm({...editForm, phone: val})} 
              />
              <FormField 
                icon={<Mail size={18} />} 
                label={t.email} 
                value={editForm.email} 
                onChange={(val) => setEditForm({...editForm, email: val})} 
                type="email"
              />
              <FormField 
                icon={<Globe size={18} />} 
                label={t.website} 
                value={editForm.website} 
                onChange={(val) => setEditForm({...editForm, website: val})} 
                type="url"
              />
              <FormField 
                icon={<MapPin size={18} />} 
                label={t.address} 
                value={editForm.address} 
                onChange={(val) => setEditForm({...editForm, address: val})} 
              />
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-white/90 mb-1.5 ml-1 drop-shadow-sm">
                  <span className="text-white/80"><Tag size={18} /></span>
                  {t.tags}
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full bg-black/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-white/50 focus:bg-black/20 focus:ring-1 focus:ring-white/30 transition placeholder:text-white/50 shadow-inner"
                />
              </div>
            </div>
            
            <button 
              onClick={saveNewContact}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-lg active:scale-95 text-white font-medium py-4 rounded-2xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 transition-all"
            >
              <Save size={20} />
              {t.saveContact}
            </button>
          </div>
        )}

        {/* CONTACT DETAIL */}
        {view === "detail" && selectedContact && (
          <div className="p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/20 flex flex-col items-center text-center mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4 border border-white/30 shadow-lg relative z-10">
                {selectedContact.name.charAt(0).toUpperCase() || <User size={32} />}
              </div>
              <h2 className="text-2xl font-bold text-white relative z-10 drop-shadow-md">{selectedContact.name || t.noName}</h2>
              <p className="text-white/80 mt-1 relative z-10 drop-shadow-sm">{selectedContact.jobTitle}</p>
              <p className="font-medium text-white/90 relative z-10 drop-shadow-sm">{selectedContact.company}</p>
              
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-4 relative z-10">
                  {selectedContact.tags.map(tag => (
                    <span key={tag} className="text-xs font-medium px-3 py-1 bg-white/15 rounded-full border border-white/20 shadow-sm flex items-center gap-1">
                      <Tag size={10} className="text-white/70" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <DetailRow icon={<Phone />} value={selectedContact.phone} type="tel" />
              <DetailRow icon={<Mail />} value={selectedContact.email} type="mailto" />
              <DetailRow icon={<Globe />} value={selectedContact.website} type="url" />
              <DetailRow icon={<MapPin />} value={selectedContact.address} />
            </div>

            {isDeleting ? (
              <div className="mt-8 p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl">
                <p className="text-center text-red-200 font-medium mb-4">{t.areYouSureDelete}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={() => {
                      saveContacts(contacts.filter(c => c.id !== selectedContact.id));
                      setIsDeleting(false);
                      setView("contacts");
                    }}
                    className="flex-1 bg-red-500 text-white font-medium py-3 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsDeleting(true)}
                className="w-full text-red-200 font-medium py-4 mt-8 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-2xl hover:bg-red-500/30 active:scale-[0.98] shadow-sm transition-all"
              >
                {t.deleteContact}
              </button>
            )}
          </div>
        )}

        {/* MY PROFILE */}
        {view === "profile" && (
          <div className="p-4">
            {!userProfile ? (
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/20 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white mb-6 border border-white/30">
                  <User size={32} />
                </div>
                <h2 className="text-xl font-semibold mb-2 drop-shadow-md">{t.createDigitalCard}</h2>
                <p className="text-white/80 mb-8 text-sm">{t.setUpProfileDesc}</p>
                <button
                  onClick={() => {
                    setProfileForm({});
                    setView("profile-editor");
                  }}
                  className="w-full bg-white text-blue-900 font-semibold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                >
                  {t.setUpProfile}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => {
                        setProfileForm(userProfile);
                        setView("profile-editor");
                      }}
                      className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 mt-4">
                    <QRCodeSVG 
                      value={generateVCard(userProfile)} 
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900">{userProfile.name}</h2>
                  <p className="text-gray-500 mt-1">{userProfile.jobTitle}</p>
                  <p className="font-medium text-gray-700">{userProfile.company}</p>
                  
                  <p className="text-sm text-gray-400 mt-6 font-medium tracking-wide uppercase">{t.scanToAdd}</p>
                </div>

                <div className="space-y-3">
                  <DetailRow icon={<Phone />} value={userProfile.phone} type="tel" />
                  <DetailRow icon={<Mail />} value={userProfile.email} type="mailto" />
                  <DetailRow icon={<Globe />} value={userProfile.website} type="url" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE EDITOR */}
        {view === "profile-editor" && (
           <div className="p-4 space-y-6">
           <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/20 space-y-4">
             <FormField 
               icon={<User size={18} />} 
               label={t.fullName} 
               value={profileForm.name} 
               onChange={(val) => setProfileForm({...profileForm, name: val})} 
             />
             <FormField 
               icon={<Briefcase size={18} />} 
               label={t.jobTitle} 
               value={profileForm.jobTitle} 
               onChange={(val) => setProfileForm({...profileForm, jobTitle: val})} 
             />
             <FormField 
               icon={<Building2 size={18} />} 
               label={t.company} 
               value={profileForm.company} 
               onChange={(val) => setProfileForm({...profileForm, company: val})} 
             />
             <FormField 
               icon={<Phone size={18} />} 
               label={t.phone} 
               value={profileForm.phone} 
               onChange={(val) => setProfileForm({...profileForm, phone: val})} 
             />
             <FormField 
               icon={<Mail size={18} />} 
               label={t.email} 
               value={profileForm.email} 
               onChange={(val) => setProfileForm({...profileForm, email: val})} 
               type="email"
             />
             <FormField 
               icon={<Globe size={18} />} 
               label={t.website} 
               value={profileForm.website} 
               onChange={(val) => setProfileForm({...profileForm, website: val})} 
               type="url"
             />
             <FormField 
               icon={<MapPin size={18} />} 
               label={t.address} 
               value={profileForm.address} 
               onChange={(val) => setProfileForm({...profileForm, address: val})} 
             />
           </div>
           
           <button 
             onClick={saveProfile}
             className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-lg active:scale-95 text-white font-medium py-4 rounded-2xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 transition-all"
           >
             <Save size={20} />
             {t.saveProfile}
           </button>
         </div>
        )}

        {/* SETTINGS */}
        {view === "settings" && (
          <div className="p-4 space-y-6">
            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-white/20 space-y-6">
              
              <div>
                <h3 className="font-semibold mb-3 text-white/90 drop-shadow-sm">{t.language}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => { setLang("en"); localStorage.setItem("lang", "en"); }}
                    className={`py-3 px-4 rounded-xl border font-medium transition-all ${lang === "en" ? "bg-white text-blue-900 border-white shadow-md" : "bg-white/10 text-white border-white/20 hover:bg-white/20"}`}
                  >
                    {t.english}
                  </button>
                  <button 
                    onClick={() => { setLang("vi"); localStorage.setItem("lang", "vi"); }}
                    className={`py-3 px-4 rounded-xl border font-medium transition-all ${lang === "vi" ? "bg-white text-blue-900 border-white shadow-md" : "bg-white/10 text-white border-white/20 hover:bg-white/20"}`}
                  >
                    {t.vietnamese}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-white/90 drop-shadow-sm">{t.theme}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(THEMES).map(([key, theme]) => (
                    <button 
                      key={key}
                      onClick={() => { setThemeKey(key as keyof typeof THEMES); localStorage.setItem("theme", key); }}
                      className={`relative overflow-hidden py-4 px-4 rounded-xl border text-sm font-medium transition-all ${themeKey === key ? "border-white shadow-md scale-[1.02]" : "border-white/20 hover:border-white/50 opacity-80"}`}
                    >
                      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundColor: theme.background, backgroundImage: theme.backgroundImage, backgroundSize: "cover" }}></div>
                      <span className="relative z-10 text-white drop-shadow-md">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <button 
                  onClick={() => {
                    if (!isLoggedIn) {
                      setLoginPromptReason("feature");
                      setShowLoginPrompt(true);
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-200">
                      <Cloud size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{t.cloudSync}</h4>
                      <p className="text-xs text-white/60 mt-0.5">{t.premiumFeature}</p>
                    </div>
                  </div>
                  {isLoggedIn && <span className="text-xs font-medium bg-green-500/20 text-green-200 px-2 py-1 rounded-full">Active</span>}
                </button>

                <button 
                  onClick={() => {
                    if (!isLoggedIn) {
                      setLoginPromptReason("feature");
                      setShowLoginPrompt(true);
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left mt-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/20 p-2 rounded-lg text-purple-200">
                      <Download size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{t.exportData}</h4>
                      <p className="text-xs text-white/60 mt-0.5">{t.premiumFeature}</p>
                    </div>
                  </div>
                </button>
                
                {isLoggedIn && (
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-xl border border-red-500/20 transition-colors mt-6"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

      </main>

      {/* HIDDEN FILE INPUT FOR NATIVE CAMERA */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleCapture}
      />

      {/* BOTTOM NAV */}
      {["contacts", "profile"].includes(view) && (
        <div className="fixed bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-6 py-3 flex justify-between items-center max-w-sm mx-auto shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] z-50">
          <button 
            onClick={() => setView("contacts")}
            className={`flex flex-col items-center p-2 transition-all duration-300 ${view === "contacts" ? "text-white scale-110 drop-shadow-md" : "text-white/50 hover:text-white/80"}`}
          >
            <Users size={24} className="mb-1" />
            <span className="text-[10px] font-medium tracking-wide">{t.contacts}</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center bg-white/20 backdrop-blur-2xl border border-white/40 text-white w-16 h-16 rounded-full shadow-[0_8px_32px_0_rgba(255,255,255,0.2)] hover:bg-white/30 hover:scale-105 active:scale-95 transition-all -mt-10"
          >
            <ScanLine size={28} />
          </button>
          
          <button 
            onClick={() => setView("profile")}
            className={`flex flex-col items-center p-2 transition-all duration-300 ${view === "profile" ? "text-white scale-110 drop-shadow-md" : "text-white/50 hover:text-white/80"}`}
          >
            <QrCode size={24} className="mb-1" />
            <span className="text-[10px] font-medium tracking-wide">{t.myCard}</span>
          </button>
        </div>
      )}

      {/* LOGIN PROMPT MODAL */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!authLoading) setShowLoginPrompt(false); }} />
          <div className="relative w-full max-w-sm bg-[#1a1a2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 pb-6 pt-8 px-6">
            
            <button 
              onClick={() => { if (!authLoading) setShowLoginPrompt(false); }}
              className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors"
              disabled={authLoading}
            >
              <X size={20} />
            </button>

            <div className="flex justify-center mb-4">
              <Logo size={64} className="transform rotate-3 shadow-lg rounded-2xl" />
            </div>
            
            <h2 className="text-xl font-bold text-white text-center mb-1">
              {authMode === "login" 
                ? (lang === "vi" ? "Đăng nhập tài khoản" : "Sign In") 
                : (lang === "vi" ? "Tạo tài khoản mới" : "Create Account")}
            </h2>
            
            <p className="text-center text-white/60 text-xs mb-4">
              {loginPromptReason === "limit" ? t.loginDescLimit : t.loginDesc}
            </p>

            {!isFirebaseConfigured && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-center text-[11px] font-medium leading-normal">
                ⚠️ {lang === "vi" ? "Chế độ mô phỏng (Chưa cấu hình Firebase)" : "Simulated Mode (Firebase not configured)"}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1 ml-1">
                    {lang === "vi" ? "Họ và tên" : "Full Name"}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition placeholder:text-white/30"
                      placeholder={lang === "vi" ? "Nhập họ tên của bạn" : "Enter your full name"}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1 ml-1">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition placeholder:text-white/30"
                    placeholder={lang === "vi" ? "nhanvien@congty.com" : "email@company.com"}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70 mb-1 ml-1">
                  {lang === "vi" ? "Mật khẩu" : "Password"}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 focus:bg-white/10 transition placeholder:text-white/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="text-red-400 text-xs font-medium text-center bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl leading-relaxed break-words">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {lang === "vi" ? "Đang xử lý..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <LogIn size={16} />
                    {authMode === "login" 
                      ? (lang === "vi" ? "Đăng nhập" : "Sign In") 
                      : (lang === "vi" ? "Đăng ký tài khoản" : "Create Account")}
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError(null);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                disabled={authLoading}
              >
                {authMode === "login"
                  ? (lang === "vi" ? "Chưa có tài khoản? Đăng ký ngay" : "Don't have an account? Sign Up")
                  : (lang === "vi" ? "Đã có tài khoản? Đăng nhập" : "Already have an account? Sign In")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function FormField({ icon, label, value, onChange, type = "text" }: { 
  icon: React.ReactNode, 
  label: string, 
  value?: string, 
  onChange: (val: string) => void,
  type?: string
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-white/90 mb-1.5 ml-1 drop-shadow-sm">
        <span className="text-white/80">{icon}</span>
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 text-white outline-none focus:border-white/50 focus:bg-black/20 focus:ring-1 focus:ring-white/30 transition placeholder:text-white/50 shadow-inner"
        placeholder={`Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

function DetailRow({ icon, value, type }: { icon: React.ReactNode, value?: string, type?: "tel" | "mailto" | "url" }) {
  if (!value) return null;
  
  const content = (
    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-lg p-4 rounded-2xl shadow-[0_4px_16px_0_rgba(0,0,0,0.1)] border border-white/20 hover:bg-white/15 transition-colors">
      <div className="text-white bg-white/20 border border-white/30 p-2 rounded-xl shadow-sm">
        {icon}
      </div>
      <span className="font-medium text-white flex-1 break-all drop-shadow-sm">{value}</span>
    </div>
  );

  if (type === "tel") return <a href={`tel:${value}`} className="block">{content}</a>;
  if (type === "mailto") return <a href={`mailto:${value}`} className="block">{content}</a>;
  if (type === "url") {
    const href = value.startsWith('http') ? value : `https://${value}`;
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block">{content}</a>;
  }
  
  return content;
}

