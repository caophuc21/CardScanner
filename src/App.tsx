import React, { useState, useRef, useMemo, useEffect } from "react";
import { Camera, ScanLine, Users, ChevronLeft, Plus, Phone, Mail, Globe, Building2, MapPin, Briefcase, Save, Loader2, User, Search, Tag, QrCode, Edit2, X, Settings, Cloud, Download, LogIn, LogOut, Chrome, Eye, EyeOff, Lock, Upload, AlertTriangle, Star, MessageSquare, Share2, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Contact, UserProfile } from "./types";
import { QRCodeSVG } from "qrcode.react";
import { auth, isFirebaseConfigured, db } from "./firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch 
} from "firebase/firestore";

type ViewState = "contacts" | "scanner" | "editor" | "detail" | "profile" | "profile-editor" | "settings";
type Language = "en" | "vi";

const THEMES = {
  champagneGold: {
    name: "Champagne Gold",
    background: "#F5F2EC",
    backgroundImage: "linear-gradient(135deg, #F6F3ED 0%, #EDE7DC 50%, #F5F2EC 100%)"
  },
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
    exportData: "Export Data (CSV/Google Drive)",
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
    exportData: "Xuất dữ liệu (CSV/Google Drive)",
    premiumFeature: "Tính năng Premium"
  }
};

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (e.g. http on mobile devices)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const parseTextWithRegex = (text: string): Partial<Contact> => {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  
  let name = "";
  let jobTitle = "";
  let company = "";
  let phone = "";
  let email = "";
  let website = "";
  let address = "";

  // Regular expressions for matching
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b(?:\+?\d{1,3})?\d{9,11}\b/;
  const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/;

  // Try to find matches in lines
  for (const line of lines) {
    if (!email && emailRegex.test(line)) {
      email = line.match(emailRegex)?.[0] || "";
      continue;
    }
    if (!phone && phoneRegex.test(line)) {
      phone = line.match(phoneRegex)?.[0] || "";
      continue;
    }
    if (!website && websiteRegex.test(line)) {
      // Avoid matching email domain as website
      const match = line.match(websiteRegex)?.[0] || "";
      if (match && !match.includes("@")) {
        website = match;
        continue;
      }
    }
  }

  // Simple heuristic for name, title, company from remaining lines
  const unusedLines = lines.filter(line => 
    !line.match(emailRegex) && 
    !line.match(phoneRegex) && 
    !line.match(websiteRegex)
  );

  if (unusedLines.length > 0) {
    name = unusedLines[0]; // Usually first line has the name
  }
  if (unusedLines.length > 1) {
    jobTitle = unusedLines[1]; // Usually second line has job title
  }
  if (unusedLines.length > 2) {
    company = unusedLines[2]; // Usually third line has company
  }
  
  // Find address: usually contains keywords like "Street", "Đường", "Phố", "Quận", "Huyện", "TP", "City", "No"
  const addressLine = lines.find(line => 
    /đường|phố|quận|phường|thành phố|tỉnh|huyện|street|road|avenue|floor|block|building|city|district|ward|no\./i.test(line)
  );
  if (addressLine) {
    address = addressLine;
  }

  return { name, jobTitle, company, phone, email, website, address };
};

export default function App() {
  const [view, setView] = useState<ViewState>("contacts");
  
  // Settings
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("lang") as Language) || "vi";
  });
  const [themeKey, setThemeKey] = useState<keyof typeof THEMES>(() => {
    return (localStorage.getItem("theme") as keyof typeof THEMES) || "champagneGold";
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    document.body.style.backgroundColor = "#FFFFFF";
    document.body.style.backgroundImage = "none";
  }, [themeKey]);

  const INITIAL_CONTACTS: Contact[] = [
    {
      id: "c1",
      name: "Nguyễn Thị Mai Anh",
      jobTitle: "Business Development Manager",
      company: "ABC Company",
      phone: "+84 912 345 678",
      email: "mai.anh@company.com",
      website: "www.company.com",
      address: "Tầng 12, Tòa nhà ABC, Quận 1, TP. HCM",
      tags: ["Đối tác", "VIP"],
      notes: "Gặp tại sự kiện Tech Summit 2026",
      isFavorite: true,
      createdAt: Date.now() - 1000 * 60 * 30
    },
    {
      id: "c2",
      name: "Trần Minh Đức",
      jobTitle: "CEO",
      company: "Global Group",
      phone: "+84 903 123 456",
      email: "duc.tran@globalgroup.com",
      website: "www.globalgroup.com",
      address: "Quận 3, TP. HCM",
      tags: ["Khách hàng"],
      isFavorite: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 2
    },
    {
      id: "c3",
      name: "Lê Hoàng Yến",
      jobTitle: "Marketing Director",
      company: "Sunrise Media",
      phone: "+84 988 234 567",
      email: "yen.le@sunrisemedia.vn",
      website: "www.sunrisemedia.vn",
      address: "Quận 1, TP. HCM",
      tags: ["Media", "Đối tác"],
      isFavorite: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 5
    },
    {
      id: "c4",
      name: "Phạm Quốc Hùng",
      jobTitle: "Sales Manager",
      company: "Viettel Solutions",
      phone: "+84 918 345 678",
      email: "hung.pham@viettel.vn",
      website: "www.viettelsolutions.vn",
      address: "Cầu Giấy, Hà Nội",
      tags: ["Viễn thông"],
      isFavorite: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 24
    },
    {
      id: "c5",
      name: "Đỗ Thị Thanh",
      jobTitle: "HR Manager",
      company: "NextGen",
      phone: "+84 977 456 789",
      email: "thanh.do@nextgen.io",
      website: "www.nextgen.io",
      address: "Nam Từ Liêm, Hà Nội",
      tags: ["Tuyển dụng"],
      isFavorite: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 30
    },
    {
      id: "c6",
      name: "Nguyễn Văn Long",
      jobTitle: "Founder & CEO",
      company: "GreenTech",
      phone: "+84 966 567 890",
      email: "long.nguyen@greentech.vn",
      website: "www.greentech.vn",
      address: "Bình Thạnh, TP. HCM",
      tags: ["Startup"],
      isFavorite: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 48
    }
  ];

  // State: Contacts
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem("contacts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_CONTACTS;
    } catch {
      return INITIAL_CONTACTS;
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

  const [syncing, setSyncing] = useState(false);

  const syncContacts = async (forceAlert = false, contactsOverride?: Contact[]) => {
    if (!isFirebaseConfigured || !db || !auth.currentUser) {
      if (forceAlert) {
        alert(lang === "vi" ? "Firebase chưa được cấu hình hoặc bạn chưa đăng nhập." : "Firebase is not configured or you are not signed in.");
      }
      return;
    }
    
    setSyncing(true);
    try {
      const uid = auth.currentUser.uid;
      const contactsColRef = collection(db, "users", uid, "contacts");
      
      // 1. Fetch remote contacts from Firestore
      const querySnapshot = await getDocs(contactsColRef);
      const remoteContacts: Contact[] = [];
      querySnapshot.forEach((doc) => {
        remoteContacts.push({ id: doc.id, ...doc.data() } as Contact);
      });
      
      // 2. Merge local and remote contacts synchronously
      const mergedMap = new Map<string, Contact>();
      
      // Add all current contacts in state (or override)
      const localContacts = contactsOverride || contacts;
      localContacts.forEach(c => mergedMap.set(c.id, c));
      
      // Merge remote contacts
      remoteContacts.forEach(rc => {
        const existing = mergedMap.get(rc.id);
        if (!existing || rc.createdAt > existing.createdAt) {
          mergedMap.set(rc.id, rc);
        }
      });
      
      const finalMergedContacts = Array.from(mergedMap.values());
      
      // Update state and local storage
      setContacts(finalMergedContacts);
      localStorage.setItem("contacts", JSON.stringify(finalMergedContacts));
      
      // 3. Batch write local changes to Firestore to sync any new local contacts
      if (finalMergedContacts.length > 0) {
        const batch = writeBatch(db);
        finalMergedContacts.forEach(c => {
          const docRef = doc(db, "users", uid, "contacts", c.id);
          batch.set(docRef, c);
        });
        await batch.commit();
      }
      
      if (forceAlert) {
        alert(lang === "vi" ? "Đồng bộ đám mây thành công!" : "Cloud sync completed successfully!");
      }
    } catch (err) {
      console.error("Sync error:", err);
      if (forceAlert) {
        alert(lang === "vi" ? `Lỗi đồng bộ: ${err}` : `Sync error: ${err}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const generateCSVContent = (contactsList: Contact[]) => {
    const headers = ["Name", "Job Title", "Company", "Phone", "Email", "Website", "Address", "Tags", "Created At"];
    const rows = contactsList.map(c => [
      c.name || "",
      c.jobTitle || "",
      c.company || "",
      c.phone || "",
      c.email || "",
      c.website || "",
      c.address || "",
      c.tags ? c.tags.join("; ") : "",
      new Date(c.createdAt).toLocaleString()
    ]);
    const escapeCSV = (val: string) => {
      const escaped = String(val).replace(/"/g, '""');
      return `"${escaped}"`;
    };
    return [
      headers.join(","),
      ...rows.map(row => row.map(val => escapeCSV(val)).join(","))
    ].join("\n");
  };

  const exportToCSV = () => {
    if (contacts.length === 0) {
      alert(lang === "vi" ? "Không có danh bạ để xuất." : "No contacts to export.");
      return;
    }
    
    const csvContent = generateCSVContent(contacts);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `contacts_export_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const getGoogleDriveToken = async (): Promise<string> => {
    const cachedToken = sessionStorage.getItem("google_drive_token");
    const expiry = sessionStorage.getItem("google_drive_token_expiry");
    if (cachedToken && expiry && Date.now() < Number(expiry)) {
      return cachedToken;
    }

    if (!isFirebaseConfigured || !auth) {
      throw new Error(lang === "vi" ? "Firebase chưa được cấu hình." : "Firebase is not configured.");
    }

    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/drive.file");

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    if (!token) {
      throw new Error(lang === "vi" ? "Không lấy được access token từ Google." : "Could not retrieve Google access token.");
    }

    sessionStorage.setItem("google_drive_token", token);
    sessionStorage.setItem("google_drive_token_expiry", String(Date.now() + 55 * 60 * 1000));

    return token;
  };

  const handleExportToGoogleDrive = async () => {
    if (contacts.length === 0) {
      alert(lang === "vi" ? "Không có danh bạ để xuất." : "No contacts to export.");
      return;
    }

    setIsExportingToDrive(true);
    setGdriveFileUrl(null);

    try {
      const token = await getGoogleDriveToken();
      const csvContent = generateCSVContent(contacts);

      const metadata = {
        name: `CardScanner_Contacts_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}`,
        mimeType: "application/vnd.google-apps.spreadsheet",
      };

      const boundary = "foo_bar_boundary";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const requestBody =
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: text/csv; charset=UTF-8\r\n\r\n" +
        csvContent +
        closeDelimiter;

      const response = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: requestBody,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Google API returned status ${response.status}`);
      }

      const fileData = await response.json();
      const fileUrl = `https://docs.google.com/spreadsheets/d/${fileData.id}/edit`;
      setGdriveFileUrl(fileUrl);
      
      alert(lang === "vi" 
        ? "Xuất sang Google Drive thành công! Bạn có thể mở tệp Google Sheets ngay lập tức." 
        : "Exported to Google Drive successfully! You can open the Google Sheets file now."
      );
    } catch (err: any) {
      console.error("Google Drive export error:", err);
      alert((lang === "vi" ? "Lỗi xuất sang Google Drive: " : "Failed to export to Google Drive: ") + (err.message || err));
    } finally {
      setIsExportingToDrive(false);
    }
  };

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
          syncContacts(false);
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

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setAuthLoading(true);
    if (isFirebaseConfigured && auth) {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          sessionStorage.setItem("google_drive_token", credential.accessToken);
          sessionStorage.setItem("google_drive_token_expiry", String(Date.now() + 55 * 60 * 1000));
        }
        
        // Update user profile local storage
        const profile: UserProfile = {
          name: user.displayName || user.email?.split("@")[0] || "User",
          jobTitle: "Developer",
          company: "Google Org",
          phone: user.phoneNumber || "",
          email: user.email || "",
          website: "",
          address: ""
        };
        setUserProfile(profile);
        localStorage.setItem("userProfile", JSON.stringify(profile));
        
        setShowLoginPrompt(false);
      } catch (err: any) {
        console.error("Google sign in error:", err);
        setAuthError(err.message || "Google Sign-In failed");
      } finally {
        setAuthLoading(false);
      }
    } else {
      // Mock Google sign in
      setTimeout(() => {
        const profile: UserProfile = {
          name: "Mock Google User",
          jobTitle: "Developer",
          company: "Google Org",
          phone: "+84 999 999 999",
          email: "mock.google@gmail.com",
          website: "",
          address: ""
        };
        setUserProfile(profile);
        localStorage.setItem("userProfile", JSON.stringify(profile));
        setIsLoggedIn(true);
        localStorage.setItem("isLoggedIn", "true");
        setShowLoginPrompt(false);
        setAuthLoading(false);
      }, 1000);
    }
  };

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  
  // For scanning & editing
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanMenu, setShowScanMenu] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>(userProfile || {});
  const [tagInput, setTagInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Export & Modal states
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);
  const [gdriveFileUrl, setGdriveFileUrl] = useState<string | null>(null);

  // Prevent background scrolling when scan menu, export menu, exit modal, filter modal, account modal, or login modal is open
  useEffect(() => {
    if (showScanMenu || showExportMenu || showLoginPrompt || showExitConfirmModal || showFilterModal || showAccountModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showScanMenu, showExportMenu, showLoginPrompt, showExitConfirmModal, showFilterModal, showAccountModal]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "recent" | "favorites">("all");

  const getInitials = (name: string) => {
    if (!name) return "NA";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    const first = parts[0][0];
    const last = parts[parts.length - 1][0];
    return (first + last).toUpperCase();
  };

  const toggleFavorite = (id: string) => {
    const updated = contacts.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c);
    saveContacts(updated);
    if (selectedContact && selectedContact.id === id) {
      setSelectedContact({ ...selectedContact, isFavorite: !selectedContact.isFavorite });
    }
  };

  const saveContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem("contacts", JSON.stringify(newContacts));
    if (isFirebaseConfigured && auth && auth.currentUser) {
      syncContacts(false, newContacts);
    }
  };

  const saveProfile = () => {
    const newProfile = profileForm as UserProfile;
    setUserProfile(newProfile);
    localStorage.setItem("userProfile", JSON.stringify(newProfile));
    setView("profile");
  };

  const compressImage = (base64: string, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => {
        resolve(base64); // Fallback to original on error
      };
    });
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
        const compressedBase64 = await compressImage(base64);
        setPreviewImage(compressedBase64); // Show compressed image for preview and state

        let data: Partial<Contact> | null = null;
        let usedOfflineOCR = false;

        // Try online Gemini API first if connected
        if (navigator.onLine) {
          try {
            const res = await fetch("/api/extract", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: compressedBase64 }),
            });

            if (res.ok) {
              const resData = await res.json();
              data = resData.data;
            } else {
              console.warn("Online extraction API failed, falling back to local OCR...");
            }
          } catch (onlineErr) {
            console.warn("Online extraction network error, falling back to local OCR:", onlineErr);
          }
        } else {
          console.log("Device is offline, using local OCR...");
        }

        // Fallback to Tesseract.js local OCR if online method did not yield data
        if (!data) {
          usedOfflineOCR = true;
          const Tesseract = (await import("tesseract.js")).default;
          const result = await Tesseract.recognize(compressedBase64, "eng+vie");
          data = parseTextWithRegex(result.data.text);
        }

        setEditForm(data);
        setTagInput("");
        setView("editor");
        
        if (usedOfflineOCR) {
          alert(lang === "vi" 
            ? "Bạn đang ngoại tuyến hoặc máy chủ quá tải. Đã sử dụng bộ nhận diện trên máy (Offline OCR) để trích xuất thông tin cơ bản." 
            : "You are offline or the server is busy. Used on-device OCR to extract basic details.");
        }
      } catch (err: any) {
        console.error(err);
        alert(`Could not process the card. Error: ${err.message || err}\nPlease try again.`);
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
      id: editForm.id || generateUUID(),
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

  const currentTagQuery = useMemo(() => {
    if (!tagInput) return "";
    const parts = tagInput.split(",");
    return parts[parts.length - 1].trim();
  }, [tagInput]);

  const existingTagList = useMemo(() => {
    return tagInput.split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
  }, [tagInput]);

  const suggestedTags = useMemo(() => {
    if (!currentTagQuery.trim()) {
      return [];
    }
    return allTags.filter(t => 
      t.toLowerCase().includes(currentTagQuery.toLowerCase()) && 
      !existingTagList.includes(t.toLowerCase())
    ).slice(0, 5);
  }, [allTags, currentTagQuery, existingTagList]);

  const selectSuggestedTag = (tag: string) => {
    const parts = tagInput.split(",");
    parts[parts.length - 1] = " " + tag;
    const newTagInput = parts.filter(p => p.trim().length > 0).join(", ") + ", ";
    setTagInput(newTagInput);
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch = (
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      const matchesTag = selectedTag ? c.tags?.includes(selectedTag) : true;
      const matchesFilterTab = 
        filterTab === "all" ? true :
        filterTab === "favorites" ? !!c.isFavorite :
        filterTab === "recent" ? true : true;

      return matchesSearch && matchesTag && matchesFilterTab;
    }).sort((a,b) => b.createdAt - a.createdAt);
  }, [contacts, searchQuery, selectedTag, filterTab]);

  const generateVCard = (profile: UserProfile | null) => {
    if (!profile) return "";
    return `BEGIN:VCARD\nVERSION:3.0\nFN:${profile.name || ""}\nORG:${profile.company || ""}\nTITLE:${profile.jobTitle || ""}\nTEL:${profile.phone || ""}\nEMAIL:${profile.email || ""}\nURL:${profile.website || ""}\nADR:;;${profile.address || ""};;;;\nEND:VCARD`;
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-900 bg-white max-w-md mx-auto relative pb-24">
      
      {/* HEADER */}
      <header className="bg-white border border-stone-200 px-4 py-3.5 flex items-center justify-between sticky top-4 z-20 shadow-sm rounded-3xl mx-4 mt-4 mb-2">
        {["editor", "detail", "profile-editor", "settings"].includes(view) ? (
          <button 
            onClick={() => {
              if (view === "profile-editor") setView("profile");
              else if (view === "editor") setShowExitConfirmModal(true);
              else setView("contacts");
            }} 
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-stone-900 transition"
          >
            <ChevronLeft size={24} />
          </button>
        ) : (
          <button 
            onClick={() => setView("settings")}
            className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-stone-900 transition"
          >
            <Settings size={24} />
          </button>
        )}
        
        <h1 className="text-lg font-bold text-stone-900 tracking-tight">
          {view === "contacts" && (lang === "vi" ? "Danh bạ" : t.myCards)}
          {view === "scanner" && t.scanning}
          {view === "editor" && (editForm.id ? t.editContact : t.reviewDetails)}
          {view === "detail" && t.contact}
          {view === "profile" && t.myProfile}
          {view === "profile-editor" && t.editProfile}
          {view === "settings" && t.settings}
        </h1>
        
        <div className="w-10 flex justify-end">
          {view === "contacts" && (
            <button 
              onClick={() => {
                setEditForm({});
                setTagInput("");
                setView("editor");
              }}
              className="p-2 -mr-2 rounded-full hover:bg-stone-100 text-stone-900 transition"
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
              className="p-2 -mr-2 rounded-full hover:bg-stone-100 text-stone-900 transition"
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
            
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-stone-900 drop-shadow-sm">
                {lang === "vi" ? "Danh bạ" : "Contacts"}
              </h2>
              <button 
                onClick={() => {
                  setEditForm({});
                  setTagInput("");
                  setView("editor");
                }}
                className="p-2.5 rounded-full bg-[#C5A880] text-stone-900 hover:bg-[#B89768] transition shadow-sm"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* SEARCH BAR */}
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input 
                  type="text" 
                  placeholder={lang === "vi" ? "Tìm kiếm tên, công ty, chức vụ..." : "Search name, company..."} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 pl-11 pr-10 text-stone-900 placeholder:text-stone-400 outline-none focus:bg-white focus:border-stone-900 transition shadow-xs text-sm font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setShowFilterModal(true)}
                className={`p-3 border rounded-2xl transition shadow-xs relative ${
                  selectedTag 
                    ? 'bg-[#C5A880] text-stone-900 border-[#B89768]' 
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-white'
                }`}
              >
                <SlidersHorizontal size={18} />
                {selectedTag && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-stone-900 rounded-full border-2 border-white" />
                )}
              </button>
            </div>

            {/* FILTER PILLS */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button 
                onClick={() => setFilterTab("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs ${
                  filterTab === "all" 
                    ? 'bg-[#C5A880] text-stone-900 border border-[#B89768]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {lang === "vi" ? "Tất cả" : "All"}
              </button>
              <button 
                onClick={() => setFilterTab("recent")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs ${
                  filterTab === "recent" 
                    ? 'bg-[#C5A880] text-stone-900 border border-[#B89768]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {lang === "vi" ? "Gần đây" : "Recent"}
              </button>
              <button 
                onClick={() => setFilterTab("favorites")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs ${
                  filterTab === "favorites" 
                    ? 'bg-[#C5A880] text-stone-900 border border-[#B89768]' 
                    : 'bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200'
                }`}
              >
                {lang === "vi" ? "Yêu thích" : "Favorites"}
              </button>
            </div>

            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-[#E8E2D8] text-stone-700 rounded-full flex items-center justify-center mb-4 border border-[#D5CDBD] shadow-sm">
                  {searchQuery || selectedTag ? <Search size={28} /> : <ScanLine size={28} />}
                </div>
                <h2 className="text-lg font-semibold text-stone-900 mb-1">
                  {searchQuery || selectedTag ? t.noMatches : t.noCards}
                </h2>
                <p className="text-sm text-stone-500">
                  {searchQuery || selectedTag ? t.tryAdjusting : t.tapToScan}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContacts.map(contact => (
                  <div
                    key={contact.id}
                    onClick={() => { setSelectedContact(contact); setView("detail"); }}
                    className="w-full bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-stone-200/70 flex items-center justify-between hover:bg-white active:scale-[0.99] transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 bg-[#E8E2D8] text-[#5C5243] rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-[#D5CDBD] shadow-xs group-hover:scale-105 transition-transform">
                        {getInitials(contact.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-stone-900 text-base truncate">{contact.name || t.unknown}</h3>
                        <p className="text-xs text-stone-500 truncate mt-0.5">
                          {contact.jobTitle}{contact.jobTitle && contact.company ? " · " : ""}{contact.company}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(contact.id);
                      }}
                      className="p-2 text-[#C5A880] hover:scale-110 transition-transform ml-2 shrink-0"
                    >
                      <Star size={18} className={contact.isFavorite ? "fill-[#C5A880] text-[#C5A880]" : "text-stone-300"} />
                    </button>
                  </div>
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
            <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-200 space-y-4 text-stone-900">
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
                <label className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-1.5 ml-1">
                  <span className="text-stone-700"><Tag size={18} /></span>
                  {t.tags}
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900 transition placeholder:text-stone-400 font-medium text-sm"
                  placeholder={lang === "vi" ? "Nhập thẻ (ví dụ: Đối tác, VIP)..." : "Type tags..."}
                />
                {suggestedTags.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] font-semibold text-stone-500 mr-1">
                      {lang === "vi" ? "Gợi ý thẻ:" : "Suggested tags:"}
                    </span>
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => selectSuggestedTag(tag)}
                        className="text-xs bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 border border-stone-300 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all shadow-xs font-medium"
                      >
                        <Plus size={12} className="text-stone-500" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={saveNewContact}
              className="w-full bg-[#C5A880] hover:bg-[#B89768] active:scale-95 text-stone-900 font-bold py-4 rounded-2xl border border-[#B89768] shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Save size={20} />
              {t.saveContact}
            </button>
          </div>
        )}

        {/* CONTACT DETAIL */}
        {view === "detail" && selectedContact && (
          <div className="p-4 space-y-5">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col items-center text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-[#E8E2D8] text-[#5C5243] rounded-full flex items-center justify-center font-bold text-2xl mb-3 border border-[#D5CDBD] shadow-sm">
                {getInitials(selectedContact.name)}
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-0.5">{selectedContact.name || t.noName}</h2>
              <p className="text-xs font-medium text-stone-600">{selectedContact.jobTitle}</p>
              <p className="text-xs text-stone-500 mt-0.5">{selectedContact.company}</p>
              
              {/* 4 CIRCULAR QUICK ACTIONS */}
              <div className="grid grid-cols-4 gap-4 mt-6 w-full max-w-xs">
                <a 
                  href={`tel:${selectedContact.phone}`}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E5DFD5] flex items-center justify-center text-stone-700 group-hover:bg-[#C5A880] group-hover:text-stone-900 transition-colors shadow-xs">
                    <Phone size={18} />
                  </div>
                  <span className="text-[11px] font-medium text-stone-600">Gọi</span>
                </a>

                <a 
                  href={`mailto:${selectedContact.email}`}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E5DFD5] flex items-center justify-center text-stone-700 group-hover:bg-[#C5A880] group-hover:text-stone-900 transition-colors shadow-xs">
                    <Mail size={18} />
                  </div>
                  <span className="text-[11px] font-medium text-stone-600">Email</span>
                </a>

                <a 
                  href={`sms:${selectedContact.phone}`}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E5DFD5] flex items-center justify-center text-stone-700 group-hover:bg-[#C5A880] group-hover:text-stone-900 transition-colors shadow-xs">
                    <MessageSquare size={18} />
                  </div>
                  <span className="text-[11px] font-medium text-stone-600">Nhắn tin</span>
                </a>

                <button 
                  onClick={exportToCSV}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E5DFD5] flex items-center justify-center text-stone-700 group-hover:bg-[#C5A880] group-hover:text-stone-900 transition-colors shadow-xs">
                    <Download size={18} />
                  </div>
                  <span className="text-[11px] font-medium text-stone-600">Lưu</span>
                </button>
              </div>
            </div>

            {/* DETAIL ROWS */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-stone-200 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-600 flex items-center justify-center">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{selectedContact.phone || "—"}</p>
                    <p className="text-[11px] text-stone-400">Di động</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setEditForm(selectedContact);
                    setTagInput(selectedContact.tags?.join(", ") || "");
                    setView("editor");
                  }}
                  className="p-1 text-stone-400 hover:text-stone-600"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-600 flex items-center justify-center">
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{selectedContact.email || "—"}</p>
                    <p className="text-[11px] text-stone-400">Email</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-600 flex items-center justify-center">
                    <Globe size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{selectedContact.website || "—"}</p>
                    <p className="text-[11px] text-stone-400">Website</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF7F2] text-stone-600 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{selectedContact.address || "—"}</p>
                    <p className="text-[11px] text-stone-400">Địa chỉ</p>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTES CARD */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Ghi chú</h4>
                <button 
                  onClick={() => {
                    setEditForm(selectedContact);
                    setTagInput(selectedContact.tags?.join(", ") || "");
                    setView("editor");
                  }}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <Edit2 size={14} />
                </button>
              </div>
              <p className="text-xs text-stone-800 leading-relaxed font-medium">
                {selectedContact.notes || "Gặp tại sự kiện Tech Summit 2026"}
              </p>
            </div>

            {/* SAVE TO CONTACTS BUTTON */}
            <button 
              onClick={() => exportToCSV()}
              className="w-full bg-[#C5A880] hover:bg-[#B89768] active:scale-98 text-stone-900 font-semibold py-3.5 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all text-sm"
            >
              <User size={18} />
              {lang === "vi" ? "Lưu vào danh bạ" : "Save to contacts"}
            </button>
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
          <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold text-stone-900 mb-2">
              {lang === "vi" ? "Cài đặt" : "Settings"}
            </h2>

            {/* PROFILE CARD */}
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-stone-200 flex items-center gap-4">
              <div className="w-14 h-14 bg-[#E8E2D8] text-[#5C5243] rounded-full flex items-center justify-center font-bold text-lg border border-[#D5CDBD]">
                {getInitials(userProfile?.name || "Nguyễn Thị Mai Anh")}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-stone-900 text-base truncate">
                  {userProfile?.name || "Nguyễn Thị Mai Anh"}
                </h3>
                <p className="text-xs text-stone-500 truncate mt-0.5">
                  {userProfile?.email || "mai.anh@company.com"}
                </p>
              </div>
            </div>

            {/* SETTINGS OPTIONS LIST */}
            <div className="bg-white rounded-3xl p-2 shadow-sm border border-stone-200 divide-y divide-stone-100 text-stone-900">
              <button 
                onClick={() => {
                  if (isLoggedIn || auth?.currentUser) {
                    setShowAccountModal(true);
                  } else {
                    setShowLoginPrompt(true);
                  }
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-stone-900">
                  {lang === "vi" ? "Tài khoản & đồng bộ" : "Account & Sync"}
                </span>
                <ChevronRight size={18} className="text-stone-400" />
              </button>

              <button 
                onClick={() => {
                  const newLang = lang === "vi" ? "en" : "vi";
                  setLang(newLang);
                  localStorage.setItem("lang", newLang);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-stone-900">
                  {lang === "vi" ? "Ngôn ngữ" : "Language"}
                </span>
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span>{lang === "vi" ? "Tiếng Việt" : "English"}</span>
                  <ChevronRight size={18} className="text-stone-400" />
                </div>
              </button>

              <button 
                onClick={() => {
                  setShowExportMenu(true);
                }}
                className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-stone-900">
                  {lang === "vi" ? "Xuất dữ liệu" : "Export Data"}
                </span>
                <ChevronRight size={18} className="text-stone-400" />
              </button>

              <button 
                onClick={() => syncContacts(true)}
                className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors text-left"
              >
                <span className="text-sm font-semibold text-stone-900">
                  {lang === "vi" ? "Sao lưu dữ liệu" : "Data Backup"}
                </span>
                <ChevronRight size={18} className="text-stone-400" />
              </button>
            </div>

            {/* SIGN OUT BUTTON */}
            <button 
              onClick={handleSignOut}
              className="w-full bg-[#FAF7F2] hover:bg-[#EAE5DD] text-stone-700 font-medium py-3.5 rounded-2xl border border-stone-200 transition-colors text-sm text-center shadow-xs"
            >
              {lang === "vi" ? "Đăng xuất" : "Sign Out"}
            </button>
          </div>
        )}

      </main>

      {/* HIDDEN FILE INPUTS */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        className="hidden"
        ref={cameraInputRef}
        onChange={handleCapture}
      />
      <input 
        type="file" 
        accept="image/*" 
        className="hidden"
        ref={galleryInputRef}
        onChange={handleCapture}
      />

      {/* SCAN SELECTION BOTTOM SHEET */}
      {showScanMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setShowScanMenu(false)} />
          <div className="relative w-full max-w-md bg-zinc-900/90 border-t border-white/10 backdrop-blur-2xl rounded-t-[32px] p-6 shadow-[0_-8px_32px_0_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-bottom duration-200 max-h-[90dvh] overflow-y-auto">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-center text-white mb-6">Quét Danh Thiếp / Scan Card</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => {
                  setShowScanMenu(false);
                  cameraInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-500/30 transition-colors">
                  <Camera size={24} />
                </div>
                <span className="text-sm font-medium text-white/95">Chụp ảnh mới</span>
                <span className="text-[10px] text-white/50 mt-1">Sử dụng Camera</span>
              </button>
              <button 
                onClick={() => {
                  setShowScanMenu(false);
                  galleryInputRef.current?.click();
                }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500/30 transition-colors">
                  <Upload size={24} />
                </div>
                <span className="text-sm font-medium text-white/95">Tải ảnh lên</span>
                <span className="text-[10px] text-white/50 mt-1">Chọn từ thư viện</span>
              </button>
            </div>
            <button 
              onClick={() => setShowScanMenu(false)}
              className="w-full py-4 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-2xl border border-white/10 font-medium transition-colors"
            >
              Hủy / Cancel
            </button>
          </div>
        </div>
      )}

      {/* EXPORT OPTIONS BOTTOM SHEET */}
      {showExportMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setShowExportMenu(false)} />
          <div className="relative w-full max-w-md bg-zinc-900/90 border-t border-white/10 backdrop-blur-2xl rounded-t-[32px] p-6 shadow-[0_-8px_32px_0_rgba(0,0,0,0.5)] z-10 animate-in slide-in-from-bottom duration-200 max-h-[90dvh] overflow-y-auto">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-center text-white mb-6">
              {lang === "vi" ? "Xuất dữ liệu danh bạ" : "Export Contact Data"}
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => {
                  setShowExportMenu(false);
                  exportToCSV();
                }}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-500/30 transition-colors">
                  <Download size={24} />
                </div>
                <span className="text-sm font-medium text-white/95">Tải file Excel (.csv)</span>
                <span className="text-[10px] text-white/50 mt-1">Lưu về máy tính</span>
              </button>
              
              <button 
                onClick={() => {
                  setShowExportMenu(false);
                  handleExportToGoogleDrive();
                }}
                disabled={isExportingToDrive}
                className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-500/30 transition-colors">
                  {isExportingToDrive ? <Loader2 size={24} className="animate-spin" /> : <Cloud size={24} />}
                </div>
                <span className="text-sm font-medium text-white/95">Lưu Google Drive</span>
                <span className="text-[10px] text-white/50 mt-1">Chuyển thành Google Sheets</span>
              </button>
            </div>
            <button 
              onClick={() => setShowExportMenu(false)}
              className="w-full py-4 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white rounded-2xl border border-white/10 font-medium transition-colors"
            >
              {lang === "vi" ? "Hủy" : "Cancel"}
            </button>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExitConfirmModal(false)} />
          <div className="relative w-full max-w-sm bg-[#1C1A17] border border-[#3A352E] backdrop-blur-2xl rounded-3xl p-6 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-200 text-white">
            <div className="w-12 h-12 rounded-full bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">
              {lang === "vi" ? "Bạn có muốn quay lại?" : "Discard Changes?"}
            </h3>
            <p className="text-xs text-white/70 mb-6 leading-relaxed">
              {lang === "vi" 
                ? "Nếu quay lại sẽ mất thông tin mới quét" 
                : "Unsaved scanned details will be lost"}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirmModal(false)}
                className="flex-1 py-3.5 px-4 bg-[#C5A880] hover:bg-[#B89768] text-[#1C1A17] font-semibold rounded-xl text-sm transition-colors shadow-md"
              >
                {lang === "vi" ? "Tiếp tục chỉnh sửa" : "Continue editing"}
              </button>
              <button
                onClick={() => {
                  setShowExitConfirmModal(false);
                  setPreviewImage(null);
                  if (editForm.id) {
                    setView("detail");
                  } else {
                    setView("contacts");
                  }
                }}
                className="flex-1 py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white/90 rounded-xl text-sm font-medium border border-white/15 transition-colors"
              >
                {lang === "vi" ? "Quay lại" : "Discard"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT & SYNC MODAL */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setShowAccountModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl z-10 text-center animate-in zoom-in-95 duration-200 text-stone-900 border border-stone-200">
            <div className="w-16 h-16 rounded-full bg-[#E8E2D8] text-[#5C5243] border border-[#D5CDBD] flex items-center justify-center font-bold text-xl mx-auto mb-3">
              {getInitials(userProfile?.name || auth?.currentUser?.email || "User")}
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {userProfile?.name || auth?.currentUser?.displayName || "Tài khoản cá nhân"}
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              {auth?.currentUser?.email || userProfile?.email || "Đã đăng nhập và đồng bộ"}
            </p>

            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 text-left space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Trạng thái đồng bộ:</span>
                <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Tự động (Hoạt động)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Lần đồng bộ cuối:</span>
                <span className="text-stone-800 font-medium">Vừa xong</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">Tổng danh bạ:</span>
                <span className="text-stone-900 font-bold">{contacts.length} liên hệ</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  syncContacts(true);
                  setShowAccountModal(false);
                }}
                className="flex-1 py-3 bg-[#C5A880] hover:bg-[#B89768] text-stone-900 font-semibold rounded-xl text-xs transition-colors shadow-xs"
              >
                Đồng bộ ngay
              </button>
              <button
                onClick={() => setShowAccountModal(false)}
                className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl text-xs transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAG FILTER MODAL */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end justify-center transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setShowFilterModal(false)} />
          <div className="relative w-full max-w-md bg-white border-t border-stone-200 rounded-t-[32px] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[80dvh] overflow-y-auto">
            <div className="w-12 h-1 bg-stone-300 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-[#C5A880]" />
                {lang === "vi" ? "Bộ lọc thẻ danh bạ" : "Filter by Tags"}
              </h3>
              {selectedTag && (
                <button 
                  onClick={() => setSelectedTag(null)}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  {lang === "vi" ? "Bỏ lọc" : "Clear filter"}
                </button>
              )}
            </div>

            <p className="text-xs text-stone-500 mb-4">
              {lang === "vi" 
                ? "Chọn thẻ để lọc danh bạ tương ứng:" 
                : "Select a tag to filter your contacts:"}
            </p>

            {allTags.length === 0 ? (
              <p className="text-sm text-stone-400 italic py-4 text-center">
                {lang === "vi" ? "Chưa có thẻ nào trong hệ thống" : "No tags found"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                    !selectedTag 
                      ? 'bg-stone-900 text-white border-stone-900 shadow-xs' 
                      : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                  }`}
                >
                  {lang === "vi" ? "Tất cả thẻ" : "All Tags"}
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                      selectedTag === tag 
                        ? 'bg-[#C5A880] text-stone-900 border-[#B89768] shadow-xs' 
                        : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    <Tag size={12} className={selectedTag === tag ? "text-stone-900" : "text-stone-400"} />
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <button 
              onClick={() => setShowFilterModal(false)}
              className="w-full py-3.5 bg-stone-900 hover:bg-black text-white font-medium rounded-2xl transition-colors text-sm shadow-xs"
            >
              {lang === "vi" ? "Áp dụng" : "Apply Filter"}
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      {["contacts", "settings", "profile"].includes(view) && (
        <div className="bottom-nav-fixed left-6 right-6 bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-full px-6 py-2.5 flex justify-around items-center max-w-sm mx-auto shadow-lg z-50">
          <button 
            onClick={() => setView("contacts")}
            className={`flex flex-col items-center p-1.5 transition-all duration-300 ${view === "contacts" ? "text-stone-900 scale-105 font-bold" : "text-stone-400 hover:text-stone-600"}`}
          >
            <Users size={20} className="mb-1" />
            <span className="text-[10px] font-medium tracking-wide">{lang === "vi" ? "Danh bạ" : "Contacts"}</span>
          </button>
          
          <button 
            onClick={() => setShowScanMenu(true)}
            className="flex flex-col items-center p-1.5 transition-all duration-300 text-stone-900 hover:scale-105 active:scale-95 group"
          >
            <div className="w-9 h-9 rounded-full bg-[#E8E2D8] border border-[#D5CDBD] flex items-center justify-center text-[#5C5243] group-hover:bg-[#C5A880] group-hover:text-stone-900 shadow-xs mb-0.5">
              <ScanLine size={18} />
            </div>
            <span className="text-[10px] font-medium tracking-wide text-stone-700">
              {lang === "vi" ? "Quét" : "Scan"}
            </span>
          </button>
          
          <button 
            onClick={() => setView("settings")}
            className={`flex flex-col items-center p-1.5 transition-all duration-300 ${view === "settings" ? "text-stone-900 scale-105 font-bold" : "text-stone-400 hover:text-stone-600"}`}
          >
            <Settings size={20} className="mb-1" />
            <span className="text-[10px] font-medium tracking-wide">{lang === "vi" ? "Cài đặt" : "Settings"}</span>
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

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink mx-4 text-white/40 text-xs">{lang === "vi" ? "hoặc" : "or"}</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl border border-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Chrome size={16} className="text-red-400" />
              {t.continueWithGoogle}
            </button>

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
      <label className="flex items-center gap-2 text-sm font-bold text-stone-900 mb-1.5 ml-1">
        <span className="text-stone-700">{icon}</span>
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:bg-white focus:ring-1 focus:ring-stone-900 transition placeholder:text-stone-400 font-medium text-sm"
        placeholder={`Nhập ${label.toLowerCase()}`}
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

