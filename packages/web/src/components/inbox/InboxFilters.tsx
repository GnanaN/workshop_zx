interface Props {
  priority: string;
  onPriorityChange: (v: string) => void;
  competitorId: string;
  onCompetitorChange: (v: string) => void;
  competitors: { id: string; name: string }[];
}

export function InboxFilters({ priority, onPriorityChange, competitorId, onCompetitorChange, competitors }: Props) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, background: '#fff' }}
      >
        <option value="">全部优先级</option>
        <option value="urgent">高优</option>
        <option value="medium">中优</option>
        <option value="low">低优</option>
      </select>
      <select
        value={competitorId}
        onChange={(e) => onCompetitorChange(e.target.value)}
        style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, background: '#fff' }}
      >
        <option value="">全部竞品</option>
        {competitors.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
