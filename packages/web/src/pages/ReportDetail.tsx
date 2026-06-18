import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PriorityBadge } from '../components/inbox/PriorityBadge';
import { FeedbackButtons } from '../components/feedback/FeedbackButtons';

interface ReportDetail {
  id: string;
  competitor_name: string;
  competitor_domain: string;
  priority: string;
  created_at: string;
  change_summary: { title: string; summary: string }[] | null;
  strategic_intent: string;
  action_suggestions: { action: string; reason: string; priority: string }[] | null;
  source_url: string;
}

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;

    Promise.all([
      supabase.from('analysis_reports').select('*, competitors!inner(name,domain)').eq('id', reportId).single(),
      supabase.from('analysis_reports').update({ read_at: new Date().toISOString() }).eq('id', reportId).eq('read_at', null),
    ]).then(([{ data }]) => {
      if (data) {
        setReport({
          id: data.id,
          competitor_name: (data as any).competitors?.name || '—',
          competitor_domain: (data as any).competitors?.domain || '—',
          priority: data.priority,
          created_at: data.created_at,
          change_summary: data.change_summary,
          strategic_intent: data.strategic_intent,
          action_suggestions: data.action_suggestions,
          source_url: data.source_url,
        });
      }
      setLoading(false);
    }).catch((err) => {
      console.error('加载报告失败:', err);
      setLoading(false);
    });
  }, [reportId]);

  if (loading) return <p style={{ color: '#999' }}>加载中...</p>;
  if (!report) return <p style={{ color: '#999' }}>报告不存在</p>;

  return (
    <div style={{ maxWidth: 800 }}>
      <button onClick={() => navigate('/inbox')} style={{ border: 'none', background: 'none', color: '#1890ff', cursor: 'pointer', padding: 0, marginBottom: 12, fontSize: 13 }}>
        ← 返回收件箱
      </button>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>{report.competitor_name}</h2>
          <PriorityBadge priority={report.priority} />
        </div>
        <span style={{ fontSize: 13, color: '#999' }}>{new Date(report.created_at).toLocaleString('zh-CN')}</span>
      </div>

      {/* 变更摘要 */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>变更摘要</h3>
        {report.change_summary?.length ? (
          report.change_summary.slice(0, 3).map((c, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>• {c.title}</span>
              <p style={{ fontSize: 13, color: '#666', margin: '2px 0 0 12px' }}>{c.summary}</p>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13, color: '#999' }}>暂无变更</p>
        )}
      </section>

      {/* 战略意图 */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>战略意图</h3>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>
          {report.strategic_intent || '暂无分析'}
        </p>
      </section>

      {/* 行动建议 */}
      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>行动建议</h3>
        {report.action_suggestions?.length ? (
          report.action_suggestions.map((a, i) => (
            <div key={i} style={{ padding: '10px 14px', background: '#f9fafb', borderRadius: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{a.action}</span>
              <span style={{
                fontSize: 11, marginLeft: 8, padding: '0 6px', borderRadius: 3,
                color: a.priority === '高' ? '#e74c3c' : a.priority === '中' ? '#faad14' : '#52c41a',
                background: a.priority === '高' ? '#fde8e8' : a.priority === '中' ? '#fef3cf' : '#e6f7e6',
              }}>{a.priority}</span>
              <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>{a.reason}</p>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 13, color: '#999' }}>暂无建议</p>
        )}
      </section>

      {/* 原始链接 */}
      {report.source_url && (
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>原始链接</h3>
          <a href={report.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1890ff' }}>
            {report.competitor_domain}
          </a>
        </section>
      )}

      {/* 反馈 */}
      <FeedbackButtons reportId={report.id} />
    </div>
  );
}
