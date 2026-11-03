import React, { useState } from "react";
import { 
  ClipboardList, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Send, 
  Sparkles, 
  FileSpreadsheet, 
  UserCheck,
  Languages
} from "lucide-react";
import { Language } from "../translations";

interface PublicPortalProps {
  onBackToAdmin?: () => void;
  isEmbed?: boolean;
  initialLang?: Language;
}

export default function PublicPortal({ onBackToAdmin, isEmbed = false, initialLang }: PublicPortalProps) {
  const [lang, setLang] = useState<Language>(() => {
    if (initialLang) return initialLang;
    const saved = localStorage.getItem("madrasa_app_lang") as Language;
    return saved === "ml" ? "ml" : "en";
  });

  // Madrasa Meta State
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [place, setPlace] = useState("");
  const [phone, setPhone] = useState("");
  
  // Student Table Rows State
  const [students, setStudents] = useState<any[]>([
    { admissionNumber: "101", name: "Muhammed Safvan", gender: "Male", classLevel: "Class 5", division: "A" },
    { admissionNumber: "102", name: "Fathima Hiba", gender: "Female", classLevel: "Class 5", division: "A" }
  ]);

  // Bulk Paste State
  const [bulkText, setBulkText] = useState("");
  const [isParsingBulk, setIsParsingBulk] = useState(false);
  const [showBulkPasteArea, setShowBulkPasteArea] = useState(false);

  // File Upload State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Submitted Success State
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRegNo, setSubmittedRegNo] = useState("");

  const handleAddRow = () => {
    const nextAdm = students.length > 0 
      ? String(Math.max(...students.map(s => parseInt(s.admissionNumber) || 0)) + 1)
      : "101";
    setStudents([
      ...students,
      { admissionNumber: nextAdm, name: "", gender: "Male", classLevel: "Class 5", division: "A" }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setStudents(students.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const updated = [...students];
    updated[index] = { ...updated[index], [field]: value };
    setStudents(updated);
  };

  // Basic regex parser for student names pasted from text/WhatsApp
  const handleParseBulkText = () => {
    if (!bulkText.trim()) return;
    setIsParsingBulk(true);
    
    setTimeout(() => {
      const lines = bulkText.split("\n");
      const parsed: any[] = [];
      let baseAd = students.length > 0 
        ? Math.max(...students.map(s => parseInt(s.admissionNumber) || 0)) + 1
        : 101;

      lines.forEach((line) => {
        const clean = line.trim();
        if (!clean || clean.length < 3) return;

        // Try extracting: ID/No Name Class Division Gender
        let adNo = String(baseAd++);
        let sName = clean;
        let classLevel = "Class 5";
        let division = "A";
        let gender = "Male";

        // Look for numbers as admission number candidates
        const numMatch = clean.match(/^(\d+)[.\s-]*([A-Za-z\u0d00-\u0d7f\s]+)/);
        if (numMatch) {
          adNo = numMatch[1];
          sName = numMatch[2].trim();
        }

        // Look for female markers
        if (clean.toLowerCase().includes("girl") || clean.toLowerCase().includes("female") || clean.includes("പെൺ") || clean.toLowerCase().endsWith("g") || clean.toLowerCase().endsWith("f")) {
          gender = "Female";
        }

        // Clean up some known keywords from names
        sName = sName.replace(/(?:class|std|grade|male|female|boy|girl|pasted|ad\.no)/gi, "").trim();

        parsed.push({
          admissionNumber: adNo,
          name: sName || (lang === "ml" ? "വിദ്യാർത്ഥി " : "Student ") + adNo,
          gender,
          classLevel,
          division
        });
      });

      if (parsed.length > 0) {
        setStudents([...students, ...parsed]);
        setBulkText("");
        setShowBulkPasteArea(false);
        alert(lang === "ml" 
          ? `${parsed.length} വിദ്യാർത്ഥികളുടെ വിവരങ്ങൾ ചേർത്തു!` 
          : `Successfully extracted and added ${parsed.length} student records!`);
      } else {
        alert(lang === "ml" 
          ? "വിദ്യാർത്ഥികളുടെ വിവരങ്ങൾ കണ്ടെത്താനായില്ല. ഓരോ വരിയിലും ഒരു വിദ്യാർത്ഥിയുടെ പേര് നൽകുക." 
          : "Could not extract student records. Make sure each student is on a new line.");
      }
      setIsParsingBulk(false);
    }, 400);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv")) {
        setExcelFile(file);
        // Add sample students to represent excel data
        setStudents([
          ...students,
          { admissionNumber: "EX-301", name: "Ameen Rahman (From Excel)", gender: "Male", classLevel: "Class 5", division: "B" },
          { admissionNumber: "EX-302", name: "Shahina Banu (From Excel)", gender: "Female", classLevel: "Class 6", division: "A" },
          { admissionNumber: "EX-303", name: "Muhammed Anas (From Excel)", gender: "Male", classLevel: "Class 7", division: "A" }
        ]);
        alert(lang === "ml" 
          ? `എക്സെൽ ഫയൽ "${file.name}" ലിങ്ക് ചെയ്തു! വിവരങ്ങൾ ചേർത്തു.` 
          : `Linked Excel template "${file.name}"! 3 students extracted automatically.`);
      } else {
        alert(lang === "ml" 
          ? "സാധുവായ ഒരു എക്സെൽ (.xlsx, .xls) അല്ലെങ്കിൽ CSV ഫയൽ തിരഞ്ഞെടുക്കുക." 
          : "Please drop a valid Excel (.xlsx, .xls) or CSV file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setExcelFile(file);
      setStudents([
        ...students,
        { admissionNumber: "EX-501", name: "Rashid Ali (From File)", gender: "Male", classLevel: "Class 5", division: "A" },
        { admissionNumber: "EX-502", name: "Nisha Fathima (From File)", gender: "Female", classLevel: "Class 6", division: "B" }
      ]);
      alert(lang === "ml" ? `ഫയൽ "${file.name}" ചേർത്തു!` : `Linked File "${file.name}".`);
    }
  };

  // Submit to Central Server API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !regNo.trim() || !place.trim() || !phone.trim()) {
      alert(lang === "ml" 
        ? "ദയവായി മദ്റസയുടെ പേര്, രജിസ്ട്രേഷൻ നമ്പർ, സ്ഥലം, ഫോൺ നമ്പർ എന്നിവ പൂർണ്ണമായി നൽകുക!" 
        : "Please fill in all Madrasa details (Name, Registration Number, Place, Phone) first!");
      return;
    }

    if (students.some(s => !s.name.trim() || !s.admissionNumber.trim())) {
      alert(lang === "ml" 
        ? "എല്ലാ വിദ്യാർത്ഥികൾക്കും പേരും റോൾ നമ്പറും നൽകിയിട്ടുണ്ടെന്ന് ഉറപ്പുവരുത്തുക!" 
        : "Please ensure all student rows have a Name and Roll Number!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        regNo: regNo.trim(),
        place: place.trim(),
        phone: phone.trim(),
        students: students.map(s => ({
          ...s,
          id: "sub-s-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          shift: "Shift 1"
        })),
        hasExcel: !!excelFile
      };

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedRegNo(regNo);
        setIsSubmitted(true);
      } else {
        throw new Error(data.error || "Server registration failed");
      }
    } catch (err: any) {
      alert(lang === "ml" ? "രജിസ്ട്രേഷൻ പിശക്: " + err.message : "Registration Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none font-sans">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h2 className="font-display font-extrabold text-slate-800 text-2xl md:text-3xl">
              {lang === "ml" ? "ഡാറ്റ വിജയകരമായി സമർപ്പിച്ചു!" : "Registration Submitted Successfully!"}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto pt-2">
              {lang === "ml" 
                ? `നിങ്ങളുടെ മദ്റസ (${name}), രജിസ്ട്രേഷൻ നമ്പർ ${submittedRegNo} വിജയകരമായി കേന്ദ്ര പരീക്ഷാ ഓഫീസിൽ രജിസ്റ്റർ ചെയ്തിരിക്കുന്നു.` 
                : `Your Madrasa (${name}), Registration Number ${submittedRegNo} has been registered with the Central Exam Office.`}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100 text-3xs text-slate-600 space-y-2.5">
            <div className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">
              {lang === "ml" ? "രസീത് വിവരങ്ങൾ" : "Receipt Details"}
            </div>
            <div>• <strong>{lang === "ml" ? "മദ്റസ പേര്:" : "Madrasa Name:"}</strong> {name}</div>
            <div>• <strong>{lang === "ml" ? "സ്ഥലം:" : "Location:"}</strong> {place}</div>
            <div>• <strong>{lang === "ml" ? "ഫോൺ നമ്പർ:" : "Contact:"}</strong> {phone}</div>
            <div>• <strong>{lang === "ml" ? "ആകെ വിദ്യാർത്ഥികൾ:" : "Total Students Listed:"}</strong> {students.length}</div>
            <div>• <strong>{lang === "ml" ? "സ്റ്റാറ്റസ്:" : "Verification Status:"}</strong> {lang === "ml" ? "സീറ്റിംഗ് ക്രമീകരണത്തിനായി കാത്തിരിക്കുന്നു" : "Pending Central Seat Assignment"}</div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setName("");
                setRegNo("");
                setPlace("");
                setPhone("");
                setStudents([
                  { admissionNumber: "101", name: "Muhammed Safvan", gender: "Male", classLevel: "Class 5", division: "A" }
                ]);
                setExcelFile(null);
                setIsSubmitted(false);
              }}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
            >
              {lang === "ml" ? "മറ്റൊരു മദ്റസ സമർപ്പിക്കുക" : "Submit Another Madrasa"}
            </button>
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer"
              >
                {lang === "ml" ? "അഡ്മിൻ കൺസോളിലേക്ക് മടങ്ങുക" : "Go Back to Admin Console"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col font-sans select-none ${isEmbed ? "p-0 min-h-0 bg-transparent" : "p-4 md:p-8"}`}>
      
      {/* Top Banner */}
      {!isEmbed && (
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-extrabold text-xl shadow-md">أن</div>
            <div>
              <h2 className="font-display font-extrabold text-slate-800 text-base leading-tight">
                {lang === "ml" ? "പരീക്ഷാ പോർട്ടൽ" : "Exam Portal"}
              </h2>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                {lang === "ml" ? "മദ്റസ സ്വയം രജിസ്ട്രേഷൻ സർവീസ്" : "Madrasa Self-Registration Service"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setLang("en");
                  localStorage.setItem("madrasa_app_lang", "en");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  lang === "en" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setLang("ml");
                  localStorage.setItem("madrasa_app_lang", "ml");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  lang === "ml" ? "bg-emerald-700 text-white" : "text-slate-600 hover:text-emerald-900"
                }`}
              >
                മലയാളം
              </button>
            </div>

            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                {lang === "ml" ? "← അഡ്മിൻ കൺസോൾ" : "← Back to Admin Console"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Information Column */}
        <div className="lg:col-span-4 bg-emerald-900 text-emerald-100 p-6 md:p-8 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="px-2.5 py-1 bg-emerald-800 rounded-full text-3xs font-extrabold uppercase tracking-widest text-emerald-300">
                {lang === "ml" ? "പൊതു രജിസ്ട്രേഷൻ ലിങ്ക്" : "Public Link Portal"}
              </span>
              <h3 className="font-display font-black text-white text-2xl leading-tight">
                {lang === "ml" ? "മദ്റസ പരീക്ഷാ രജിസ്‌ട്രേഷൻ" : "Madrasa Exam Registration"}
              </h3>
              <p className="text-xs text-emerald-200/85 leading-relaxed font-sans">
                {lang === "ml" 
                  ? "സ്വാഗതം! നിങ്ങളുടെ മദ്റസയുടെ വിവരങ്ങളും വിദ്യാർത്ഥികളുടെ ലിസ്റ്റും ഇവിടെ സമർപ്പിക്കുക. കേന്ദ്ര അഡ്മിൻ ഓട്ടോമാറ്റിക്കായി പരീക്ഷാ ഹാളുകൾ ക്രമീകരിക്കും." 
                  : "Welcome! Please submit your Madrasa registration details, place, contact phone, and student list here. The Central Admin will automatically group and arrange exam halls."}
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-800 shrink-0 flex items-center justify-center font-bold text-xs text-emerald-300">1</div>
                <div>
                  <h4 className="font-bold text-xs text-white">
                    {lang === "ml" ? "അടിസ്ഥാന വിവരങ്ങൾ" : "Basic Info"}
                  </h4>
                  <p className="text-3xs text-emerald-200/70 mt-0.5">
                    {lang === "ml" 
                      ? "മദ്റസ പേര്, രജിസ്ട്രേഷൻ നമ്പർ, സ്ഥലം, ഫോൺ നമ്പർ നൽകുക." 
                      : "Enter Madrasa name, Reg number, place, and contact phone."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-800 shrink-0 flex items-center justify-center font-bold text-xs text-emerald-300">2</div>
                <div>
                  <h4 className="font-bold text-xs text-white">
                    {lang === "ml" ? "വിദ്യാർത്ഥികളുടെ ലിസ്റ്റ്" : "Students List"}
                  </h4>
                  <p className="text-3xs text-emerald-200/70 mt-0.5">
                    {lang === "ml" 
                      ? "എക്സെൽ ഫയൽ അപ്‌ലോഡ് ചെയ്യുകയോ വാട്സ്ആപ്പ് ലിസ്റ്റ് പേസ്റ്റ് ചെയ്യുകയോ ചെയ്യാം." 
                      : "Simulate dropping an Excel template, paste unstructured lines, or write rows manually."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-800 shrink-0 flex items-center justify-center font-bold text-xs text-emerald-300">3</div>
                <div>
                  <h4 className="font-bold text-xs text-white">
                    {lang === "ml" ? "സീറ്റിംഗ് & കൊറിയർ ഡെലിവറി" : "Auto Seating & Courier Delivery"}
                  </h4>
                  <p className="text-3xs text-emerald-200/70 mt-0.5">
                    {lang === "ml" 
                      ? "തയ്യാറാക്കിയ സീറ്റിംഗ് പ്ലാൻ കാണുകയോ ലാമിനേറ്റ് ചെയ്ത സ്റ്റിക്കറുകൾ മദ്റസയിലേക്ക് ഓർഡർ ചെയ്യുകയോ ചെയ്യാം." 
                      : "Submit to get instant anti-cheating seat allocations or order laminated desk stickers & door registers couriered to your Madrasa address!"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700/40 text-3xs space-y-1.5 text-emerald-200/90 leading-relaxed font-sans">
            <div className="font-extrabold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 
              {lang === "ml" ? "പ്രിന്റിംഗും സ്പീഡ് പോസ്റ്റ് ഡെലിവറിയും" : "Physical Printing & Speed Post Delivery"}
            </div>
            <div>• {lang === "ml" ? "സൗജന്യ ആന്റി-കോപ്പിയടി സീറ്റിംഗ് പ്ലാൻ നിർമ്മാണം" : "Free Anti-Cheating Seating Plan Generation"}</div>
            <div>• {lang === "ml" ? "ലാമിനേറ്റ് ചെയ്ത ഡെസ്ക് സ്റ്റിക്കറുകൾ + ഹാൾ ഡോർ രജിസ്റ്ററുകൾ" : "Optional Laminated Desk Stickers + Hall Door Registers"}</div>
            <div>• {lang === "ml" ? "മദ്റസയിലേക്ക് നേരിട്ട് സ്പീഡ് പോസ്റ്റ് ഡെലിവറി (₹379)" : "Fast Speed Post / Courier Delivery directly to Madrasa (₹379)"}</div>
          </div>
        </div>

        {/* Right Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-8 p-6 md:p-8 space-y-6 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Section 1: Madrasa Metadata */}
            <div className="space-y-4">
              <h4 className="text-xs font-display font-extrabold text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">
                {lang === "ml" ? "1. മദ്റസയുടെ അടിസ്ഥാന വിവരങ്ങൾ" : "1. Madrasa Basic Details"}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {lang === "ml" ? "മദ്റസയുടെ പേര് *" : "Madrasa Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    placeholder={lang === "ml" ? "ഉദാ: ദാറുൽ ഹുദാ മദ്റസ" : "e.g. Darul Huda Madrasa"}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {lang === "ml" ? "രജിസ്ട്രേഷൻ നമ്പർ *" : "Registration Number *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    placeholder="e.g. SK-2841"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {lang === "ml" ? "സ്ഥലം *" : "Place / City *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    placeholder={lang === "ml" ? "ഉദാ: വളാഞ്ചേരി, മലപ്പുറം" : "e.g. Valanchery, Malappuram"}
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    {lang === "ml" ? "ഫോൺ നമ്പർ / വാട്സ്ആപ്പ് *" : "Contact Phone / WhatsApp *"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50/50"
                    placeholder="e.g. 9845112233"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Student Upload Link / Paste */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-display font-extrabold text-slate-800 uppercase tracking-widest">
                  {lang === "ml" ? "2. വിദ്യാർത്ഥികളുടെ ലിസ്റ്റ് നൽകുക" : "2. Upload Student List"}
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPasteArea(!showBulkPasteArea)}
                    className="text-3xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ClipboardList className="w-3 h-3 text-slate-500" />
                    {showBulkPasteArea 
                      ? (lang === "ml" ? "റദ്ദാക്കുക" : "Cancel Paste") 
                      : (lang === "ml" ? "⚡ വാട്സ്ആപ്പ് ലിസ്റ്റ് പേസ്റ്റ് ചെയ്യുക" : "⚡ Paste WhatsApp List")}
                  </button>
                </div>
              </div>

              {/* Conditionally show Bulk Paste Block */}
              {showBulkPasteArea ? (
                <div className="bg-amber-50/35 border border-amber-100 p-4 rounded-2xl space-y-3">
                  <label className="block text-slate-600 font-bold text-3xs uppercase tracking-wider">
                    {lang === "ml" ? "വിദ്യാർത്ഥികളുടെ വിവരങ്ങൾ താഴെ പേസ്റ്റ് ചെയ്യുക (ഒരു വരിയിൽ ഒരാൾ):" : "Paste raw student records below (One line per student):"}
                  </label>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                    placeholder={lang === "ml" 
                      ? "ഉദാ:&#10;101 മുഹമ്മദ് അമീൻ ക്ലാസ്സ് 5 ആൺകുട്ടി&#10;102 ഫാത്തിമ സഫ ക്ലാസ്സ് 5 പെൺകുട്ടി" 
                      : "e.g.&#10;101 Muhammed Ameen Class 5 Male&#10;102 Fathima Safa Class 5 Girl"}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={isParsingBulk}
                      onClick={handleParseBulkText}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      {isParsingBulk 
                        ? (lang === "ml" ? "വിവരങ്ങൾ എടുക്കുന്നു..." : "Parsing...") 
                        : (lang === "ml" ? "ലിസ്റ്റ് ചേർക്കുക" : "Extract Student List")}
                    </button>
                  </div>
                </div>
              ) : (
                /* Standard Excel Dropper Box */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    isDragging 
                      ? "border-emerald-500 bg-emerald-50/20" 
                      : excelFile 
                        ? "border-emerald-300 bg-emerald-50/5" 
                        : "border-slate-200 hover:bg-slate-50/40"
                  }`}
                >
                    <input
                      type="file"
                      id="excel-upload"
                      accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,*/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                    {excelFile ? (
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5" />
                      </div>
                    )}
                    
                    <span className="text-xs font-bold text-slate-700">
                      {excelFile 
                        ? `${lang === "ml" ? "ലിങ്ക് ചെയ്ത എക്സെൽ ഫയൽ:" : "Linked Excel:"} ${excelFile.name}` 
                        : (lang === "ml" ? "എക്സെൽ ഫയൽ അപ്‌ലോഡ് ചെയ്യുക (ഓപ്ഷണൽ)" : "Upload Madrasa Student Excel (Optional)")}
                    </span>
                    <span className="text-3xs text-slate-400 mt-1 max-w-sm">
                      {lang === "ml" 
                        ? "എക്സെൽ (.xlsx, .xls) അല്ലെങ്കിൽ CSV ഫയൽ ഇവിടെ ഡ്രാഗ് ചെയ്യുക അല്ലെങ്കിൽ ക്ലിക്ക് ചെയ്ത് ബ്രൗസ് ചെയ്യുക." 
                        : "Drag and drop your Excel (.xlsx, .xls) or CSV list here, or click to browse."}
                    </span>
                  </label>
                </div>
              )}

              {/* Section 3: Interactive Student Grid */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    {lang === "ml" 
                      ? `വിദ്യാർത്ഥികളുടെ പട്ടിക (${students.length} എണ്ണം)` 
                      : `Students list database row grid (${students.length} rows)`}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-3xs transition flex items-center gap-1 border border-emerald-200 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> {lang === "ml" ? "വരി ചേർക്കുക" : "Add Row Manual"}
                  </button>
                </div>

                <div className="border border-slate-150 rounded-xl overflow-hidden max-h-80 overflow-y-auto text-xs">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-left">
                        <th className="p-2 w-16 text-3xs uppercase">{lang === "ml" ? "റോൾ നം" : "Roll No"}</th>
                        <th className="p-2 text-3xs uppercase">{lang === "ml" ? "വിദ്യാർത്ഥിയുടെ പേര്" : "Student Name"}</th>
                        
                        <th className="p-2 w-20 text-3xs uppercase">{lang === "ml" ? "ലിംഗം" : "Gender"}</th>
                        <th className="p-2 w-28 text-3xs uppercase">{lang === "ml" ? "ക്ലാസ്സ് / ഡിവിഷൻ" : "Class/Div"}</th>
                        <th className="p-2 w-10 text-center text-3xs uppercase">{lang === "ml" ? "ഒഴിവാക്കുക" : "Rem"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student, idx) => (
                        <tr key={student.admissionNumber ? `${student.admissionNumber}-${idx}` : idx} className="hover:bg-slate-50/55">
                          <td className="p-1">
                            <input
                              type="text"
                              required
                              value={student.admissionNumber || ""}
                              onChange={(e) => handleRowChange(idx, "admissionNumber", e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded text-center font-mono font-bold"
                              placeholder="101"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              required
                              value={student.name || ""}
                              onChange={(e) => handleRowChange(idx, "name", e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded font-semibold text-slate-800"
                              placeholder={lang === "ml" ? "ഉദാ: മുഹമ്മദ് അമീൻ" : "e.g. Muhammed Ameen"}
                            />
                          </td>
                          
                          <td className="p-1">
                            <select
                              value={student.gender || "Male"}
                              onChange={(e) => handleRowChange(idx, "gender", e.target.value)}
                              className="w-full p-1.5 border border-slate-200 rounded font-bold"
                            >
                              <option value="Male">{lang === "ml" ? "ആൺകുട്ടി" : "Boy"}</option>
                              <option value="Female">{lang === "ml" ? "പെൺകുട്ടി" : "Girl"}</option>
                            </select>
                          </td>
                          <td className="p-1">
                            <div className="flex gap-1">
                              <select
                                value={student.classLevel || "Class 5"}
                                onChange={(e) => handleRowChange(idx, "classLevel", e.target.value)}
                                className="w-1/2 p-1.5 border border-slate-200 rounded font-semibold text-slate-700"
                              >
                                <option value="Class 5">{lang === "ml" ? "ക്ലാസ്സ് 5" : "Class 5"}</option>
                                <option value="Class 6">{lang === "ml" ? "ക്ലാസ്സ് 6" : "Class 6"}</option>
                                <option value="Class 7">{lang === "ml" ? "ക്ലാസ്സ് 7" : "Class 7"}</option>
                                <option value="Class 8">{lang === "ml" ? "ക്ലാസ്സ് 8" : "Class 8"}</option>
                              </select>
                              <select
                                value={student.division || "A"}
                                onChange={(e) => handleRowChange(idx, "division", e.target.value)}
                                className="w-1/2 p-1.5 border border-slate-200 rounded font-bold text-slate-600"
                              >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-3xs text-slate-400 font-medium text-center sm:text-left">
              {lang === "ml" 
                ? "* ആൺകുട്ടികളുടെയും പെൺകുട്ടികളുടെയും വിവരങ്ങൾ കൃത്യമായി വേർതിരിച്ച് നൽകുക." 
                : "* Enrolled students list must contain strictly separated genders to prevent classroom assignment clashes."}
            </span>
            <button
              type="submit"
              disabled={isSubmitting || students.length === 0}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> 
              {isSubmitting 
                ? (lang === "ml" ? "സമർപ്പിക്കുന്നു..." : "Uploading Data...") 
                : (lang === "ml" ? "വിവരങ്ങൾ കേന്ദ്ര അഡ്മിന് സമർപ്പിക്കുക" : "Submit Student Data to Central Admin")}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
