const CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: '高优', color: '#e74c3c', bg: '#fde8e8' },
  medium: { label: '中优', color: '#faad14', bg: '#fef3cf' },
  low: { label: '低优', color: '#52c41a', bg: '#e6f7e6' },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const c = CONFIG[priority] || CONFIG.low;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 4, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}
