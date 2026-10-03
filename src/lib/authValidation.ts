import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
  hint: string;
}

export interface PasswordStrengthResult {
  score: number; // 0, 1, 2, 3, 4
  label: "Too Short" | "Weak" | "Fair" | "Good" | "Strong";
  colorClass: string;
  textColorClass: string;
  barColor: string;
  percentage: number;
  requirements: PasswordRequirement[];
  isSufficient: boolean;
  missingRequirements: string[];
}

export interface AuthErrorDetails {
  title: string;
  message: string;
  missingRequirements?: string[];
  type?: "password" | "email" | "general" | "rate-limit";
}

export function evaluatePassword(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      label: "Too Short",
      colorClass: "bg-muted",
      textColorClass: "text-muted-foreground",
      barColor: "#d4d4d8",
      percentage: 0,
      requirements: [
        { id: "length", label: "At least 8 characters", hint: "8+ chars", met: false },
        { id: "uppercase", label: "One uppercase letter (A–Z)", hint: "A-Z", met: false },
        { id: "lowercase", label: "One lowercase letter (a–z)", hint: "a-z", met: false },
        { id: "number", label: "One number (0–9)", hint: "0-9", met: false },
        { id: "symbol", label: "One special symbol (!@#$%...)", hint: "!@#$", met: false },
      ],
      isSufficient: false,
      missingRequirements: [
        "At least 8 characters",
        "One uppercase letter (A–Z)",
        "One lowercase letter (a–z)",
        "One number (0–9)",
        "One special symbol (!@#$%...)",
      ],
    };
  }

  const hasLength = password.length >= 8;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const requirements: PasswordRequirement[] = [
    { id: "length", label: "At least 8 characters", hint: "8+ chars", met: hasLength },
    { id: "uppercase", label: "One uppercase letter (A–Z)", hint: "A-Z", met: hasUpper },
    { id: "lowercase", label: "One lowercase letter (a–z)", hint: "a-z", met: hasLower },
    { id: "number", label: "One number (0–9)", hint: "0-9", met: hasNumber },
    { id: "symbol", label: "One special symbol (!@#$%...)", hint: "!@#$", met: hasSymbol },
  ];

  const metCount = [hasLength, hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  const missingRequirements = requirements.filter((r) => !r.met).map((r) => r.label);

  // Industry-standard strength score calculation (0-4)
  let score = 1;
  let label: PasswordStrengthResult["label"] = "Weak";
  let colorClass = "bg-red-500";
  let textColorClass = "text-red-600 dark:text-red-400";
  let barColor = "#ef4444";
  let percentage = Math.min(20, Math.round((password.length / 8) * 20));

  if (!hasLength) {
    score = 1;
    label = "Too Short";
    colorClass = "bg-red-500";
    textColorClass = "text-red-600 dark:text-red-400";
    barColor = "#ef4444";
    percentage = Math.min(25, Math.round((password.length / 8) * 25));
  } else if (metCount <= 2) {
    score = 1;
    label = "Weak";
    colorClass = "bg-red-500";
    textColorClass = "text-red-600 dark:text-red-400";
    barColor = "#ef4444";
    percentage = 30;
  } else if (metCount === 3) {
    score = 2;
    label = "Fair";
    colorClass = "bg-amber-500";
    textColorClass = "text-amber-600 dark:text-amber-400";
    barColor = "#f59e0b";
    percentage = 60;
  } else if (metCount === 4) {
    score = 3;
    label = "Good";
    colorClass = "bg-emerald-500";
    textColorClass = "text-emerald-600 dark:text-emerald-400";
    barColor = "#10b981";
    percentage = 80;
  } else {
    score = 4;
    label = "Strong";
    colorClass = "bg-[#043f2e]";
    textColorClass = "text-[#043f2e] dark:text-emerald-400";
    barColor = "#043f2e";
    percentage = 100;
  }

  // Firebase auth password policy requires: length, lowercase, uppercase, number, symbol
  const isSufficient = hasLength && hasLower && hasUpper && hasNumber && hasSymbol;

  return {
    score,
    label,
    colorClass,
    textColorClass,
    barColor,
    percentage,
    requirements,
    isSufficient,
    missingRequirements,
  };
}

/**
 * Converts Firebase authentication errors into clean, professional, industry-standard UI feedback.
 */
export function formatAuthError(err: any): AuthErrorDetails {
  if (!err) {
    return {
      title: "Authentication Error",
      message: "An unexpected error occurred. Please try again.",
      type: "general",
    };
  }

  const code = err.code || "";
  const rawMsg = err.message || "";

  // Password requirements error from Firebase Password Policy
  if (
    code === "auth/password-does-not-meet-requirements" ||
    rawMsg.includes("Missing password requirements") ||
    rawMsg.includes("password-does-not-meet-requirements")
  ) {
    const missing: string[] = [];
    const lowerRaw = rawMsg.toLowerCase();

    if (lowerRaw.includes("lower case") || lowerRaw.includes("lowercase")) {
      missing.push("At least one lowercase letter (a–z)");
    }
    if (lowerRaw.includes("upper case") || lowerRaw.includes("uppercase")) {
      missing.push("At least one uppercase letter (A–Z)");
    }
    if (
      lowerRaw.includes("non-alphanumeric") ||
      lowerRaw.includes("symbol") ||
      lowerRaw.includes("special character")
    ) {
      missing.push("At least one special symbol (!@#$%^&*...)");
    }
    if (lowerRaw.includes("numeric") || lowerRaw.includes("number")) {
      missing.push("At least one numeric digit (0–9)");
    }
    if (lowerRaw.includes("character") && lowerRaw.includes("length")) {
      missing.push("At least 8 characters in length");
    }

    // Fallback if regex/string matching didn't catch specifics
    if (missing.length === 0) {
      missing.push("At least 8 characters");
      missing.push("One uppercase letter (A–Z)");
      missing.push("One lowercase letter (a–z)");
      missing.push("One number (0–9)");
      missing.push("One special symbol (!@#$%...)");
    }

    return {
      title: "Password does not meet requirements",
      message: "To keep your campus account secure, please satisfy the following required criteria:",
      missingRequirements: missing,
      type: "password",
    };
  }

  if (code === "auth/weak-password") {
    return {
      title: "Password is too weak",
      message: "Please choose a stronger password containing at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.",
      type: "password",
    };
  }

  if (code === "auth/email-already-in-use") {
    return {
      title: "Account already exists",
      message: "An account with this email address is already registered. Please sign in or reset your password.",
      type: "email",
    };
  }

  if (
    code === "auth/invalid-credential" ||
    code === "auth/wrong-password" ||
    code === "auth/user-not-found"
  ) {
    return {
      title: "Incorrect email or password",
      message: "The credentials you entered do not match our campus records. Please verify and try again.",
      type: "general",
    };
  }

  if (code === "auth/too-many-requests") {
    return {
      title: "Too many attempts",
      message: "Access temporarily paused to protect account security. Please wait a moment before trying again, or reset your password.",
      type: "rate-limit",
    };
  }

  if (code === "auth/invalid-email") {
    return {
      title: "Invalid email address",
      message: "Please enter a valid student email address (e.g. alex@stanford.edu or student@university.edu).",
      type: "email",
    };
  }

  if (code === "auth/network-request-failed") {
    return {
      title: "Network connection error",
      message: "Unable to contact authentication servers. Please check your internet connection and try again.",
      type: "general",
    };
  }

  // Generic fallback: strip ugly 'Firebase: ' prefix and '(auth/...)' code
  const sanitized = rawMsg
    .replace(/^Firebase:\s*/i, "")
    .replace(/\s*\([a-z0-9_\-/]+\)\.?$/i, "")
    .trim();

  return {
    title: "Authentication notice",
    message: sanitized || "An error occurred during authentication. Please try again.",
    type: "general",
  };
}

export interface UsernameValidationResult {
  valid: boolean;
  error?: string;
}

export function validateUsernameFormat(username: string): UsernameValidationResult {
  const trimmed = username.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: "Username is required." };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters." };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: "Username cannot exceed 20 characters." };
  }

  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return {
      valid: false,
      error: "Username can only contain letters, numbers, and underscores (_).",
    };
  }

  if (trimmed.startsWith("_") || trimmed.endsWith("_")) {
    return {
      valid: false,
      error: "Username cannot start or end with an underscore.",
    };
  }

  if (trimmed.includes("__")) {
    return {
      valid: false,
      error: "Username cannot contain consecutive underscores.",
    };
  }

  return { valid: true };
}

/**
 * Checks if a username is already taken in the Firestore `usernames` registry.
 */
export async function checkUsernameAvailability(
  username: string,
  currentUid?: string
): Promise<{ available: boolean; error?: string }> {
  const formatCheck = validateUsernameFormat(username);
  if (!formatCheck.valid) {
    return { available: false, error: formatCheck.error };
  }

  const normalized = username.trim().toLowerCase();

  try {
    const usernameDocRef = doc(db, "usernames", normalized);
    const snap = await getDoc(usernameDocRef);

    if (snap.exists()) {
      const data = snap.data();
      // If the current user already owns this username, it's available to them
      if (currentUid && data?.uid === currentUid) {
        return { available: true };
      }
      return { available: false, error: `The username "@${normalized}" is already taken.` };
    }

    return { available: true };
  } catch (err: any) {
    console.error("Error checking username availability:", err);
    // If there's an unexpected network or permission error, return a helpful error
    return { 
      available: false, 
      error: "Unable to verify username availability at this moment. Please try again." 
    };
  }
}

/**
 * Prohibited personal email domains that cannot be used on Befakor.
 */
export const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "aim.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "fastmail.com",
  "yandex.com",
  "tutanota.com",
  "tutamail.com",
  "hey.com",
  "comcast.net",
  "sbcglobal.net",
  "att.net",
  "verizon.net"
]);

/**
 * Recognized academic institutions for instant campus badge display.
 */
export const KNOWN_UNIVERSITIES: Record<string, string> = {
  "stanford.edu": "Stanford University",
  "harvard.edu": "Harvard University",
  "mit.edu": "MIT",
  "berkeley.edu": "UC Berkeley",
  "columbia.edu": "Columbia University",
  "princeton.edu": "Princeton University",
  "yale.edu": "Yale University",
  "cornell.edu": "Cornell University",
  "nyu.edu": "New York University",
  "ucla.edu": "UCLA",
  "usc.edu": "USC",
  "utexas.edu": "UT Austin",
  "umich.edu": "University of Michigan",
  "gatech.edu": "Georgia Tech",
  "cmu.edu": "Carnegie Mellon",
  "upenn.edu": "University of Pennsylvania",
  "northwestern.edu": "Northwestern University",
  "duke.edu": "Duke University",
  "brown.edu": "Brown University",
  "dartmouth.edu": "Dartmouth College",
  "uchicago.edu": "University of Chicago",
  "jhu.edu": "Johns Hopkins University",
  "virginia.edu": "University of Virginia",
  "unc.edu": "UNC Chapel Hill",
  "uw.edu": "University of Washington",
  "ox.ac.uk": "University of Oxford",
  "cam.ac.uk": "University of Cambridge",
  "utoronto.ca": "University of Toronto",
  "mcgill.ca": "McGill University",
  "ubc.ca": "UBC",
  "uwaterloo.ca": "University of Waterloo",
};

export interface StudentEmailValidationResult {
  isValid: boolean;
  isPersonal: boolean;
  domain: string;
  schoolName: string;
  error?: string;
}

/**
 * Checks whether an email address belongs to a verified university/student domain.
 */
export function isStudentEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex === -1 || atIndex === trimmed.length - 1) return false;

  const domain = trimmed.slice(atIndex + 1);

  // Explicit rejection of personal email providers
  if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return false;
  }

  // 1. Standard US & international .edu domains (e.g. stanford.edu, mail.ucsd.edu, alumni.harvard.edu)
  if (domain.endsWith(".edu") || domain.includes(".edu.")) {
    return true;
  }

  // 2. International academic extensions (.ac.uk, .ac.in, .ac.jp, .edu.au, .edu.ca, .edu.gh, etc.)
  if (/\.(edu|ac)(\.[a-z]{2,3})?$/i.test(domain)) {
    return true;
  }

  // 3. Known university domains without .edu extension (e.g., Canadian universities utoronto.ca)
  if (domain in KNOWN_UNIVERSITIES) {
    return true;
  }

  // 4. Subdomains of universities
  for (const knownDomain of Object.keys(KNOWN_UNIVERSITIES)) {
    if (domain.endsWith(`.${knownDomain}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Detailed evaluation of an email address for student verification UX.
 */
export function getStudentEmailValidation(email: string): StudentEmailValidationResult {
  const trimmed = (email || "").trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  
  if (atIndex === -1 || atIndex === trimmed.length - 1) {
    return {
      isValid: false,
      isPersonal: false,
      domain: "",
      schoolName: "",
      error: "Please enter a valid university email address (e.g. alex@stanford.edu).",
    };
  }

  const domain = trimmed.slice(atIndex + 1);
  const isPersonal = PERSONAL_EMAIL_DOMAINS.has(domain);

  if (isPersonal) {
    return {
      isValid: false,
      isPersonal: true,
      domain,
      schoolName: "",
      error: `Personal email address detected (@${domain}). Befakor is an exclusive campus marketplace for verified students. Only official student or university emails (.edu or academic domain) are permitted.`,
    };
  }

  const isEdu = isStudentEmail(trimmed);
  if (!isEdu) {
    return {
      isValid: false,
      isPersonal: false,
      domain,
      schoolName: "",
      error: `Invalid campus domain (@${domain}). Only official university or student email addresses (.edu or academic domain) can access Befakor.`,
    };
  }

  // Extract friendly school name
  let schoolName = KNOWN_UNIVERSITIES[domain] || "";
  if (!schoolName) {
    for (const [knownDomain, name] of Object.entries(KNOWN_UNIVERSITIES)) {
      if (domain.endsWith(`.${knownDomain}`)) {
        schoolName = name;
        break;
      }
    }
  }

  if (!schoolName) {
    // Generate readable campus name from domain
    const rootDomain = domain.split(".")[0];
    schoolName = rootDomain.charAt(0).toUpperCase() + rootDomain.slice(1) + " Campus";
  }

  return {
    isValid: true,
    isPersonal: false,
    domain,
    schoolName,
  };
}
