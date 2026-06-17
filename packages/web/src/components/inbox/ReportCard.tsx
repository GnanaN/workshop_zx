import { PriorityBadge } from './PriorityBadge';

interface ReportCardProps {
  id: string;
  competitorName: string;
  competitorDomain: string;
  priority: string;
  created_at: string;
  read_at: string | null;
  summary: string;
  onClick: () => void;
}

export function ReportCard({ competitorName, competitorDomain, priority, created_at, read_at, summary, onClick }: ReportCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer',
        background: read_at ? '#fff' : '#fafbff', transition: 'box-shadow 0.15s',
        marginBottom: 8,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!read_at && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#1890ff', flexShrink: 0 }} />}
          <span style={{ fontSize: 14, fontWeight: read_at ? 400 : 600 }}>{competitorName}</span>
          <span style={{ fontSize: 12, color: '#999' }}>({competitorDomain})</span>
        </div>
        <PriorityBadge priority={priority} />
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>{summary}</p>
      <span style={{ fontSize: 11, color: '#bbb', marginTop: 8, display: 'inline-block' }}>{new Date(created_at).toLocaleDateString('zh-CN')}</span>
    </div>
  );
}
