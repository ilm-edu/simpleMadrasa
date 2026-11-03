import React, { useState } from "react";
import {
  Ruler,
  Info,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Eye,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export interface LabelDimensions {
  pageWidth: number; // in cm
  pageHeight: number; // in cm
  labelWidth: number; // in cm
  labelHeight: number; // in cm
  topMargin: number; // in cm
  sideMargin: number; // in cm
  horizontalPitch: number; // in cm
  verticalPitch: number; // in cm
  labelCols: number;
  labelRows: number;
}

interface LabelMeasurementGuideProps {
  dimensions: LabelDimensions;
  onChange: (updated: Partial<LabelDimensions>) => void;
  onResetDefaults: () => void;
  lang: "en" | "ml";
  isOpen: boolean;
  onToggle: () => void;
}

type DimensionKey =
  | "topMargin"
  | "sideMargin"
  | "labelWidth"
  | "labelHeight"
  | "horizontalPitch"
  | "verticalPitch"
  | "labelCols"
  | "labelRows"
  | "pageWidth"
  | "pageHeight";

export const LabelMeasurementGuide: React.FC<LabelMeasurementGuideProps> = ({
  dimensions,
  onChange,
  onResetDefaults,
  lang,
  isOpen,
  onToggle,
}) => {
  // Active unit: "cm" or "mm" for easy physical measuring with a school ruler
  const [unit, setUnit] = useState<"cm" | "mm">("cm");
  // Highlighted field from hover or focus
  const [highlightedKey, setHighlightedKey] = useState<DimensionKey | null>(null);
  // Show detailed guide steps
  const [showGuideTips, setShowGuideTips] = useState<boolean>(false);

  const {
    pageWidth,
    pageHeight,
    labelWidth,
    labelHeight,
    topMargin,
    sideMargin,
    horizontalPitch,
    verticalPitch,
    labelCols,
    labelRows,
  } = dimensions;

  // Convert value for display based on selected unit
  const toUnit = (valInCm: number) => {
    if (unit === "mm") {
      return Math.round(valInCm * 100) / 10; // 9.95 cm -> 99.5 mm
    }
    return Math.round(valInCm * 100) / 100;
  };

  // Convert input value from selected unit back to cm for storing
  const fromUnit = (valInSelectedUnit: number) => {
    if (unit === "mm") {
      return Math.round((valInSelectedUnit / 10) * 100) / 100;
    }
    return valInSelectedUnit;
  };

  const handleInputChange = (key: DimensionKey, valStr: string) => {
    const parsed = parseFloat(valStr);
    if (isNaN(parsed)) return;

    if (key === "labelCols" || key === "labelRows") {
      onChange({ [key]: Math.max(1, Math.round(parsed)) });
    } else {
      const cmVal = fromUnit(parsed);
      onChange({ [key]: Math.max(0, cmVal) });
    }
  };

  // Measurement field definitions with Flipkart size-chart style bilingual descriptions
  const fieldDefinitions: Array<{
    key: DimensionKey;
    labelEn: string;
    labelMl: string;
    descEn: string;
    descMl: string;
    color: string;
    badgeBg: string;
    step: number;
    isInteger?: boolean;
    quickTipEn: string;
    quickTipMl: string;
  }> = [
    {
      key: "topMargin",
      labelEn: "Top Margin",
      labelMl: "മുകളിലെ മാർജിൻ",
      descEn: "Distance from top edge of paper to top of first sticker row",
      descMl: "പേപ്പറിന്റെ ഏറ്റവും മുകളിലത്തെ അറ്റത്തുനിന്ന് ഒന്നാമത്തെ സ്റ്റിക്കർ തുടങ്ങുന്നത് വരെയുള്ള അകലം",
      color: "#ef4444", // red-500
      badgeBg: "bg-red-100 text-red-800 border-red-200",
      step: unit === "mm" ? 0.5 : 0.05,
      quickTipEn: "Measure with a ruler from top edge to the 1st sticker",
      quickTipMl: "സ്കെയിൽ വെച്ച് ഷീറ്റിന്റെ മുകളിലെ അറ്റത്തുനിന്ന് ആദ്യ ലേബൽ വരെ അളക്കുക",
    },
    {
      key: "sideMargin",
      labelEn: "Side / Left Margin",
      labelMl: "ഇടത് മാർജിൻ",
      descEn: "Distance from left edge of paper to left side of first column",
      descMl: "പേപ്പറിന്റെ ഇടത് വശത്തെ അറ്റത്തുനിന്ന് ഒന്നാമത്തെ സ്റ്റിക്കർ കോളം തുടങ്ങുന്നത് വരെയുള്ള അകലം",
      color: "#3b82f6", // blue-500
      badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
      step: unit === "mm" ? 0.5 : 0.05,
      quickTipEn: "Measure from the left paper edge to the 1st sticker",
      quickTipMl: "ഇടതുവശത്തെ അറ്റത്തുനിന്ന് ആദ്യ ലേബൽ തുടങ്ങുന്നത് വരെ അളക്കുക",
    },
    {
      key: "labelWidth",
      labelEn: "Label Width",
      labelMl: "ലേബൽ വീതി",
      descEn: "Exact horizontal width of a single sticker",
      descMl: "ഒരു സ്റ്റിക്കറിന്റെ കൃത്യമായ തിരശ്ചീന വീതി",
      color: "#10b981", // emerald-500
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
      step: unit === "mm" ? 0.5 : 0.05,
      quickTipEn: "Width of just one single peeled label",
      quickTipMl: "ഒരു ഒറ്റ സ്റ്റിക്കറിന്റെ ഇടത്തുനിന്ന് വലത്തോട്ടുളള വീതി",
    },
    {
      key: "labelHeight",
      labelEn: "Label Height",
      labelMl: "ലേബൽ നീളം / ഉയരം",
      descEn: "Exact vertical height of a single sticker",
      descMl: "ഒരു സ്റ്റിക്കറിന്റെ കൃത്യമായ ലംബമായ നീളം / ഉയരം",
      color: "#8b5cf6", // purple-500
      badgeBg: "bg-purple-100 text-purple-800 border-purple-200",
      step: unit === "mm" ? 0.5 : 0.05,
      quickTipEn: "Height of just one single peeled label",
      quickTipMl: "ഒരു ഒറ്റ സ്റ്റിക്കറിന്റെ മുകളിൽ നിന്ന് താഴേക്കുള്ള ഉയരം",
    },
    {
      key: "labelCols",
      labelEn: "Columns Count",
      labelMl: "കോളങ്ങളുടെ എണ്ണം",
      descEn: "Number of stickers across the sheet (Horizontal)",
      descMl: "ഒരു വരിയിൽ എത്ര സ്റ്റിക്കറുകൾ വീതമുണ്ട് (തിരശ്ചീന കോളങ്ങൾ)",
      color: "#f59e0b", // amber-500
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
      step: 1,
      isInteger: true,
      quickTipEn: "e.g. 2 for standard 2-column sheets, 3 for 3-column",
      quickTipMl: "ഉദാഹരണത്തിന്: 2 അല്ലെങ്കിൽ 3 കോളങ്ങൾ",
    },
    {
      key: "labelRows",
      labelEn: "Rows Count",
      labelMl: "വരികളുടെ എണ്ണം",
      descEn: "Number of stickers down the sheet (Vertical)",
      descMl: "ഒരു ഷീറ്റിൽ മുകളിൽ നിന്ന് താഴേക്ക് എത്ര വരി സ്റ്റിക്കറുകളുണ്ട്",
      color: "#ec4899", // pink-500
      badgeBg: "bg-pink-100 text-pink-800 border-pink-200",
      step: 1,
      isInteger: true,
      quickTipEn: "e.g. 6 rows for 12-label sheets, 4 for 8-label",
      quickTipMl: "ഉദാഹരണത്തിന്: 6 വരികൾ (12 ലേബൽ) അല്ലെങ്കിൽ 4 വരികൾ (8 ലേബൽ)",
    },
    {
      key: "horizontalPitch",
      labelEn: "Horizontal Pitch",
      labelMl: "തിരശ്ചീന അകലം (Pitch)",
      descEn: "Distance from left edge of Label 1 to left edge of Label 2 (Width + Gap)",
      descMl: "ഒന്നാമത്തെ സ്റ്റിക്കറിന്റെ തുടക്കം മുതൽ രണ്ടാമത്തെ സ്റ്റിക്കറിന്റെ തുടക്കം വരെയുള്ള ആകെ അകലം (വീതി + ഇടയിലെ ഗ്യാപ്പ്)",
      color: "#06b6d4", // cyan-500
      badgeBg: "bg-cyan-100 text-cyan-800 border-cyan-200",
      step: unit === "mm" ? 0.5 : 0.05,
      quickTipEn: "If labels touch each other with no gap, Pitch = Width",
      quickTipMl: "സ്റ്റിക്കറുകൾക്കിടയിൽ ഗ്യാപ്പില്ലെങ്കിൽ Pitch = വീതി തന്നെ നൽകാം",
    },
    {
      key: "verticalPitch",
      labelEn: "Vertical Pitch",
      labelMl: "ലംബമായ അകലം (Pitch)",
      descEn: "Distance from top edge of Row 1 to top edge of Row 2 (Height + Gap)",
      descMl: "ഒന്നാമത്തെ വരിയുടെ തുടക്കം മുതൽ രണ്ടാമത്തെ വരിയുടെ തുടക്കം വരെയുള്ള ആകെ അകലം (ഉയരം + ഇടയിലെ ഗ്യാപ്പ്)",
      color: "#f97316", // orange-500
      badgeBg: "bg-orange-100 text-orange-800 border-orange-200",
      step: unit === "mm" ? 0.5 : 0.05,
      quickTipEn: "If rows touch each other with no gap, Pitch = Height",
      quickTipMl: "വരികൾക്കിടയിൽ ഗ്യാപ്പില്ലെങ്കിൽ Pitch = ഉയരം തന്നെ നൽകാം",
    },
  ];

  // Calculated values
  const totalLabelsPerSheet = labelCols * labelRows;
  const colGapCm = Math.max(0, horizontalPitch - labelWidth);
  const rowGapCm = Math.max(0, verticalPitch - labelHeight);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-extrabold text-sm sm:text-base text-white">
                {lang === "ml"
                  ? "📐 സ്റ്റിക്കർ അളവ് ഗൈഡും കസ്റ്റമൈസേഷനും (Size Chart & Measurement Guide)"
                  : "📐 A4 Sticker Measurement Guide & Custom Blueprint"}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                Flipkart Size Chart Style
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {lang === "ml"
                ? "നിങ്ങളുടെ കയ്യിലുള്ള സ്റ്റിക്കർ ഷീറ്റിന്റെ അളവുകൾ സ്കെയിൽ വെച്ച് കൃത്യമായി അളന്ന് ഇവിടെ രേഖപ്പെടുത്താം."
                : "Visually measure any physical A4 sticker brand and fine-tune exact millimeters for 100% rigid alignment."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {/* Unit Toggle: cm vs mm */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setUnit("cm")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                unit === "cm"
                  ? "bg-emerald-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Measure in Centimeters"
            >
              cm
            </button>
            <button
              type="button"
              onClick={() => setUnit("mm")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                unit === "mm"
                  ? "bg-emerald-500 text-slate-950 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Measure in Millimeters"
            >
              mm
            </button>
          </div>

          {/* Toggle Panel Accordion */}
          <button
            type="button"
            onClick={onToggle}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <span>{isOpen ? (lang === "ml" ? "ചുരുക്കുക" : "Collapse") : (lang === "ml" ? "തുറക്കുക" : "Expand Guide")}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isOpen && (
        <div className="p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {/* Top Info Banner & Step-by-Step Measuring Tips */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 text-xs text-emerald-950 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <span className="text-lg">📏</span>
                <span>
                  {lang === "ml"
                    ? "സ്റ്റിക്കർ ഷീറ്റ് സ്കെയിൽ വെച്ച് കൃത്യമായി അളക്കുന്ന വിധം (How to Measure with a Ruler):"
                    : "Step-by-Step Physical Measurement Guide:"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideTips(!showGuideTips)}
                className="text-emerald-700 hover:text-emerald-800 font-extrabold text-3xs flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showGuideTips ? (lang === "ml" ? "വിശദാംശങ്ങൾ മറയ്ക്കുക" : "Hide Tips") : (lang === "ml" ? "എളുപ്പവഴികൾ കാണുക" : "Show Measuring Tips")}</span>
              </button>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              {lang === "ml" ? (
                <>
                  വസ്ത്രങ്ങൾ വാങ്ങുമ്പോൾ Flipkart / Amazon സൈസ് ചാർട്ടിൽ അളവുകൾ കാണിക്കുന്നത് പോലെ, താഴെ നൽകിയിരിക്കുന്ന <strong>A4 ഷീറ്റിന്റെ ചിത്രത്തിൽ</strong> ഓരോ അമ്പടയാളവും (Arrow) ഏത് ഭാഗമാണ് സൂചിപ്പിക്കുന്നതെന്ന് നോക്കുക. ആ ഭാഗങ്ങൾ ഒരു സാധാരണ സ്കെയിൽ (Ruler) ഉപയോഗിച്ച് അളന്ന് താഴെയുള്ള ബോക്സുകളിൽ രേഖപ്പെടുത്തിയാൽ ഏത് കമ്പനിയുടെ സ്റ്റിക്കറിലും പ്രിന്റ് 100% കൃത്യമായി വരും!
                </>
              ) : (
                <>
                  Just like an apparel size chart on Flipkart/Amazon, look at the <strong>visual A4 blueprint diagram below</strong> with color-coded measurement calipers. Hover or click any field to highlight where to measure with a ruler on your physical sticker sheet.
                </>
              )}
            </p>

            {showGuideTips && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-emerald-200/60 text-2xs text-slate-700 font-medium">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono">1</span>
                    {lang === "ml" ? "മാർജിൻ അളക്കുക" : "1. Measure Margins"}
                  </span>
                  <p className="text-slate-500">
                    {lang === "ml"
                      ? "പേപ്പറിന്റെ മുകളറ്റത്തുനിന്നും ഇടതറ്റത്തുനിന്നും ആദ്യ സ്റ്റിക്കർ വരെയുള്ള അകലം അളക്കുക."
                      : "Measure top edge & left edge to the first sticker."}
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono">2</span>
                    {lang === "ml" ? "സ്റ്റിക്കർ സൈസ്" : "2. Sticker Size"}
                  </span>
                  <p className="text-slate-500">
                    {lang === "ml"
                      ? "ഒരു ഒറ്റ സ്റ്റിക്കറിന്റെ കൃത്യമായ വീതിയും ഉയരവും അളക്കുക."
                      : "Measure width & height of a single peeled sticker label."}
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono">3</span>
                    {lang === "ml" ? "പിച്ച് / ഗ്യാപ്പ്" : "3. Pitch / Gap"}
                  </span>
                  <p className="text-slate-500">
                    {lang === "ml"
                      ? "രണ്ട് സ്റ്റിക്കറുകൾ തമ്മിലുള്ള അകലം അളക്കുക (സ്റ്റിക്കറുകൾക്കിടയിൽ ഗ്യാപ്പില്ലെങ്കിൽ Pitch = വീതി/ഉയരം)."
                      : "Distance from start of 1st label to start of 2nd label."}
                  </p>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <span className="font-extrabold text-emerald-800 flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-mono">4</span>
                    {lang === "ml" ? "എണ്ണം രേഖപ്പെടുത്തുക" : "4. Total Count"}
                  </span>
                  <p className="text-slate-500">
                    {lang === "ml"
                      ? "ഒരു ഷീറ്റിൽ എത്ര നിരയും വരിയും ഉണ്ടെന്ന് എണ്ണി നൽകുക (ഉദാ: 2×6 = 12 ലേബലുകൾ)."
                      : "Columns across × rows down (e.g. 2×6 = 12 labels)."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MAIN 2-COLUMN SECTION: (Left: Visual Blueprint Diagram, Right: Interactive Inputs Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: THE VISUAL SIZE CHART BLUEPRINT DIAGRAM */}
            <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span className="font-extrabold text-xs text-slate-800 font-display">
                    {lang === "ml" ? "A4 ഷീറ്റ് സൈസ് ചാർട്ട് ചിത്രം (Blueprint)" : "A4 Visual Blueprint Model"}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {totalLabelsPerSheet} Labels / Sheet ({labelCols}×{labelRows})
                </span>
              </div>

              {/* Realistic Visual A4 Sheet SVG Blueprint with Interactive Dimension Calipers */}
              <div className="w-full max-w-[320px] aspect-[210/297] bg-white rounded-lg shadow-md border-2 border-slate-300 relative overflow-visible p-3 flex flex-col justify-between select-none">
                {/* SVG Blueprint Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
                  viewBox="0 0 210 297"
                  preserveAspectRatio="none"
                >
                  <defs>
                    {/* Arrow Markers */}
                    <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 1.5 L 3 3 L 0 4.5 z" fill="#ef4444" />
                    </marker>
                    <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 1.5 L 3 3 L 0 4.5 z" fill="#3b82f6" />
                    </marker>
                    <marker id="arrow-emerald" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 1.5 L 3 3 L 0 4.5 z" fill="#10b981" />
                    </marker>
                    <marker id="arrow-purple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 1.5 L 3 3 L 0 4.5 z" fill="#8b5cf6" />
                    </marker>
                    <marker id="arrow-cyan" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 1.5 L 3 3 L 0 4.5 z" fill="#06b6d4" />
                    </marker>
                    <marker id="arrow-orange" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 1.5 L 3 3 L 0 4.5 z" fill="#f97316" />
                    </marker>
                  </defs>

                  {/* Grid Lines simulation */}
                  <rect x="0" y="0" width="210" height="297" fill="#fafafa" stroke="#cbd5e1" strokeWidth="1" />

                  {/* 1. TOP MARGIN ARROW */}
                  <g className="transition-all duration-200">
                    <line
                      x1="105"
                      y1="0"
                      x2="105"
                      y2={Math.min(40, Math.max(10, (topMargin / pageHeight) * 297))}
                      stroke="#ef4444"
                      strokeWidth={highlightedKey === "topMargin" ? "3" : "1.5"}
                      strokeDasharray={highlightedKey === "topMargin" ? "none" : "2,2"}
                      markerEnd="url(#arrow-red)"
                    />
                    <rect
                      x="70"
                      y="2"
                      width="70"
                      height="12"
                      rx="3"
                      fill={highlightedKey === "topMargin" ? "#ef4444" : "#fee2e2"}
                      stroke="#ef4444"
                      strokeWidth="1"
                    />
                    <text
                      x="105"
                      y="10"
                      fill={highlightedKey === "topMargin" ? "#ffffff" : "#991b1b"}
                      fontSize="7"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      Top: {toUnit(topMargin)} {unit}
                    </text>
                  </g>

                  {/* 2. SIDE / LEFT MARGIN ARROW */}
                  <g className="transition-all duration-200">
                    <line
                      x1="0"
                      y1="60"
                      x2={Math.min(30, Math.max(8, (sideMargin / pageWidth) * 210))}
                      y2="60"
                      stroke="#3b82f6"
                      strokeWidth={highlightedKey === "sideMargin" ? "3" : "1.5"}
                      strokeDasharray={highlightedKey === "sideMargin" ? "none" : "2,2"}
                      markerEnd="url(#arrow-blue)"
                    />
                    <rect
                      x="1"
                      y="46"
                      width="35"
                      height="12"
                      rx="3"
                      fill={highlightedKey === "sideMargin" ? "#3b82f6" : "#dbeafe"}
                      stroke="#3b82f6"
                      strokeWidth="1"
                    />
                    <text
                      x="18"
                      y="54"
                      fill={highlightedKey === "sideMargin" ? "#ffffff" : "#1e40af"}
                      fontSize="6"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      Side: {toUnit(sideMargin)} {unit}
                    </text>
                  </g>
                </svg>

                {/* Inner Sticker Grid (Simulating real labels layout) */}
                <div
                  className="w-full h-full grid relative z-10 transition-all duration-300"
                  style={{
                    paddingTop: `${Math.min(15, Math.max(3, (topMargin / pageHeight) * 100))}%`,
                    paddingLeft: `${Math.min(15, Math.max(3, (sideMargin / pageWidth) * 100))}%`,
                    paddingRight: `${Math.min(15, Math.max(3, (sideMargin / pageWidth) * 100))}%`,
                    gridTemplateColumns: `repeat(${labelCols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${labelRows}, minmax(0, 1fr))`,
                    gap: `${Math.max(2, (rowGapCm / pageHeight) * 100)}% ${Math.max(2, (colGapCm / pageWidth) * 100)}%`,
                  }}
                >
                  {Array.from({ length: Math.min(24, totalLabelsPerSheet) }).map((_, idx) => {
                    const isFirstLabel = idx === 0;
                    const isSecondLabel = idx === 1 && labelCols > 1;
                    const isRowTwoFirstLabel = idx === labelCols;

                    const isHighlightWidth = highlightedKey === "labelWidth" && isFirstLabel;
                    const isHighlightHeight = highlightedKey === "labelHeight" && isFirstLabel;
                    const isHighlightPitchH = highlightedKey === "horizontalPitch" && (isFirstLabel || isSecondLabel);
                    const isHighlightPitchV = highlightedKey === "verticalPitch" && (isFirstLabel || isRowTwoFirstLabel);

                    const isAnyActive =
                      isHighlightWidth || isHighlightHeight || isHighlightPitchH || isHighlightPitchV;

                    return (
                      <div
                        key={idx}
                        className={`rounded-[3px] border text-[8px] flex flex-col items-center justify-center font-mono p-1 transition-all duration-200 relative ${
                          isAnyActive
                            ? "bg-emerald-100 border-emerald-500 shadow-md ring-2 ring-emerald-400"
                            : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
                        }`}
                      >
                        {isFirstLabel ? (
                          <div className="flex flex-col items-center justify-center text-center w-full h-full">
                            <span className="font-extrabold text-[8px] text-emerald-800 font-sans">
                              {lang === "ml" ? "ലേബൽ 1" : "Label #1"}
                            </span>
                            <span className="text-[7px] text-slate-500 font-mono">
                              {toUnit(labelWidth)} × {toUnit(labelHeight)} {unit}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[8px] font-bold">#{idx + 1}</span>
                        )}

                        {/* Visual Callout for Width on Label 1 */}
                        {isFirstLabel && (
                          <div
                            className={`absolute -bottom-3 left-0 right-0 h-2 flex items-center justify-center transition-all ${
                              highlightedKey === "labelWidth" ? "opacity-100 scale-105" : "opacity-75"
                            }`}
                          >
                            <span className="bg-emerald-600 text-white text-[6px] font-bold px-1 rounded-sm shadow-xs whitespace-nowrap">
                              ↔ Width: {toUnit(labelWidth)} {unit}
                            </span>
                          </div>
                        )}

                        {/* Visual Callout for Height on Label 1 */}
                        {isFirstLabel && (
                          <div
                            className={`absolute top-0 bottom-0 -right-4 w-3 flex items-center justify-center transition-all ${
                              highlightedKey === "labelHeight" ? "opacity-100 scale-105" : "opacity-75"
                            }`}
                          >
                            <span className="bg-purple-600 text-white text-[6px] font-bold px-1 py-0.5 rounded-sm shadow-xs rotate-90 whitespace-nowrap">
                              ↕ Height: {toUnit(labelHeight)} {unit}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Diagram Legend / Quick Dimension Badges */}
              <div className="w-full grid grid-cols-2 gap-1.5 pt-2 text-[10px]">
                <div
                  onMouseEnter={() => setHighlightedKey("topMargin")}
                  onMouseLeave={() => setHighlightedKey(null)}
                  className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    highlightedKey === "topMargin" ? "bg-red-50 border-red-300 ring-1 ring-red-400" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    Top Margin:
                  </span>
                  <span className="font-mono font-bold text-slate-800">{toUnit(topMargin)} {unit}</span>
                </div>

                <div
                  onMouseEnter={() => setHighlightedKey("sideMargin")}
                  onMouseLeave={() => setHighlightedKey(null)}
                  className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    highlightedKey === "sideMargin" ? "bg-blue-50 border-blue-300 ring-1 ring-blue-400" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold text-blue-700">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Side Margin:
                  </span>
                  <span className="font-mono font-bold text-slate-800">{toUnit(sideMargin)} {unit}</span>
                </div>

                <div
                  onMouseEnter={() => setHighlightedKey("labelWidth")}
                  onMouseLeave={() => setHighlightedKey(null)}
                  className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    highlightedKey === "labelWidth" ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Label Width:
                  </span>
                  <span className="font-mono font-bold text-slate-800">{toUnit(labelWidth)} {unit}</span>
                </div>

                <div
                  onMouseEnter={() => setHighlightedKey("labelHeight")}
                  onMouseLeave={() => setHighlightedKey(null)}
                  className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                    highlightedKey === "labelHeight" ? "bg-purple-50 border-purple-300 ring-1 ring-purple-400" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="flex items-center gap-1 font-bold text-purple-700">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Label Height:
                  </span>
                  <span className="font-mono font-bold text-slate-800">{toUnit(labelHeight)} {unit}</span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE INPUT FORM WITH MEASUREMENT GUIDES */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-extrabold text-xs text-slate-800 font-display">
                    {lang === "ml"
                      ? "അളവുകൾ നൽകുക (Fill Measurement Values)"
                      : "Sticker Dimension Fields"}
                  </h4>
                </div>
                <div className="text-2xs text-slate-500 font-mono">
                  Unit: <strong className="text-emerald-700 uppercase font-bold">{unit}</strong>
                </div>
              </div>

              {/* 8 Main Parameters in 2-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {fieldDefinitions.map((field) => {
                  const isHighlighted = highlightedKey === field.key;
                  const currentVal = dimensions[field.key];
                  const displayVal = field.isInteger ? currentVal : toUnit(currentVal);

                  return (
                    <div
                      key={field.key}
                      onMouseEnter={() => setHighlightedKey(field.key)}
                      onMouseLeave={() => setHighlightedKey(null)}
                      className={`p-3 rounded-xl border transition-all duration-200 space-y-1.5 ${
                        isHighlighted
                          ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-400/30 -translate-y-0.5"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-extrabold text-slate-800">
                          {lang === "ml" ? field.labelMl : field.labelEn}
                        </label>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border ${field.badgeBg}`}>
                          {unit}
                        </span>
                      </div>

                      {/* Field Description */}
                      <p className="text-[11px] text-slate-500 leading-tight">
                        {lang === "ml" ? field.descMl : field.descEn}
                      </p>

                      {/* Input Box with Step Buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="number"
                          step={field.step}
                          value={displayVal}
                          onFocus={() => setHighlightedKey(field.key)}
                          onBlur={() => setHighlightedKey(null)}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono font-bold text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>

                      {/* Quick Ruler Tip */}
                      <div className="text-[10px] text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded border border-emerald-100/80 font-sans flex items-center gap-1">
                        <span>💡</span>
                        <span className="truncate">{lang === "ml" ? field.quickTipMl : field.quickTipEn}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons: Reset to Defaults + Quick Brand Presets */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">
                    {lang === "ml" ? "സാധാരണ സൈസ് പ്രീസെറ്റുകൾ:" : "Popular Brand Presets:"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          labelCols: 2,
                          labelRows: 6,
                          labelWidth: 9.95,
                          labelHeight: 4.4,
                          topMargin: 0.9,
                          sideMargin: 0.4,
                          horizontalPitch: 10.25,
                          verticalPitch: 4.7,
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-3xs font-bold transition cursor-pointer"
                    >
                      12 Labels (2×6)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          labelCols: 2,
                          labelRows: 4,
                          labelWidth: 9.91,
                          labelHeight: 6.77,
                          topMargin: 1.3,
                          sideMargin: 0.5,
                          horizontalPitch: 10.1,
                          verticalPitch: 6.77,
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-3xs font-bold transition cursor-pointer"
                    >
                      8 Labels (2×4)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          labelCols: 2,
                          labelRows: 8,
                          labelWidth: 9.91,
                          labelHeight: 3.4,
                          topMargin: 1.2,
                          sideMargin: 0.5,
                          horizontalPitch: 10.1,
                          verticalPitch: 3.4,
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-3xs font-bold transition cursor-pointer"
                    >
                      16 Labels (2×8)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({
                          labelCols: 3,
                          labelRows: 8,
                          labelWidth: 6.6,
                          labelHeight: 3.38,
                          topMargin: 1.3,
                          sideMargin: 0.6,
                          horizontalPitch: 6.6,
                          verticalPitch: 3.38,
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-3xs font-bold transition cursor-pointer"
                    >
                      24 Labels (3×8)
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onResetDefaults}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer border border-slate-200 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === "ml" ? "ഡീഫോൾട്ടിലേക്ക് റീസെറ്റ്" : "Reset Default"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
