import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Competitor {
  id: string;
  name: string;
  domain: string;
  status: string;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  monitoring: { text: '监控中', color: '#52c41a' },
  paused: { text: '已暂停', color: '#faad14' },
  collecting: { text: '采集中', color: '#1890ff' },
};

export function CompetitorSidebar() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCompetitors = async () => {
    const { data } = await supabase
      .from('competitors')
      .select('id,name,domain,status')
      .order('created_at', { ascending: false });
    setCompetitors(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCompetitors(); }, []);

  if (loading) return <div style={{ padding: 16, color: '#999' }}>加载中...</div>;

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ padding: '0 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>我的竞品</span>
        <span style={{ fontSize: 12, color: '#999' }}>{competitors.length}</span>
      </div>
      {competitors.length === 0 ? (
        <p style={{ padding: '0 16px', fontSize: 13, color: '#999' }}>暂无竞品</p>
      ) : (
        competitors.map((c) => {
          const st = STATUS_LABELS[c.status] || { text: c.status || '监控中', color: '#999' };
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/dashboard/competitors/${c.id}`)}
              style={{
                padding: '10px 16px', cursor: 'pointer',
                borderLeft: '3px solid transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{c.domain}</div>
              <span style={{ fontSize: 11, color: st.color, background: `${st.color}15`, padding: '1px 8px', borderRadius: 10 }}>
                {st.text}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
