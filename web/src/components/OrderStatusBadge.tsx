const STYLES: Record<string, string> = {
  PENDING: 'bg-gold/25 text-gold',
  PROCESSING: 'bg-sky/25 text-sky-deep',
  SHIPPED: 'bg-sky/40 text-sky-deep',
  DELIVERED: 'bg-success/20 text-success',
  CANCELLED: 'bg-danger/15 text-danger',
};

export function OrderStatusBadge({ status }: { status: string }) {
  const label = status.charAt(0) + status.slice(1).toLowerCase();
  return (
    <span className={`rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${STYLES[status] || 'bg-fog-card text-ink-soft'}`}>
      {label}
    </span>
  );
}
