import http from "http";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper for lazy loading GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Route: Parse WhatsApp text or copy-pasted student data using Gemini
app.post("/api/parse-whatsapp", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string") {
    res.status(400).json({ error: "Text is required and must be a string." });
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Graceful fallback for missing or placeholder key
      console.warn("GEMINI_API_KEY is missing or is placeholder. Falling back to local parser.");
      const fallbackResult = parseStudentsLocallyFallback(text);
      res.json({ students: fallbackResult, warning: "Using local regex-based parsing because GEMINI_API_KEY is not configured." });
      return;
    }

    const ai = getGeminiClient();
    const prompt = `You are an expert student data extraction assistant. Extract student details from the following raw text or WhatsApp message, and format them strictly according to the specified JSON schema.

Unstructured Student Data:
"""
${text}
"""

Instructions:
1. Extract Admission Number (usually "Ad.No", "Adm No", "ID", or a leading number).
2. Extract Student Name in English/Malayalam/Arabic. Put English name in 'name' field, and Arabic/Malayalam name in 'arabicName' field if present.
3. Gender MUST be normalized to either "Male" or "Female". Look for Male/Female, Boy/Girl, B/G, M/F.
4. Extract Class Level (e.g., 'Class 5', '5', 'Std VI') and Division (e.g., 'A', 'B', 'C').
6. Extract Shift (Shift 1/Shift 2). If not specified, default to "Shift 1".
7. Extract DOB, Father's Name, Phone Number, Delivery Address, PIN code if available.
8. Return an array of student objects. If some information is not present, omit the fields or set them to empty strings.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              admissionNumber: { type: Type.STRING, description: "Admission number or index" },
              name: { type: Type.STRING, description: "English name of the student" },
              arabicName: { type: Type.STRING, description: "Arabic or vernacular name of the student if available" },
              gender: { type: Type.STRING, description: "Must be 'Male' or 'Female' only" },
              dob: { type: Type.STRING, description: "Date of Birth if available" },
              fatherName: { type: Type.STRING, description: "Father's name if available" },
              phone: { type: Type.STRING, description: "Phone or WhatsApp contact number" },
              address: { type: Type.STRING, description: "Full delivery/postal address" },
              classLevel: { type: Type.STRING, description: "Class level e.g. 'Class 5', '5'" },
              division: { type: Type.STRING, description: "Division letter e.g. 'A', 'B'" },
              shift: { type: Type.STRING, description: "Shift, e.g. 'Shift 1', 'Shift 2'" },
            },
            required: ["name", "gender", "classLevel"],
          },
        },
      },
    });

    const parsedText = response.text || "[]";
    const students = JSON.parse(parsedText);
    res.json({ students });
  } catch (error: any) {
    console.error("Gemini Parse Error:", error);
    // Even if Gemini fails, we fall back to local parser so user has a working system
    const fallbackResult = parseStudentsLocallyFallback(text);
    res.json({
      students: fallbackResult,
      warning: `Gemini extraction failed, used basic regex extraction. Error: ${error.message || error}`,
    });
  }
});

// Basic local regex-based fallback extractor if API key is missing or fails
function parseStudentsLocallyFallback(text: string): any[] {
  const students: any[] = [];
  const lines = text.split("\n");
  let idCounter = 1001;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;

    // Check for comma or semicolon delimited list
    const parts = trimmed.split(/[,;\t]+/).map(p => p.trim());
    if (parts.length >= 2) {
      let adNo = "";
      let name = "";
      let classLevel = "Class 5";
      let division = "A";
      let gender = "Male";
      let fatherName = "";
      let phone = "";
      let address = "";
      let shift = "Shift 1";

      // Simple positional or match detection
      // Look for Admission Number
      const adMatch = trimmed.match(/(?:ad\.?\s*no|adm|id|no)[:\s-]*(\d+)/i) || trimmed.match(/^(\d+)/);
      if (adMatch) adNo = adMatch[1];
      else adNo = String(idCounter++);

      // Look for gender
      if (trimmed.match(/female|girl|g|f/i)) {
        gender = "Female";
      } else {
        gender = "Male";
      }

      // Look for Class
      const classMatch = trimmed.match(/(?:class|std|grade|classlevel)\s*(\d+|[ivxldm]+)/i);
      if (classMatch) {
        classLevel = "Class " + classMatch[1];
      }

      // Look for Division
      const divMatch = trimmed.match(/\b([A-D])\b/i);
      if (divMatch) {
        division = divMatch[1].toUpperCase();
      }

      // Name candidate: usually the first non-numeric part
      const nameParts = parts.filter(p => !p.match(/^\d+$/) && !p.match(/boy|girl|male|female|class|shift\s*1|shift\s*2/i));
      if (nameParts.length > 0) {
        name = nameParts[0];
        // Clean out any Ad. No prefixes
        name = name.replace(/(?:ad\.?\s*no|adm|id|no)[:\s-]*\d+/i, "").trim();
      } else {
        name = "Student " + adNo;
      }

      // Look for phone
      const phoneMatch = trimmed.match(/(\+?\d{10,12})/);
      if (phoneMatch) phone = phoneMatch[1];

      // Shift
      if (trimmed.match(/shift\s*2|afternoon|pm/i)) {
        shift = "Shift 2";
      }

      students.push({
        admissionNumber: adNo,
        name,
        arabicName: "",
        gender,
        dob: "",
        fatherName: fatherName || "Father",
        phone,
        address: address || "Malappuram, Kerala",
        classLevel,
        division,
        shift,
      });
    }
  }

  return students;
}

// Submissions Database
const SUBMISSIONS_FILE = path.join(process.cwd(), "submissions.json");
const ORDERS_FILE = path.join(process.cwd(), "orders.json");
const PRICING_FILE = path.join(process.cwd(), "pricing.json");
const TIMETABLES_FILE = path.join(process.cwd(), "timetables.json");
const SYSTEM_CONFIG_FILE = path.join(process.cwd(), "system_config.json");
const SUBJECT_DIRECTORY_FILE = path.join(process.cwd(), "subject_directory.json");

function isAuthorizedAdminOrAccounts(emailOrSecret: string | undefined): boolean {
  if (!emailOrSecret) return false;
  const clean = emailOrSecret.trim().toLowerCase();
  if (clean === "system_link_activation" || clean.includes("whatsapp") || clean === "edavachalniyas@gmail.com") return true;

  try {
    if (fs.existsSync(SYSTEM_CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_FILE, "utf-8"));
      if (Array.isArray(cfg.superAdmins)) {
        if (cfg.superAdmins.some((a: any) => a.email && a.email.toLowerCase() === clean)) return true;
      }
      if (Array.isArray(cfg.accountsUsers)) {
        if (cfg.accountsUsers.some((u: any) => u.email && u.email.toLowerCase() === clean)) return true;
      }
    }
  } catch (e) {}

  if (clean === "accounts@madrasaseating.com") return true;
  return false;
}

// Clean Slate: No hardcoded default board timetables
const defaultOfficialTimetables: any[] = [];

function loadOfficialTimetables(): any[] {
  try {
    if (fs.existsSync(TIMETABLES_FILE)) {
      const data = fs.readFileSync(TIMETABLES_FILE, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(TIMETABLES_FILE, JSON.stringify([], null, 2), "utf8");
      return [];
    }
  } catch (err) {
    console.error("Error loading timetables:", err);
    return [];
  }
}

function saveOfficialTimetables(timetables: any[]) {
  try {
    fs.writeFileSync(TIMETABLES_FILE, JSON.stringify(timetables, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving timetables:", err);
  }
}

// API Route: Get all official board timetables
app.get("/api/official-timetables", (req, res) => {
  const timetables = loadOfficialTimetables();
  // Sort: default board first, followed by most recently updated
  timetables.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    const timeA = new Date(a.lastUpdated || a.publishedAt || 0).getTime();
    const timeB = new Date(b.lastUpdated || b.publishedAt || 0).getTime();
    return timeB - timeA;
  });
  res.json({ success: true, timetables });
});

// API Route: Save/Update or Publish Official Timetable by SuperAdmin
app.put("/api/official-timetables/:id", (req, res) => {
  const { id } = req.params;
  const updatedTimetable = req.body;
  
  if (!updatedTimetable || typeof updatedTimetable !== "object") {
    res.status(400).json({ error: "Invalid timetable payload." });
    return;
  }

  let list = loadOfficialTimetables();
  const idx = list.findIndex(t => t.id === id);
  const nowIso = new Date().toISOString();

  // If this board is marked as default, unset isDefault for others
  if (updatedTimetable.isDefault) {
    list.forEach(t => {
      if (t.id !== id) t.isDefault = false;
    });
  }

  // Normalize classes dictionary so both 'Class X' and 'X' exist for every class
  if (updatedTimetable.classes && typeof updatedTimetable.classes === "object") {
    const normClasses = { ...updatedTimetable.classes };
    Object.entries(updatedTimetable.classes).forEach(([k, v]) => {
      const numMatch = k.match(/\d+/);
      if (numMatch) {
        const plainNum = numMatch[0];
        normClasses[`Class ${plainNum}`] = v;
        normClasses[plainNum] = v;
      }
    });
    updatedTimetable.classes = normClasses;
  }

  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...updatedTimetable,
      id,
      publishedAt: list[idx].publishedAt || nowIso,
      lastUpdated: nowIso,
      updatedBy: updatedTimetable.updatedBy || "Super Admin"
    };
  } else {
    list.push({
      ...updatedTimetable,
      id,
      publishedAt: nowIso,
      lastUpdated: nowIso,
      updatedBy: updatedTimetable.updatedBy || "Super Admin"
    });
  }

  saveOfficialTimetables(list);
  res.json({ success: true, timetable: list.find(t => t.id === id) });
});

// API Route: Set Board Timetable as Default
app.post("/api/official-timetables/:id/set-default", (req, res) => {
  const { id } = req.params;
  let list = loadOfficialTimetables();
  const found = list.find(t => t.id === id);
  if (!found) {
    res.status(404).json({ error: "Timetable not found." });
    return;
  }
  list.forEach(t => {
    t.isDefault = t.id === id;
    if (t.id === id) {
      t.lastUpdated = new Date().toISOString();
    }
  });
  saveOfficialTimetables(list);
  res.json({ success: true, timetable: found });
});

// API Route: Create a new Board Timetable by SuperAdmin
app.post("/api/official-timetables", (req, res) => {
  const newTT = req.body;
  if (!newTT || !newTT.boardName) {
    res.status(400).json({ error: "Board Name is required." });
    return;
  }

  const list = loadOfficialTimetables();
  const id = newTT.id || "board_" + Date.now();
  const timetableObj = {
    ...newTT,
    id,
    publishedAt: new Date().toISOString()
  };

  list.push(timetableObj);
  saveOfficialTimetables(list);
  res.json({ success: true, timetable: timetableObj });
});

// API Route: Delete a Board Timetable
app.delete("/api/official-timetables/:id", (req, res) => {
  const { id } = req.params;
  let list = loadOfficialTimetables();
  list = list.filter(t => t.id !== id);
  saveOfficialTimetables(list);
  res.json({ success: true });
});

const TIMETABLES_BACKUP_FILE = path.join(process.cwd(), "timetables_backup.json");

// API Route: Create server snapshot backup of all official timetables
app.post("/api/official-timetables/backup", (req, res) => {
  try {
    const timetables = loadOfficialTimetables();
    const backupPayload = {
      appName: "Madrasa Seating Engine",
      backupType: "official_timetables_backup",
      version: "1.0",
      createdAt: new Date().toISOString(),
      createdBy: "Super Admin",
      totalBoards: timetables.length,
      timetables
    };
    fs.writeFileSync(TIMETABLES_BACKUP_FILE, JSON.stringify(backupPayload, null, 2), "utf8");
    res.json({ success: true, backup: backupPayload });
  } catch (err: any) {
    console.error("Error backing up timetables:", err);
    res.status(500).json({ error: err.message || "Failed to create backup" });
  }
});

// API Route: Get latest server snapshot backup status
app.get("/api/official-timetables/backup", (req, res) => {
  try {
    if (fs.existsSync(TIMETABLES_BACKUP_FILE)) {
      const data = fs.readFileSync(TIMETABLES_BACKUP_FILE, "utf8");
      const backup = JSON.parse(data);
      res.json({ success: true, hasBackup: true, backup });
    } else {
      res.json({ success: true, hasBackup: false });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Route: Restore official timetables from payload or server snapshot
app.post("/api/official-timetables/restore", (req, res) => {
  try {
    const { timetables, useServerSnapshot, backupPayload } = req.body;
    let listToRestore: any[] = [];

    if (useServerSnapshot) {
      if (!fs.existsSync(TIMETABLES_BACKUP_FILE)) {
        res.status(404).json({ error: "സെർവറിൽ മുൻപത്തെ ബാക്കപ്പ് ഫയലുകൾ ലഭ്യമല്ല." });
        return;
      }
      const data = fs.readFileSync(TIMETABLES_BACKUP_FILE, "utf8");
      const snapshot = JSON.parse(data);
      listToRestore = snapshot.timetables || [];
    } else if (Array.isArray(timetables)) {
      listToRestore = timetables;
    } else if (backupPayload && Array.isArray(backupPayload.timetables)) {
      listToRestore = backupPayload.timetables;
    } else if (req.body && req.body.boardName && req.body.classes) {
      // Single board payload passed directly
      const currentList = loadOfficialTimetables();
      const existingIdx = currentList.findIndex(t => t.id === req.body.id);
      if (existingIdx !== -1) {
        currentList[existingIdx] = req.body;
      } else {
        currentList.push(req.body);
      }
      listToRestore = currentList;
    } else {
      res.status(400).json({ error: "സാധുവായ ടൈംടേബിൾ ബാക്കപ്പ് വിവരങ്ങൾ ലഭ്യമല്ല." });
      return;
    }

    if (!Array.isArray(listToRestore) || listToRestore.length === 0) {
      res.status(400).json({ error: "ബാക്കപ്പ് ഫയലിൽ സാധുവായ ടൈംടേബിളുകൾ കണ്ടെത്താനായില്ല." });
      return;
    }

    // Save previous state as undo point
    const currentList = loadOfficialTimetables();
    try {
      fs.writeFileSync(path.join(process.cwd(), "timetables_prev_restore.json"), JSON.stringify(currentList, null, 2), "utf8");
    } catch (e) {}

    saveOfficialTimetables(listToRestore);
    res.json({ success: true, timetables: listToRestore, totalRestored: listToRestore.length });
  } catch (err: any) {
    console.error("Error restoring timetables:", err);
    res.status(500).json({ error: err.message || "Failed to restore timetables" });
  }
});

const defaultPricingConfig = {
  packageTitle: "Print & Courier Delivery Package",
  packageTitleMl: "പാക്കേജ് തുക വിവരങ്ങൾ",
  packageSubtitle: "Laminated desk stickers and door attendance registers delivered directly to your Madrasa",
  packageSubtitleMl: "ലാമിനേറ്റ് ചെയ്ത ഡെസ്ക് സ്റ്റിക്കറുകളും ഹാൾ രജിസ്റ്ററുകളും മദ്റസയിലേക്ക് നേരിട്ട് എത്തിക്കുന്നു",
  whatsappSupportPhone: "919633465267",
  freeDeliveryThreshold: 1000,
  courierFee: 80,
  courierTitle: "Speed Post / Courier Delivery",
  courierTitleMl: "സ്പീഡ് പോസ്റ്റ് / കൊറിയർ ഡെലിവറി",
  courierDesc: "Safe and fast delivery across Kerala via India Post / DTDC",
  courierDescMl: "കേരളത്തിലുടനീളം സ്പീഡ് പോസ്റ്റ് / DTDC വഴി മദ്റസയിലേക്ക് നേരിട്ട് എത്തിക്കുന്നു",
  items: [
    {
      id: "desk_stickers",
      name: "Standard Sticker Paper",
      nameMl: "സ്റ്റാൻഡേർഡ് ഡെസ്ക് സ്റ്റിക്കർ പേപ്പർ",
      description: "Heavy 250 GSM waterproof laminated stickers with Roll No, Class, Arabic name & Hall index",
      descriptionMl: "ഡെസ്ക് സ്റ്റിക്കർ പേപ്പർ (സാധാരണ സ്റ്റിക്കർ പേപ്പർ പ്രിന്റ് ചെയ്ത് അയക്കുന്നു (റോൾ നമ്പർ, ക്ലാസ്സ്, അറബിക് പേര് സഹിതം)",
      pricingType: "fixed", // "fixed" | "per_student" | "per_hall"
      price: 199,
      unitPrice: 199,
      defaultQtyLabel: "Seats",
      enabled: true,
      isMandatory: true,
      icon: "Sparkles"
    },
    {
      id: "door_registers",
      name: "Hall Door Attendance & Seating Slips",
      nameMl: "പരീക്ഷാ ഹാൾ ഡോർ അറ്റൻഡൻസ് രജിസ്റ്ററുകൾ",
      description: "Class-wise student door attendance sheets and hall seating matrix for notice boards",
      descriptionMl: "ഹാളിന്റെ വാതിലിൽ ഒട്ടിക്കുന്ന എ-ക്ലാസ്സ് അറ്റൻഡൻസ് ചാർട്ടും സീറ്റിംഗ് മാട്രിക്സ് സ്ലിപ്പുകളും",
      pricingType: "fixed",
      price: 100,
      unitPrice: 100,
      defaultQtyLabel: "Halls",
      enabled: true,
      isMandatory: false,
      icon: "FileText"
    }
  ]
};

function loadPricingConfig() {
  try {
    if (fs.existsSync(PRICING_FILE)) {
      const data = fs.readFileSync(PRICING_FILE, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(PRICING_FILE, JSON.stringify(defaultPricingConfig, null, 2), "utf8");
      return defaultPricingConfig;
    }
  } catch (err) {
    console.error("Error loading pricing config:", err);
    return defaultPricingConfig;
  }
}

function savePricingConfig(config: any) {
  try {
    fs.writeFileSync(PRICING_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving pricing config:", err);
  }
}

// Get pricing configuration
app.get("/api/pricing-config", (req, res) => {
  const config = loadPricingConfig();
  res.json({ success: true, config });
});

// Update pricing configuration by SuperAdmin
app.put("/api/pricing-config", (req, res) => {
  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== "object") {
    res.status(400).json({ error: "Invalid pricing configuration." });
    return;
  }
  savePricingConfig(newConfig);
  res.json({ success: true, config: newConfig });
});

// Seed mock orders
const seedOrders = [
  {
    id: "ORD-2026-8941",
    madrasaName: "أنوار المدارس (Anwar-ul-Madaris)",
    regNo: "Reg No: 4892 / SKIMVB",
    place: "Malappuram, Kerala",
    contactName: "Usthad Siddique Hassan",
    phone: "9847123456",
    address: "Anwar-ul-Madaris, Vengara Road, Malappuram PIN: 676505",
    items: [
      { name: "Standard Sticker Paper", qty: "120 Seats", price: 199 },
      { name: "Hall Door Attendance Registers", qty: "4 Halls", price: 100 },
    ],
    printFee: 299,
    courierFee: 80,
    totalAmount: 379,
    status: "Printing", // Pending, Printing, Couriered, Delivered
    trackingNo: "IN-CP88320491IN",
    courierPartner: "India Post Speed Post",
    orderedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "ORD-2026-7820",
    madrasaName: "Darul Huda Madrasa",
    regNo: "SK-2015",
    place: "Valanchery",
    contactName: "Abdul Rahman Usthad",
    phone: "9845112233",
    address: "Darul Huda, Central Jn, Valanchery PIN: 676552",
    items: [
      { name: "Standard Sticker Paper", qty: "80 Seats", price: 199 },
      { name: "Answer Sheet Roll Number Labels", qty: "80 Cards", price: 100 }
    ],
    printFee: 299,
    courierFee: 80,
    totalAmount: 379,
    status: "Couriered",
    trackingNo: "DTDC-KL904221",
    courierPartner: "DTDC Express",
    orderedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

function loadOrders(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(seedOrders, null, 2), "utf8");
      return seedOrders;
    }
  } catch (err) {
    console.error("Error loading orders:", err);
    return seedOrders;
  }
}

function saveOrders(orders: any[]) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving orders:", err);
  }
}

// Get all orders
app.get("/api/orders", (req, res) => {
  const orders = loadOrders();
  res.json({ orders });
});

// Create new print & courier order
app.post("/api/orders", (req, res) => {
  const { 
    madrasaName, 
    regNo, 
    place, 
    contactName, 
    phone, 
    address, 
    items, 
    printFee, 
    courierFee, 
    totalAmount,
    isPartnerOrder,
    partnerName,
    partnerPhone,
    partnerNotes,
    clientRetailPrice,
    partnerProfit,
    totalSeats,
    totalHalls
  } = req.body;
  
  if (!madrasaName || !phone || !address) {
    res.status(400).json({ error: "Madrasa Name, Phone, and Courier Address are required." });
    return;
  }

  const orders = loadOrders();
  const newOrder = {
    id: "ORD-2026-" + Math.floor(1000 + Math.random() * 9000),
    madrasaName,
    regNo: regNo || "Reg No: Pending",
    place: place || "Kerala",
    contactName: contactName || "Madrasa Representative",
    phone,
    address,
    items: Array.isArray(items) ? items : [],
    printFee: Number(printFee) || 299,
    courierFee: Number(courierFee) || 80,
    totalAmount: Number(totalAmount) || 379,
    isPartnerOrder: !!isPartnerOrder,
    partnerName: partnerName || "",
    partnerPhone: partnerPhone || "",
    partnerNotes: partnerNotes || "",
    clientRetailPrice: Number(clientRetailPrice) || 0,
    partnerProfit: Number(partnerProfit) || 0,
    totalSeats: Number(totalSeats) || 0,
    totalHalls: Number(totalHalls) || 0,
    students: Array.isArray(req.body.students) ? req.body.students : [],
    halls: Array.isArray(req.body.halls) ? req.body.halls : [],
    seatingData: req.body.seatingData || null,
    notes: req.body.notes || "",
    status: "Pending",
    trackingNo: "",
    courierPartner: "Speed Post / DTDC",
    orderedAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  saveOrders(orders);
  res.json({ success: true, order: newOrder });
});

// Update order status or tracking
app.patch("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status, trackingNo, courierPartner, rejectionReason, notes } = req.body;
  
  const orders = loadOrders();
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  if (status) orders[orderIndex].status = status;
  if (trackingNo !== undefined) orders[orderIndex].trackingNo = trackingNo;
  if (courierPartner !== undefined) orders[orderIndex].courierPartner = courierPartner;
  if (rejectionReason !== undefined) orders[orderIndex].rejectionReason = rejectionReason;
  if (notes !== undefined) orders[orderIndex].notes = notes;

  saveOrders(orders);
  res.json({ success: true, order: orders[orderIndex] });
});

// Full update of order details by SuperAdmin
app.put("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { madrasaName, regNo, place, contactName, phone, address, printFee, courierFee, totalAmount, status, trackingNo } = req.body;
  
  const orders = loadOrders();
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  if (madrasaName) orders[orderIndex].madrasaName = madrasaName;
  if (regNo !== undefined) orders[orderIndex].regNo = regNo;
  if (place !== undefined) orders[orderIndex].place = place;
  if (contactName !== undefined) orders[orderIndex].contactName = contactName;
  if (phone) orders[orderIndex].phone = phone;
  if (address) orders[orderIndex].address = address;
  if (printFee !== undefined) orders[orderIndex].printFee = Number(printFee);
  if (courierFee !== undefined) orders[orderIndex].courierFee = Number(courierFee);
  if (totalAmount !== undefined) orders[orderIndex].totalAmount = Number(totalAmount);
  if (status) orders[orderIndex].status = status;
  if (trackingNo !== undefined) orders[orderIndex].trackingNo = trackingNo;

  saveOrders(orders);
  res.json({ success: true, order: orders[orderIndex] });
});

// Seed mock submitted Madrasas if not existing
const seedSubmissions = [
  {
    id: "sub-1",
    name: "Darul Huda Madrasa",
    regNo: "SK-2015",
    place: "Valanchery",
    phone: "9845112233",
    submittedAt: new Date().toISOString(),
    hasExcel: true,
    students: [
      {
        id: "sub-s-1",
        admissionNumber: "1501",
        name: "Muhammed Ameen",
        arabicName: "محمد أمين",
        gender: "Male",
        dob: "2015-04-10",
        fatherName: "Mujeeb Rahman",
        phone: "9845112233",
        address: "Valanchery, Malappuram",
        classLevel: "Class 5",
        division: "A",
        shift: "Shift 1"
      },
      {
        id: "sub-s-2",
        admissionNumber: "1502",
        name: "Fathima Rifa",
        arabicName: "فاطمة ريفا",
        gender: "Female",
        dob: "2015-08-14",
        fatherName: "Mujeeb Rahman",
        phone: "9845112233",
        address: "Valanchery, Malappuram",
        classLevel: "Class 5",
        division: "A",
        shift: "Shift 1"
      },
      {
        id: "sub-s-3",
        admissionNumber: "1503",
        name: "Ahmad Kabir",
        arabicName: "أحمد كبير",
        gender: "Male",
        dob: "2014-02-19",
        fatherName: "Kabeer",
        phone: "9845112233",
        address: "Valanchery, Malappuram",
        classLevel: "Class 6",
        division: "B",
        shift: "Shift 2"
      },
      {
        id: "sub-s-3b",
        admissionNumber: "1504",
        name: "Safa Fathima",
        arabicName: "صفا فاطمة",
        gender: "Female",
        dob: "2014-05-12",
        fatherName: "Siddique",
        phone: "9845112233",
        address: "Valanchery, Malappuram",
        classLevel: "Class 6",
        division: "A",
        shift: "Shift 2"
      }
    ]
  },
  {
    id: "sub-2",
    name: "Noorul Islam Madrasa",
    regNo: "SK-4409",
    place: "Perinthalmanna",
    phone: "9447334455",
    submittedAt: new Date().toISOString(),
    hasExcel: false,
    students: [
      {
        id: "sub-s-4",
        admissionNumber: "4401",
        name: "Aisha Minha",
        arabicName: "عائشة منها",
        gender: "Female",
        dob: "2015-05-12",
        fatherName: "Rasheed",
        phone: "9447334455",
        address: "Perinthalmanna, Malappuram",
        classLevel: "Class 5",
        division: "B",
        shift: "Shift 1"
      },
      {
        id: "sub-s-5",
        admissionNumber: "4402",
        name: "Ibrahim Kutty",
        arabicName: "إبراهيم كتي",
        gender: "Male",
        dob: "2014-11-22",
        fatherName: "Saidu",
        phone: "9447334455",
        address: "Perinthalmanna, Malappuram",
        classLevel: "Class 6",
        division: "A",
        shift: "Shift 2"
      }
    ]
  }
];

function loadSubmissions(): any[] {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, "utf8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(seedSubmissions, null, 2), "utf8");
      return seedSubmissions;
    }
  } catch (err) {
    console.error("Error loading submissions:", err);
    return seedSubmissions;
  }
}

function saveSubmissions(subs: any[]) {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(subs, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving submissions:", err);
  }
}

// Get all submissions
app.get("/api/submissions", (req, res) => {
  const subs = loadSubmissions();
  res.json({ submissions: subs });
});

// Add a new submission / lead from public portal or registration
app.post("/api/submissions", (req, res) => {
  const { id, name, regNo, place, phone, email, students, hasExcel } = req.body;
  if (!name || !phone) {
    res.status(400).json({ error: "Name and Phone are required." });
    return;
  }

  const subs = loadSubmissions();
  // Check if exists by id, or matching name + phone
  const existingIdx = subs.findIndex(s => (id && s.id === id) || (s.phone === phone && s.name.toLowerCase() === name.toLowerCase()));
  if (existingIdx !== -1) {
    subs[existingIdx] = {
      ...subs[existingIdx],
      name,
      regNo: regNo || subs[existingIdx].regNo,
      place: place || subs[existingIdx].place,
      phone: phone || subs[existingIdx].phone,
      email: email || subs[existingIdx].email,
      students: Array.isArray(students) && students.length > 0 ? students : subs[existingIdx].students,
      updatedAt: new Date().toISOString()
    };
    saveSubmissions(subs);
    res.json({ success: true, submission: subs[existingIdx] });
    return;
  }

  const newSub = {
    id: id || "sub-" + Date.now(),
    name,
    regNo: regNo || "REG-2026",
    place: place || "Kerala",
    phone,
    email: email || "",
    submittedAt: new Date().toISOString(),
    hasExcel: !!hasExcel,
    students: Array.isArray(students) ? students : []
  };

  subs.unshift(newSub);
  saveSubmissions(subs);
  res.json({ success: true, submission: newSub });
});

// Update submission details by SuperAdmin
app.put("/api/submissions/:id", (req, res) => {
  const { id } = req.params;
  const { name, regNo, place, phone, students } = req.body;
  
  let subs = loadSubmissions();
  const subIndex = subs.findIndex(s => s.id === id);
  if (subIndex !== -1) {
    if (name) subs[subIndex].name = name;
    if (regNo !== undefined) subs[subIndex].regNo = regNo;
    if (place !== undefined) subs[subIndex].place = place;
    if (phone !== undefined) subs[subIndex].phone = phone;
    if (Array.isArray(students)) subs[subIndex].students = students;

    saveSubmissions(subs);
    res.json({ success: true, submission: subs[subIndex] });
    return;
  }

  // Also check and update tracked users if not in submissions
  let tracked = loadTrackedUsers();
  const trackIdx = tracked.findIndex(u => u.id === id);
  if (trackIdx !== -1) {
    if (name) tracked[trackIdx].name = name;
    if (regNo !== undefined) tracked[trackIdx].regNo = regNo;
    if (place !== undefined) tracked[trackIdx].place = place;
    if (phone !== undefined) tracked[trackIdx].phone = phone;
    saveTrackedUsers(tracked);
    res.json({ success: true, submission: tracked[trackIdx] });
    return;
  }

  res.status(404).json({ error: "Madrasa record not found." });
});

// Delete a submission
app.delete("/api/submissions/:id", (req, res) => {
  const { id } = req.params;
  let subs = loadSubmissions();
  const exists = subs.some(s => s.id === id);
  if (!exists) {
    res.status(404).json({ error: "Submission not found." });
    return;
  }

  subs = subs.filter(s => s.id !== id);
  saveSubmissions(subs);
  res.json({ success: true });
});

// Permanent delete user & data by SuperAdmin
app.delete("/api/admin/delete-user/:id", (req, res) => {
  try {
    const adminEmail = (req.headers["x-admin-email"] as string) || (req.body?.adminEmail as string) || (req.query?.adminEmail as string);
    if (!isAuthorizedAdminOrAccounts(adminEmail)) {
      res.status(403).json({ error: "Unauthorized: SuperAdmin authorization required." });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Missing user ID" });
      return;
    }

    // 1. Delete from tracked users
    let tracked = loadTrackedUsers();
    tracked = tracked.filter(u => u.id !== id);
    saveTrackedUsers(tracked);

    // 2. Delete from submissions
    let subs = loadSubmissions();
    subs = subs.filter(s => s.id !== id);
    saveSubmissions(subs);

    // 3. Clean from licenses map if present
    const map = loadLicensesMap();
    if (map[id]) {
      delete map[id];
      saveLicensesMap(map);
    }

    res.json({ success: true, message: "User deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- USER ACTIVITY TRACKING & MARKETING CRM INFRASTRUCTURE ---
const USERS_ACTIVITY_FILE = path.join(process.cwd(), "users_activity.json");

interface TrackedUser {
  id: string;
  name: string;
  phone: string;
  regNo: string;
  place: string;
  email?: string;
  studentCount: number;
  hallCount: number;
  lastActiveAt: string;
  firstSeenAt: string;
  lastAction: string;
  totalActionsCount: number;
  hasOrder: boolean;
  notes?: string;
}

function loadTrackedUsers(): TrackedUser[] {
  try {
    if (fs.existsSync(USERS_ACTIVITY_FILE)) {
      const data = fs.readFileSync(USERS_ACTIVITY_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading users_activity.json:", e);
  }
  return [];
}

function saveTrackedUsers(users: TrackedUser[]) {
  try {
    fs.writeFileSync(USERS_ACTIVITY_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing users_activity.json:", e);
  }
}

// Track / update user activity timestamp and details
app.post("/api/track-activity", (req, res) => {
  try {
    const {
      id,
      name,
      madrasaName,
      phone,
      regNo,
      place,
      email,
      studentCount,
      hallCount,
      action
    } = req.body;

    const actualName = (name || madrasaName || "").trim();
    const actualPhone = (phone || "").trim();

    // If neither name nor phone is present, ignore
    if (!actualName && !actualPhone) {
      res.json({ success: true, ignored: true });
      return;
    }

    const cleanPhone = actualPhone.replace(/[^0-9]/g, "");
    let users = loadTrackedUsers();
    const nowIso = new Date().toISOString();

    // Find existing user by ID, phone, or name+place
    let userIndex = -1;
    if (id) {
      userIndex = users.findIndex(u => u.id === id);
    }
    if (userIndex === -1 && cleanPhone.length >= 7) {
      userIndex = users.findIndex(u => u.phone && u.phone.replace(/[^0-9]/g, "").includes(cleanPhone.slice(-10)));
    }
    if (userIndex === -1 && actualName) {
      userIndex = users.findIndex(u => u.name.toLowerCase() === actualName.toLowerCase() && (!place || u.place.toLowerCase() === (place || "").toLowerCase()));
    }

    if (userIndex !== -1) {
      const existing = users[userIndex];
      users[userIndex] = {
        ...existing,
        name: actualName || existing.name,
        phone: actualPhone || existing.phone,
        regNo: regNo || existing.regNo,
        place: place || existing.place,
        email: email || existing.email,
        studentCount: typeof studentCount === "number" ? studentCount : existing.studentCount,
        hallCount: typeof hallCount === "number" ? hallCount : existing.hallCount,
        lastActiveAt: nowIso,
        lastAction: action || existing.lastAction || "App Activity",
        totalActionsCount: (existing.totalActionsCount || 0) + 1
      };
    } else {
      const newUser: TrackedUser = {
        id: id || "user-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: actualName || "Madrasa User",
        phone: actualPhone,
        regNo: regNo || "",
        place: place || "",
        email: email || "",
        studentCount: typeof studentCount === "number" ? studentCount : 0,
        hallCount: typeof hallCount === "number" ? hallCount : 0,
        lastActiveAt: nowIso,
        firstSeenAt: nowIso,
        lastAction: action || "Initial Access",
        totalActionsCount: 1,
        hasOrder: false
      };
      users.unshift(newUser);
    }

    saveTrackedUsers(users);

    // Also sync to submissions if name and phone exist
    if (actualName && actualPhone) {
      const subs = loadSubmissions();
      const existingSubIdx = subs.findIndex(s => s.phone && s.phone.replace(/[^0-9]/g, "").includes(cleanPhone.slice(-10)));
      if (existingSubIdx === -1) {
        subs.unshift({
          id: "sub-auto-" + Date.now(),
          name: actualName,
          regNo: regNo || "REG-2026",
          place: place || "Kerala",
          phone: actualPhone,
          email: email || "",
          submittedAt: nowIso,
          hasExcel: false,
          students: []
        });
        saveSubmissions(subs);
      }
    }

    res.json({ success: true, message: "Activity logged successfully." });
  } catch (err: any) {
    console.error("Error in /api/track-activity:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Comprehensive CRM Users Directory for SuperAdmin
app.get("/api/crm-users", (req, res) => {
  try {
    const trackedUsers = loadTrackedUsers();
    const subs = loadSubmissions();
    const orders = loadOrders();

    // Build unified map keyed by normalized phone or name
    const unifiedMap = new Map<string, any>();

    // 1. Ingest tracked users
    trackedUsers.forEach(u => {
      const key = (u.phone ? u.phone.replace(/[^0-9]/g, "").slice(-10) : "") || u.name.toLowerCase();
      unifiedMap.set(key, {
        id: u.id,
        name: u.name,
        phone: u.phone,
        regNo: u.regNo,
        place: u.place,
        email: u.email,
        studentCount: u.studentCount || 0,
        hallCount: u.hallCount || 0,
        lastActiveAt: u.lastActiveAt,
        firstSeenAt: u.firstSeenAt,
        lastAction: u.lastAction,
        totalActionsCount: u.totalActionsCount || 1,
        ordersCount: 0,
        source: "App User Activity",
        notes: u.notes || ""
      });
    });

    // 2. Ingest submissions
    subs.forEach(s => {
      const key = (s.phone ? s.phone.replace(/[^0-9]/g, "").slice(-10) : "") || s.name.toLowerCase();
      const existing = unifiedMap.get(key);
      if (existing) {
        existing.studentCount = Math.max(existing.studentCount, s.students?.length || 0);
        existing.regNo = existing.regNo || s.regNo;
        existing.place = existing.place || s.place;
        existing.source = "Registered Submission";
        if (Array.isArray(s.students) && s.students.length > 0) {
          existing.students = s.students;
        }
      } else {
        unifiedMap.set(key, {
          id: s.id,
          name: s.name,
          phone: s.phone,
          regNo: s.regNo,
          place: s.place,
          email: s.email,
          studentCount: s.students?.length || 0,
          hallCount: 0,
          students: s.students || [],
          lastActiveAt: (s as any).updatedAt || s.submittedAt || new Date().toISOString(),
          firstSeenAt: s.submittedAt || new Date().toISOString(),
          lastAction: "Submitted Excel / Students",
          totalActionsCount: 1,
          ordersCount: 0,
          source: "Portal Submission",
          notes: ""
        });
      }
    });

    // Ingest cloud backups to enrich students data if available
    try {
      if (fs.existsSync(CLOUD_BACKUPS_FILE)) {
        const backups: any[] = JSON.parse(fs.readFileSync(CLOUD_BACKUPS_FILE, "utf-8"));
        backups.forEach(b => {
          if (!b.phone) return;
          const key = b.phone.replace(/[^0-9]/g, "").slice(-10);
          const existing = unifiedMap.get(key);
          if (existing) {
            if (b.payload?.students?.length) {
              existing.students = b.payload.students;
              existing.studentCount = Math.max(existing.studentCount, b.payload.students.length);
            }
            if (b.payload?.halls?.length) {
              existing.hallCount = Math.max(existing.hallCount, b.payload.halls.length);
            }
          }
        });
      }
    } catch (e) {}

    // 3. Link orders
    orders.forEach(o => {
      const key = (o.phone ? o.phone.replace(/[^0-9]/g, "").slice(-10) : "") || (o.madrasaName || "").toLowerCase();
      const existing = unifiedMap.get(key);
      if (existing) {
        existing.ordersCount = (existing.ordersCount || 0) + 1;
        existing.studentCount = Math.max(existing.studentCount, o.studentCount || 0);
        existing.lastAction = `Placed Order #${o.orderId}`;
      } else {
        unifiedMap.set(key, {
          id: "order-user-" + o.id,
          name: o.madrasaName || "Order Customer",
          phone: o.phone,
          regNo: o.regNo || "",
          place: o.place || "",
          email: o.email || "",
          studentCount: o.studentCount || 0,
          hallCount: 0,
          lastActiveAt: o.createdAt || new Date().toISOString(),
          firstSeenAt: o.createdAt || new Date().toISOString(),
          lastAction: `Placed Order #${o.orderId}`,
          totalActionsCount: 1,
          ordersCount: 1,
          source: "Courier Order",
          notes: ""
        });
      }
    });

    const userList = Array.from(unifiedMap.values());
    // Sort by lastActiveAt descending
    userList.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());

    res.json({ users: userList });
  } catch (err: any) {
    console.error("Error in /api/crm-users:", err);
    res.status(500).json({ error: err.message || "Failed to load CRM users" });
  }
});

// Update notes or details for a CRM user
app.patch("/api/crm-users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { notes, phone, name, place } = req.body;
    let users = loadTrackedUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      if (notes !== undefined) users[idx].notes = notes;
      if (phone !== undefined) users[idx].phone = phone;
      if (name !== undefined) users[idx].name = name;
      if (place !== undefined) users[idx].place = place;
      saveTrackedUsers(users);
      res.json({ success: true, user: users[idx] });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// CLOUD BACKUP & RESTORE BY PHONE (Prevent user data loss)
const CLOUD_BACKUPS_FILE = path.join(process.cwd(), "cloud_backups.json");

app.post("/api/cloud-backup", (req, res) => {
  try {
    const { phone, madrasaName, regNo, place, payload } = req.body;
    if (!phone || !payload) {
      res.status(400).json({ error: "Phone and backup payload are required." });
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    let backups: any[] = [];
    if (fs.existsSync(CLOUD_BACKUPS_FILE)) {
      try {
        backups = JSON.parse(fs.readFileSync(CLOUD_BACKUPS_FILE, "utf-8"));
      } catch (e) {}
    }

    const nowIso = new Date().toISOString();
    const existingIdx = backups.findIndex(b => b.phone && b.phone.replace(/[^0-9]/g, "").slice(-10) === cleanPhone.slice(-10));
    
    const record = {
      phone,
      madrasaName: madrasaName || "Madrasa",
      regNo: regNo || "",
      place: place || "",
      payload,
      updatedAt: nowIso
    };

    if (existingIdx !== -1) {
      backups[existingIdx] = record;
    } else {
      backups.unshift(record);
    }

    fs.writeFileSync(CLOUD_BACKUPS_FILE, JSON.stringify(backups, null, 2), "utf-8");
    res.json({ success: true, message: "Backup saved to Cloud successfully.", updatedAt: nowIso });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cloud-backup/:phone", (req, res) => {
  try {
    const cleanPhone = req.params.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      res.status(400).json({ error: "Invalid phone number." });
      return;
    }

    let backups: any[] = [];
    if (fs.existsSync(CLOUD_BACKUPS_FILE)) {
      try {
        backups = JSON.parse(fs.readFileSync(CLOUD_BACKUPS_FILE, "utf-8"));
      } catch (e) {}
    }

    const found = backups.find(b => b.phone && b.phone.replace(/[^0-9]/g, "").slice(-10) === cleanPhone.slice(-10));
    if (found) {
      res.json({ success: true, backup: found });
    } else {
      res.status(404).json({ error: "No cloud backup found for this WhatsApp phone number." });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// System Configuration API (Dual-sync with Firestore & Server Persistence)
app.get("/api/system-config", (req, res) => {
  try {
    if (fs.existsSync(SYSTEM_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_FILE, "utf-8"));
      res.json({ success: true, config: data });
    } else {
      res.json({ success: true, config: null });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/system-config", (req, res) => {
  try {
    const config = req.body;
    if (!config || typeof config !== "object") {
      res.status(400).json({ error: "Invalid configuration payload" });
      return;
    }
    const updated = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(SYSTEM_CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Class Subject Directory API (Dual-sync with Server File & Cloud Firestore)
app.get("/api/subject-directory", (req, res) => {
  try {
    if (fs.existsSync(SUBJECT_DIRECTORY_FILE)) {
      const data = fs.readFileSync(SUBJECT_DIRECTORY_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return res.json({ success: true, directory: parsed });
    }
    return res.json({ success: true, directory: null });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/subject-directory", (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory || typeof directory !== "object") {
      return res.status(400).json({ error: "Invalid directory data" });
    }
    fs.writeFileSync(SUBJECT_DIRECTORY_FILE, JSON.stringify(directory, null, 2), "utf-8");
    return res.json({ success: true, directory });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Madrasa Print Licenses API (Dual-sync with Server & Cloud Firestore)
const MADRASA_LICENSES_FILE = path.join(process.cwd(), "madrasa_licenses.json");
let licensesMemoryCache: Record<string, any> | null = null;

function loadLicensesMap(): Record<string, any> {
  if (licensesMemoryCache) return licensesMemoryCache;
  try {
    if (fs.existsSync(MADRASA_LICENSES_FILE)) {
      licensesMemoryCache = JSON.parse(fs.readFileSync(MADRASA_LICENSES_FILE, "utf-8"));
      return licensesMemoryCache || {};
    }
  } catch (e) {}
  licensesMemoryCache = {};
  return licensesMemoryCache;
}

function saveLicensesMap(map: Record<string, any>) {
  licensesMemoryCache = map;
  try {
    fs.writeFileSync(MADRASA_LICENSES_FILE, JSON.stringify(map, null, 2), "utf-8");
  } catch (e) {}
}

app.get("/api/licenses", (req, res) => {
  try {
    const map = loadLicensesMap();
    res.json({ success: true, licenses: map });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Single Madrasa License Verification Endpoint (Authoritative Server Check with Multi-Key Lookup)
app.get("/api/licenses/verify/:key", (req, res) => {
  try {
    const rawKey = req.params.key;
    const cleanKey = decodeURIComponent(rawKey || "").trim();
    if (!cleanKey) {
      res.json({ success: true, isPaid: false });
      return;
    }
    const map = loadLicensesMap();
    let lic = map[cleanKey];

    if (!lic) {
      const cleanPhone = cleanKey.replace(/\D/g, "");
      const p10 = cleanPhone.slice(-10);
      if (p10.length === 10) {
        lic = map[p10] || map[`91${p10}`];
      }
    }

    if (!lic) {
      lic = Object.values(map).find((item: any) => {
        if (!item) return false;
        if (item.regNo && item.regNo.trim().toLowerCase() === cleanKey.toLowerCase()) return true;
        if (item.madrasaName && item.madrasaName.trim().toLowerCase() === cleanKey.toLowerCase()) return true;
        if (item.phone) {
          const itemP = String(item.phone).replace(/\D/g, "").slice(-10);
          const reqP = cleanKey.replace(/\D/g, "").slice(-10);
          if (itemP && reqP && itemP.length === 10 && itemP === reqP) return true;
        }
        return false;
      });
    }

    if (!lic) {
      res.json({ success: true, isPaid: false });
      return;
    }
    const isPaid = lic.status === "paid" && (!lic.expiresAt || new Date(lic.expiresAt).getTime() > Date.now());
    res.json({ success: true, isPaid, license: lic });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/licenses", (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "Invalid license payload" });
      return;
    }

    const adminEmail = (req.headers["x-admin-email"] as string) || payload?.activatedBy || payload?.adminEmail;
    if (!isAuthorizedAdminOrAccounts(adminEmail)) {
      res.status(403).json({ error: "Unauthorized: Only SuperAdmin or Accounts Team can modify licenses." });
      return;
    }

    const current = loadLicensesMap();
    let updated = { ...current };
    
    if (payload.madrasaId || payload.regNo || payload.madrasaName || payload.phone) {
      const key = payload.madrasaId || payload.regNo || payload.madrasaName || payload.phone;
      const licObj = {
        ...payload,
        updatedAt: new Date().toISOString()
      };
      updated[key] = licObj;
      if (payload.regNo) updated[payload.regNo] = licObj;
      if (payload.madrasaName) updated[payload.madrasaName] = licObj;
      if (payload.phone) {
        const cleanPhone = String(payload.phone).replace(/\D/g, "");
        const p10 = cleanPhone.slice(-10);
        if (p10.length === 10) {
          updated[p10] = licObj;
          updated[`91${p10}`] = licObj;
        }
      }
    } else {
      updated = { ...current, ...payload };
    }
    
    saveLicensesMap(updated);
    res.json({ success: true, licenses: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/licenses/activate", (req, res) => {
  try {
    const { key, madrasaName, regNo, phone, durationMonths, amountPaid, activatedBy, notes } = req.body || {};
    if (!key && !regNo && !madrasaName && !phone) {
      res.status(400).json({ error: "Missing madrasa key or identity" });
      return;
    }

    const adminEmail = (req.headers["x-admin-email"] as string) || activatedBy || req.body?.adminEmail;
    if (!isAuthorizedAdminOrAccounts(adminEmail)) {
      res.status(403).json({ error: "Unauthorized: Only SuperAdmin or Accounts Team can activate licenses." });
      return;
    }

    const primaryKey = key || regNo || madrasaName || phone;
    const current = loadLicensesMap();
    const months = Number(durationMonths) || 12;
    const expiresAt = new Date(Date.now() + months * 30 * 24 * 3600 * 1000).toISOString();
    
    const licenseObj = {
      madrasaId: primaryKey,
      madrasaName: madrasaName || primaryKey,
      regNo: regNo || "",
      phone: phone || "",
      status: "paid",
      plan: "bundle",
      durationMonths: months,
      amountPaid: amountPaid ?? 149,
      activatedAt: new Date().toISOString(),
      expiresAt,
      activatedBy: adminEmail,
      notes: notes || "Activated via WhatsApp payment verification"
    };

    current[primaryKey] = licenseObj;
    if (regNo) current[regNo] = licenseObj;
    if (madrasaName) current[madrasaName] = licenseObj;
    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      const p10 = cleanPhone.slice(-10);
      if (p10.length === 10) {
        current[p10] = licenseObj;
        current[`91${p10}`] = licenseObj;
      }
    }

    saveLicensesMap(current);
    res.json({ success: true, license: licenseObj });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Published Exam Results & Tarbiyah Cycles Server Cache (Zero-Cost Free-Tier Optimizer)
const PUBLISHED_RESULTS_FILE = path.join(process.cwd(), "published_results.json");
const TARBIYAH_CYCLES_FILE = path.join(process.cwd(), "tarbiyah_cycles.json");

let resultsMemoryCache: Record<string, any> | null = null;
let tarbiyahMemoryCache: Record<string, any> | null = null;

function loadPublishedResultsMap(): Record<string, any> {
  if (resultsMemoryCache) return resultsMemoryCache;
  try {
    if (fs.existsSync(PUBLISHED_RESULTS_FILE)) {
      resultsMemoryCache = JSON.parse(fs.readFileSync(PUBLISHED_RESULTS_FILE, "utf-8"));
      return resultsMemoryCache || {};
    }
  } catch (e) {}
  resultsMemoryCache = {};
  return resultsMemoryCache;
}

function savePublishedResultsMap(map: Record<string, any>) {
  resultsMemoryCache = map;
  try {
    fs.writeFileSync(PUBLISHED_RESULTS_FILE, JSON.stringify(map, null, 2), "utf-8");
  } catch (e) {}
}

function loadTarbiyahCyclesMap(): Record<string, any> {
  if (tarbiyahMemoryCache) return tarbiyahMemoryCache;
  try {
    if (fs.existsSync(TARBIYAH_CYCLES_FILE)) {
      tarbiyahMemoryCache = JSON.parse(fs.readFileSync(TARBIYAH_CYCLES_FILE, "utf-8"));
      return tarbiyahMemoryCache || {};
    }
  } catch (e) {}
  tarbiyahMemoryCache = {};
  return tarbiyahMemoryCache;
}

function saveTarbiyahCyclesMap(map: Record<string, any>) {
  tarbiyahMemoryCache = map;
  try {
    fs.writeFileSync(TARBIYAH_CYCLES_FILE, JSON.stringify(map, null, 2), "utf-8");
  } catch (e) {}
}

app.get("/api/results/:madrasaId", (req, res) => {
  try {
    const { madrasaId } = req.params;
    const map = loadPublishedResultsMap();
    if (map[madrasaId]) {
      res.json({ success: true, data: map[madrasaId] });
    } else {
      res.status(404).json({ success: false, error: "Not cached on server" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/results/:madrasaId", (req, res) => {
  try {
    const { madrasaId } = req.params;
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "Invalid result payload" });
      return;
    }
    const map = loadPublishedResultsMap();
    map[madrasaId] = payload;
    savePublishedResultsMap(map);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/tarbiyah/:madrasaId", (req, res) => {
  try {
    const { madrasaId } = req.params;
    const map = loadTarbiyahCyclesMap();
    if (map[madrasaId]) {
      res.json({ success: true, data: map[madrasaId] });
    } else {
      res.status(404).json({ success: false, error: "Not cached on server" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tarbiyah/:madrasaId", (req, res) => {
  try {
    const { madrasaId } = req.params;
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      res.status(400).json({ error: "Invalid tarbiyah payload" });
      return;
    }
    const map = loadTarbiyahCyclesMap();
    map[madrasaId] = payload;
    saveTarbiyahCyclesMap(map);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// QR CODE INSTANT CROSS-DEVICE LOGIN (WHATSAPP WEB MODEL)
// ==========================================
interface QRLoginSession {
  code: string;
  shortCode: string;
  status: "pending" | "authorized" | "expired";
  createdAt: number;
  sessionData?: any;
}
const qrLoginSessions: Record<string, QRLoginSession> = {};
const shortCodeMap: Record<string, string> = {}; // maps shortCode -> long code

// 1. Generate new QR session code (for laptop/browser)
app.post("/api/auth/qr-session", (req, res) => {
  try {
    const code = "qr_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    const shortCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit
    
    qrLoginSessions[code] = {
      code,
      shortCode,
      status: "pending",
      createdAt: Date.now()
    };
    shortCodeMap[shortCode] = code;
    
    // Cleanup old sessions > 10 mins
    const cutoff = Date.now() - 10 * 60 * 1000;
    Object.keys(qrLoginSessions).forEach(k => {
      if (qrLoginSessions[k].createdAt < cutoff) {
        delete shortCodeMap[qrLoginSessions[k].shortCode];
        delete qrLoginSessions[k];
      }
    });
    res.json({ success: true, code, shortCode });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Poll QR session status from desktop
app.get("/api/auth/qr-status/:code", (req, res) => {
  try {
    const { code } = req.params;
    const session = qrLoginSessions[code];
    if (!session) {
      res.json({ success: false, status: "expired" });
      return;
    }
    if (Date.now() - session.createdAt > 5 * 60 * 1000) {
      session.status = "expired";
      delete shortCodeMap[session.shortCode];
      res.json({ success: true, status: "expired" });
      return;
    }
    if (session.status === "authorized") {
      const data = session.sessionData;
      // Single-use: delete after returning
      delete shortCodeMap[session.shortCode];
      delete qrLoginSessions[code];
      res.json({ success: true, status: "authorized", sessionData: data });
      return;
    }
    res.json({ success: true, status: "pending" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Authorize QR code from mobile device
app.post("/api/auth/qr-authorize", (req, res) => {
  try {
    const { code, session, profile } = req.body || {};
    
    // Handle both long code or short code
    const actualCode = shortCodeMap[code] || code;

    if (!actualCode || !session) {
      res.status(400).json({ error: "Missing QR code or session" });
      return;
    }
    const qrSession = qrLoginSessions[actualCode];
    if (!qrSession || qrSession.status === "expired" || Date.now() - qrSession.createdAt > 5 * 60 * 1000) {
      res.status(400).json({ error: "QR Code has expired. Please refresh the QR code on your computer." });
      return;
    }
    qrSession.status = "authorized";
    qrSession.sessionData = { session, profile };
    res.json({ success: true, message: "Authorized successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite integration
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Retrying in 1s...`);
      setTimeout(() => {
        try {
          httpServer.close();
        } catch (_) {}
        httpServer.listen(PORT, "0.0.0.0");
      }, 1000);
    } else {
      console.error("HTTP server error:", err);
    }
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  const cleanup = () => {
    try {
      httpServer.close(() => {
        process.exit(0);
      });
    } catch (_) {
      process.exit(0);
    }
  };
  process.on("SIGTERM", cleanup);
  process.on("SIGINT", cleanup);
}

startServer();
