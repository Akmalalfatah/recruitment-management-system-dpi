import { Link } from "react-router-dom";
import { Info } from "lucide-react";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-surface-card border border-surface-border shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, accent = "primary" }) {
  const accentMap = {
    primary: "text-primary",
    secondary: "text-secondary-600",
    green: "text-green-600",
    blue: "text-status-blue",
  };
  return (
    <Card className="p-4">
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accentMap[accent] || accentMap.primary}`}>{value}</p>
    </Card>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary-600 text-white text-sm font-semibold px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 border border-surface-border hover:bg-surface-panel text-ink-700 text-sm font-medium px-4 py-2 transition-colors disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const ACTION_VARIANTS = {
  info: "bg-status-blue hover:bg-blue-600",
  edit: "bg-secondary hover:bg-secondary-600",
  danger: "bg-status-red hover:bg-red-700",
  success: "bg-status-green hover:bg-green-700",
};

export function ActionIconButton({ icon: Icon, onClick, variant = "info", title, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      className={`inline-flex items-center justify-center w-7 h-7 text-white transition-colors ${ACTION_VARIANTS[variant] || ACTION_VARIANTS.info}`}
    >
      <Icon size={14} strokeWidth={2.5} />
    </button>
  );
}

export function ViewLink({ to }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center w-7 h-7 bg-status-blue hover:bg-blue-600 text-white transition-colors"
      title="Lihat detail"
    >
      <Info size={14} strokeWidth={2.5} />
    </Link>
  );
}

export function Field({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-500 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-300 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full border border-surface-border px-3 py-2 text-sm text-ink-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:bg-surface-panel disabled:text-ink-500";

export function TextInput(props) {
  return <input {...props} className={`${inputCls} ${props.className || ""}`} />;
}

export function SelectInput({ options = [], placeholder = "Pilih...", ...props }) {
  return (
    <select {...props} className={`${inputCls} ${props.className || ""}`}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export function TextArea(props) {
  return <textarea {...props} className={`${inputCls} min-h-[80px] ${props.className || ""}`} />;
}
