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

  const isImage = attachment.dataUrl.startsWith("data:image") || attachment.type.includes("image");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[95vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-white">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:px-6 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">{title}</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck size={11} /> {t.auditVerified}
                </span>
              </div>
              <p className="text-xs text-slate-400">{subtitle} {amount ? `• Amount: ${amount}` : ""}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {isImage && (
              <div className="hidden sm:flex items-center rounded-xl bg-slate-800 p-1 border border-slate-700">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="rounded-lg p-1.5 hover:bg-slate-700 text-slate-300"
                  title={t.zoomOut}
                >
                  <ZoomOut size={16} />
                </button>
                <span className="px-2 text-xs font-mono text-slate-300">{Math.round(scale * 100)}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="rounded-lg p-1.5 hover:bg-slate-700 text-slate-300"
                  title={t.zoomIn}
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
            <a
              href={attachment.dataUrl}
              download={attachment.name || "KSG_Bill_Receipt"}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
              title={t.downloadOriginal}
            >
              <Download size={15} />
              <span className="hidden sm:inline">{t.downloadOriginal}</span>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              type="button"
              className="rounded-xl p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Content Canvas */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950 min-h-[360px] max-h-[70vh]">
          {isImage ? (
            <div
              className="transition-transform duration-150 origin-center max-w-full"
              style={{ transform: `scale(${scale})` }}
            >
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-2xl border border-slate-800 bg-white"
              />
            </div>
          ) : (
            <div className="text-center p-8 rounded-2xl bg-slate-900 border border-slate-800">
              <FileText size={48} className="mx-auto text-amber-400 mb-3" />
              <p className="font-bold text-sm text-white mb-1">{attachment.name}</p>
              <p className="text-xs text-slate-400 mb-4">Document / PDF Attachment</p>
              <a
                href={attachment.dataUrl}
                download={attachment.name}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                <Download size={16} /> {t.downloadOriginal}
              </a>
            </div>
          )}
        </div>

        {/* Footer Audit Information */}
        <div className="border-t border-slate-800/80 px-6 py-3 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
          <span>File: <strong>{attachment.name}</strong></span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 size={13} /> Digital Audit Trail Attached &bull; Uploaded on {attachment.uploadedAt}
          </span>
        </div>
      </div>
    </div>
  );
}
