import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ReportCard } from '../components/inbox/ReportCard';
import { InboxFilters } from '../components/inbox/InboxFilters';
import { StateWrapper } from '../components/StateWrapper';

interface Report {
  id: string;
  competitor_name: string;
  competitor_domain: string;
  priority: string;
  created_at: string;
  read_at: string | null;
  summary: string;
  competitor_id: string;
}

export function InboxPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [competitors, setCompetitors] = useState<{ id: string; name: string }[]>([]);
  const [priority, setPriority] = useState('');
  const [competitorId, setCompetitorId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('competitors').select('id,name').order('name'),
      supabase
        .from('analysis_reports')
        .select('id, priority, created_at, read_at, change_summary, competitor_id, competitors!inner(name,domain)')
        .order('created_at', { ascending: false })
        .limit(50),
    ]).then(([{ data: comps, error: compErr }, { data: reps, error: repErr }]) => {
      if (compErr || repErr) {
        setError((compErr || repErr)?.message || '加载失败');
      } else {
        setCompetitors(comps || []);
        setReports((reps || []).map((r: any) => ({
          id: r.id,
          competitor_name: r.competitors?.name || '—',
          competitor_domain: r.competitors?.domain || '—',
          priority: r.priority,
          created_at: r.created_at,
          read_at: r.read_at,
          competitor_id: r.competitor_id,
          summary: r.change_summary?.[0]?.summary || r.change_summary?.[0]?.title || '(暂无摘要)',
        })));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = reports.filter((r) => {
    if (priority && r.priority !== priority) return false;
    if (competitorId && r.competitor_id !== competitorId) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ marginBottom: 16, fontSize: 20 }}>情报收件箱</h2>

      <InboxFilters
        priority={priority} onPriorityChange={setPriority}
        competitorId={competitorId} onCompetitorChange={setCompetitorId}
        competitors={competitors}
      />

      <StateWrapper
        loading={loading}
        error={error}
        onRetry={fetchData}
        empty={!loading && !error && filtered.length === 0}
        emptyText={reports.length === 0 ? '暂无情报报告' : '没有匹配的情报'}
        emptyHint={reports.length === 0 ? '添加竞品后，系统将自动采集并生成分析报告。' : '尝试调整筛选条件'}
      >
        {filtered.map((r) => (
          <ReportCard
            key={r.id}
            id={r.id}
            competitorName={r.competitor_name}
            competitorDomain={r.competitor_domain}
            priority={r.priority}
            created_at={r.created_at}
            read_at={r.read_at}
            summary={r.summary}
            onClick={() => navigate(`/inbox/${r.id}`)}
          />
        ))}
      </StateWrapper>
    </div>
  );
}
