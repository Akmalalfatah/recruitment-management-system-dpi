export default function DateRangeFilter({ from, to, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="text-xs font-medium text-ink-500">Dari</label>
      <input
        type="date"
        value={from || ""}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="border border-surface-border px-2.5 py-1.5 text-sm text-ink-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      <label className="text-xs font-medium text-ink-500">Sampai</label>
      <input
        type="date"
        value={to || ""}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="border border-surface-border px-2.5 py-1.5 text-sm text-ink-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      {(from || to) && (
        <button
          onClick={() => onChange({ from: "", to: "" })}
          className="text-xs font-medium text-primary hover:underline"
        >
          Reset
        </button>
      )}
    </div>
  );
}
