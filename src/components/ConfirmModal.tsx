import React from "react";
import { 
  AlertTriangle, 
  Trash2, 
  Sparkles, 
  RotateCcw, 
  Upload, 
  HelpCircle,
  X, 
  CheckCircle2,
  ShieldAlert
} from "lucide-react";
import { Language } from "../translations";

export type ConfirmModalType = "danger" | "warning" | "info" | "success";

export interface ConfirmDialogOptions {
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  subMessage?: string;
  subMessageEn?: string;
  confirmText?: string;
  confirmTextEn?: string;
  cancelText?: string;
  cancelTextEn?: string;
  type?: ConfirmModalType;
  icon?: "trash" | "sparkles" | "warning" | "restore" | "upload" | "help";
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmModalProps {
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  onClose: () => void;
  lang: Language;
}

export default function ConfirmModal({
  isOpen,
  options,
  onClose,
  lang
}: ConfirmModalProps) {
  if (!isOpen || !options) return null;

  const {
    title,
    titleEn,
    message,
    messageEn,
    subMessage,
    subMessageEn,
    confirmText,
    confirmTextEn,
    cancelText,
    cancelTextEn,
    type = "warning",
    icon = "warning",
    onConfirm
  } = options;

  const displayTitle = lang === "ml" ? title : (titleEn || title);
  const displayMessage = lang === "ml" ? message : (messageEn || message);
  const displaySubMessage = lang === "ml" ? subMessage : (subMessageEn || subMessage);
  const displayConfirmText = lang === "ml" 
    ? (confirmText || "അതെ, തുടരുക") 
    : (confirmTextEn || confirmText || "Yes, Proceed");
  const displayCancelText = lang === "ml" 
    ? (cancelText || "റദ്ദാക്കുക") 
    : (cancelTextEn || cancelText || "Cancel");

  const getThemeStyles = () => {
    switch (type) {
      case "danger":
        return {
          headerBg: "bg-gradient-to-r from-red-600 to-rose-700",
          iconBg: "bg-red-50 text-red-600 border-red-200",
          confirmBtn: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg focus:ring-red-300",
          border: "border-red-200"
        };
      case "info":
      case "success":
        return {
          headerBg: "bg-gradient-to-r from-emerald-600 to-teal-700",
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg focus:ring-emerald-300",
          border: "border-emerald-200"
        };
      case "warning":
      default:
        return {
          headerBg: "bg-gradient-to-r from-amber-600 to-orange-700",
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
          confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg focus:ring-amber-300",
          border: "border-amber-200"
        };
    }
  };

  const theme = getThemeStyles();

  const renderIcon = () => {
    switch (icon) {
      case "trash":
        return <Trash2 className="w-6 h-6 text-red-600" />;
      case "sparkles":
        return <Sparkles className="w-6 h-6 text-emerald-600" />;
      case "restore":
        return <RotateCcw className="w-6 h-6 text-amber-600" />;
      case "upload":
        return <Upload className="w-6 h-6 text-purple-600" />;
      case "help":
        return <HelpCircle className="w-6 h-6 text-blue-600" />;
      case "warning":
      default:
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150 no-print">
      <div 
        className={`bg-white rounded-3xl shadow-2xl border ${theme.border} max-w-md w-full overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${theme.iconBg}`}>
              {renderIcon()}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {displayTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-3 space-y-3">
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
            {displayMessage}
          </p>

          {displaySubMessage && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-2xs sm:text-xs text-slate-600 font-medium">
              {displaySubMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition cursor-pointer"
          >
            {displayCancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className={`px-5 py-2.5 font-black text-xs sm:text-sm rounded-xl transition cursor-pointer focus:ring-2 outline-none ${theme.confirmBtn}`}
          >
            {displayConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
