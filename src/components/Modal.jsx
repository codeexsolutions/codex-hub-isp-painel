export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <h2 className="text-lg text-text font-display">{title}</h2>
        {children}
      </div>
    </div>
  );
}
