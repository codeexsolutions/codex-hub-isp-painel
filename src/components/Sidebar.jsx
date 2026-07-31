import {
  Building2, Palette, Image, Megaphone, Gift, Star, Bell, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";

const NAV = [
  { key: "provedor", icon: Building2, label: "Provedor" },
  { key: "tema", icon: Palette, label: "Tema" },
  { key: "banners", icon: Image, label: "Banners" },
  { key: "anuncios", icon: Megaphone, label: "Anúncios" },
  { key: "notificacoes", icon: Bell, label: "Notificações" },
  { key: "indicacoes", icon: Gift, label: "Indicações" },
  { key: "avaliacoes", icon: Star, label: "Avaliações" },
];

export default function Sidebar({ activeTab, onTabChange, providerName, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = (
    <>
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent text-base">
          ◈
        </div>
        <div>
          <div className="text-sm text-text tracking-wide font-display">
            hub<span className="text-accent">ISP</span>
          </div>
          <div className="text-[10px] text-text-dim tracking-widest uppercase">Painel</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ key, icon: Icon, label }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => { onTabChange(key); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-200
                ${active
                  ? "bg-accent/10 text-accent"
                  : "text-text-sub hover:text-text hover:bg-surface-2"}`}
            >
              <Icon size={17} strokeWidth={1.6} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-border space-y-2">
        <div className="text-xs text-text-sub truncate">{providerName || "—"}</div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs text-text-dim hover:text-danger transition-colors"
        >
          <LogOut size={14} strokeWidth={1.6} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-surface border border-border
          flex items-center justify-center text-text-sub hover:text-text transition-colors"
      >
        {mobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 top-0 left-0 w-60 h-dvh bg-surface border-r border-border
          flex flex-col transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {nav}
      </aside>
    </>
  );
}
