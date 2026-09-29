import { LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";

// notificationStore é opcional — só o painel do parceiro passa
// (NotificacoesParceiro); o Admin, que também usa este shell, fica sem sino.
export default function PainelShell({ marca, abas, aba, onAbaChange, onLogout, notificationStore, children }) {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <div className="text-sm text-text tracking-wide font-display">
            Synk<span className="text-accent">ISP</span> <span className="text-text-dim font-sans">· {marca}</span>
          </div>
          <nav className="flex gap-1">
            {abas.map((a) => (
              <button
                key={a.key}
                onClick={() => onAbaChange(a.key)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                  aba === a.key ? "bg-accent/12 text-accent shadow-sm" : "text-text-sub hover:text-text hover:bg-surface-2"
                }`}
              >
                {a.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {notificationStore && <NotificationBell store={notificationStore} />}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs text-text-dim hover:text-danger transition-colors"
          >
            <LogOut size={14} strokeWidth={1.6} /> Sair
          </button>
        </div>
      </header>

      <div className="p-6 lg:p-8">{children}</div>
    </div>
  );
}
