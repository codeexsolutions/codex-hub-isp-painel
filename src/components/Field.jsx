export function Label({ children, required }) {
  return (
    <label className="block text-xs text-text-sub tracking-wide mb-1.5">
      {children}
      {required && <span className="text-accent ml-1">*</span>}
    </label>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text
        placeholder:text-text-dim outline-none
        focus:border-accent/50 focus:ring-1 focus:ring-accent/20
        transition-colors duration-200 disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export function Select({ children, className = "", ...props }) {
  return (
    <select
      className={`w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text
        outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20
        transition-colors duration-200 disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text
        placeholder:text-text-dim outline-none resize-none
        focus:border-accent/50 focus:ring-1 focus:ring-accent/20
        transition-colors duration-200 ${className}`}
      {...props}
    />
  );
}

export function Help({ children }) {
  return <p className="text-[11px] text-text-dim mt-1">{children}</p>;
}

export function ColorField({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value || "#3b82f6"}
        onChange={(e) => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
      />
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#3b82f6"
        className="flex-1"
      />
    </div>
  );
}

export function FieldRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}
