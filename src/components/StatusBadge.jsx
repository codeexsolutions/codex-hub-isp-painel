const ESTILOS = {
  pendente: "text-warning border-warning/30 bg-warning/10",
  utilizado: "text-success border-success/30 bg-success/10",
  cancelado: "text-danger border-danger/30 bg-danger/10",
};

const LABELS = {
  pendente: "Pendente",
  utilizado: "Validado",
  cancelado: "Cancelado",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ESTILOS[status] || "text-text-dim border-border bg-surface-2"}`}>
      {LABELS[status] || status}
    </span>
  );
}
