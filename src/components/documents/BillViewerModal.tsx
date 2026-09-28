import React, { useState } from "react";
import { X, Download, ZoomIn, ZoomOut, RotateCcw, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { Attachment, Language } from "../../types";
import { getTranslation } from "../../i18n/translations";

type BillViewerModalProps = {
  attachment: Attachment;
  title: string;
  subtitle?: string;
  amount?: string;
  lang: Language;
  onClose: () => void;
};

export function BillViewerModal({
  attachment,
  title,
  subtitle,
  amount,
  lang,
  onClose,
}: BillViewerModalProps) {
  const t = getTranslation(lang);
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale(s => Math.min(3, s + 0.25));
  const handleZoomOut = () => setScale(s => Math.max(0.5, s - 0.25));
  const handleReset = () => setScale(1);

  const dataUrl = attachment?.dataUrl || "";
  const isImage = Boolean(
    dataUrl.startsWith("data:image") ||
    (attachment?.type && attachment.type.includes("image")) ||
    dataUrl.startsWith("data:image/svg") ||
    dataUrl.startsWith("http")
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-2.5 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90dvh] rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-white my-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 p-3 sm:p-4 sm:px-6 bg-slate-950/80 gap-2 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileText size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-xs sm:text-base text-white truncate max-w-[160px] sm:max-w-md">{title || "Transaction Document"}</h3>
                <span className="hidden xs:inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck size={11} /> {t.verifiedBill || "Verified"}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">{subtitle} {amount ? `• ${amount}` : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Zoom Controls */}
            {isImage && (
              <div className="hidden sm:flex items-center rounded-xl bg-slate-800 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="rounded-lg p-1.5 hover:bg-slate-700 text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="px-2 text-xs font-mono text-slate-300">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="rounded-lg p-1.5 hover:bg-slate-700 text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg p-1.5 hover:bg-slate-700 text-slate-300"
                  title="Reset Zoom"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            )}

            {/* Download */}
            {dataUrl && (
              <a
                href={dataUrl}
                download={attachment?.name || "KSG_Bill_Receipt"}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-amber-500 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
                title="Download File"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Content Canvas */}
        <div className="flex-1 overflow-auto p-3 sm:p-8 flex items-center justify-center bg-slate-950 min-h-[300px] max-h-[70vh]">
          {isImage && dataUrl ? (
            <div
              className="transition-transform duration-150 origin-center max-w-full flex items-center justify-center"
              style={{ transform: `scale(${scale})` }}
            >
              <img
                src={dataUrl}
                alt={attachment?.name || "Receipt"}
                className="max-h-[55vh] sm:max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800 bg-white"
              />
            </div>
          ) : dataUrl ? (
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 max-w-md w-full">
              <FileText size={40} className="mx-auto text-amber-400 mb-3" />
              <p className="font-bold text-xs sm:text-sm text-white mb-1 truncate">{attachment?.name || "Document"}</p>
              <p className="text-xs text-slate-400 mb-4">Document / PDF Attachment</p>
              <a
                href={dataUrl}
                download={attachment?.name || "Document"}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <Download size={15} /> Download
              </a>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400">
              <FileText size={36} className="mx-auto mb-2 text-slate-600" />
              <p className="text-xs font-semibold">No preview available</p>
            </div>
          )}
        </div>

        {/* Footer Audit Information */}
        <div className="border-t border-slate-800/80 px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-1.5">
          <span className="truncate">File: <strong>{attachment?.name || "Attachment"}</strong></span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 size={13} /> Digital Audit Trail Attached {attachment?.uploadedAt ? `• ${attachment.uploadedAt}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
