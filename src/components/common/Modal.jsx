import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, width = "max-w-xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-900/40 p-6">
      <div className={`bg-white shadow-card w-full ${width} mt-8 mb-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h3 className="font-bold text-ink-900 text-base">{title}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 p-1 hover:bg-surface-panel">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
