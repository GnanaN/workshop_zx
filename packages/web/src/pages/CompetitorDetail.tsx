import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { EditCompetitorDialog } from '../components/dialogs/EditCompetitorDialog';
import { StateWrapper } from '../components/StateWrapper';

interface CompetitorDetail {
  id: string;
  name: string;
  domain: string;
  status: string;
  related_links: string[] | null;
  company_info: Record<string, string> | null;
  created_at: string;
}

interface Report {
  id: string;
  change_summary: { title: string; summary: string }[] | null;
  priority: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  monitoring: { text: '监控中', color: '#52c41a' },
  paused: { text: '已暂停', color: '#faad14' },
  collecting: { text: '采集中', color: '#1890ff' },
};

export function CompetitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [detail, setDetail] = useState<CompetitorDetail | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const fetchData = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      supabase.from('competitors').select('*').eq('id', id).single(),
      supabase.from('analysis_reports').select('id,change_summary,priority,created_at').eq('competitor_id', id).order('created_at', { ascending: false }).limit(20),
    ]).then(([{ data: comp, error: compErr }, { data: reps, error: repErr }]) => {
      if (compErr || repErr) {
        setError((compErr || repErr)?.message || '加载失败');
      } else {
        setDetail(comp);
        setReports(reps || []);
      }
      setLoading(false);
    }).catch((err) => {
      setError(err?.message || '网络请求失败');
      setLoading(false);
    });
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
    if (!id || !session) return;
    setRefreshing(true);
    await supabase.from('competitors').update({ status: 'collecting' }).eq('id', id);
    await supabase.from('collection_jobs').insert({ competitor_id: id, status: 'queued', user_id: session.user.id });
    setRefreshing(false);
    fetchData();
  };

  const handleTogglePause = async () => {
    if (!detail) return;
    const newStatus = detail.status === 'paused' ? 'monitoring' : 'paused';
    await supabase.from('competitors').update({ status: newStatus }).eq('id', detail.id);
    setDetail({ ...detail, status: newStatus });
  };

  const st = detail ? (STATUS_LABELS[detail.status] || { text: detail.status || '未知', color: '#999' }) : { text: '', color: '#999' };

  return (
    <StateWrapper loading={loading} error={error} onRetry={fetchData} empty={!loading && !error && !detail} emptyText="竞品不存在">
    {detail && <div style={{ maxWidth: 900 }}>
      {/* 头部 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>{detail.name}</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href={`https://${detail.domain}`} target="_blank" rel="noreferrer" style={{ color: '#1890ff', fontSize: 14 }}>{detail.domain}</a>
          <span style={{ fontSize: 12, color: st.color, background: `${st.color}15`, padding: '2px 10px', borderRadius: 10 }}>{st.text}</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowEdit(true)} style={{ padding: '5px 14px', border: '1px solid #d9d9d9', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
            编辑
          </button>
          <button onClick={handleTogglePause} style={{ padding: '5px 14px', border: '1px solid #d9d9d9', borderRadius: 5, background: '#fff', cursor: 'pointer', fontSize: 12 }}>
            {detail.status === 'paused' ? '恢复监控' : '暂停'}
          </button>
          <button onClick={handleRefresh} disabled={refreshing} style={{ padding: '5px 14px', border: 'none', borderRadius: 5, background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
            {refreshing ? '刷新中...' : '立即刷新'}
          </button>
        </div>
      </div>

      {/* 公司基本面 */}
      <section style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>公司基本面</h3>
        {detail.company_info && Object.keys(detail.company_info).length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
            {Object.entries(detail.company_info).map(([k, v]) => (
              <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ fontSize: 12, color: '#999' }}>{k}</span>
                <div style={{ fontSize: 14 }}>{v || '—'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 14, color: '#999' }}>暂无基本面数据。采集完成后自动填充。</p>
        )}
      </section>

      {/* 情报时间线 */}
      <section>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>最新情报</h3>
        {reports.length === 0 ? (
          <p style={{ fontSize: 14, color: '#999' }}>暂无分析报告。添加竞品后系统将自动采集和分析。</p>
        ) : (
          <div>
            {reports.map((r) => (
              <div key={r.id} style={{ padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 4,
                    color: r.priority === 'urgent' ? '#e74c3c' : r.priority === 'medium' ? '#faad14' : '#52c41a',
                    background: r.priority === 'urgent' ? '#fde8e8' : r.priority === 'medium' ? '#fef3cf' : '#e6f7e6',
                  }}>
                    {r.priority === 'urgent' ? '高优' : r.priority === 'medium' ? '中优' : '低优'}
                  </span>
                  <span style={{ fontSize: 12, color: '#999' }}>{new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
                {r.change_summary?.map((c, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</span>
                    <p style={{ fontSize: 13, color: '#666', margin: '2px 0 0' }}>{c.summary}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
      <EditCompetitorDialog open={showEdit} onClose={() => setShowEdit(false)} onSaved={fetchData} competitorId={id!} />
    </div>}
    </StateWrapper>
  );
}
