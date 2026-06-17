import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Competitor {
  name: string;
  domain: string;
  suggested: boolean;
}

interface Props {
  productUrl: string;
  userId: string;
  onComplete: (competitors: { name: string; domain: string }[]) => void;
  onBack: () => void;
}

export function Step3Competitors({ productUrl: _productUrl, userId, onComplete, onBack }: Props) {
  const [suggestions] = useState<Competitor[]>([]); // MVP: 空推荐列表
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualList, setManualList] = useState<{ name: string; domain: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSelect = (domain: string) => {
    const next = new Set(selected);
    next.has(domain) ? next.delete(domain) : next.add(domain);
    setSelected(next);
  };

  const addManual = () => {
    if (!manualName.trim() || !manualUrl.trim()) return;
    setManualList([...manualList, { name: manualName.trim(), domain: manualUrl.trim() }]);
    setManualName('');
    setManualUrl('');
  };

  const removeManual = (idx: number) => {
    setManualList(manualList.filter((_, i) => i !== idx));
  };

  const handleComplete = async () => {
    const picked = [
      ...suggestions.filter((s) => selected.has(s.domain)).map((s) => ({ name: s.name, domain: s.domain })),
      ...manualList,
    ];

    if (picked.length === 0) {
      setError('请至少添加 1 个竞品');
      return;
    }

    setLoading(true);
    const { data: inserted, error: err } = await supabase.from('competitors').insert(
      picked.map((c) => ({ name: c.name, domain: c.domain, user_id: userId }))
    ).select('id');
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      // Create initial collection jobs
      if (inserted) {
        for (const c of inserted) {
          await supabase.from('collection_jobs').insert({ competitor_id: c.id, user_id: userId, status: 'queued' });
        }
      }
      onComplete(picked);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <div style={{ marginBottom: 8, color: '#999', fontSize: 13 }}>步骤 3 / 3</div>
      <h2>导入竞品</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>添加你想监控的竞争对手。</p>

      {/* 推荐列表 */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4>推荐竞品（基于你的产品 URL）</h4>
          {suggestions.map((s) => (
            <label key={s.domain} style={{ display: 'block', padding: '8px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={selected.has(s.domain)} onChange={() => toggleSelect(s.domain)} />
              {' '}{s.name} <span style={{ color: '#999' }}>({s.domain})</span>
            </label>
          ))}
        </div>
      )}

      {/* 手动添加 */}
      <div style={{ marginBottom: 20 }}>
        <h4>手动添加</h4>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            placeholder="竞品名称"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            style={{ flex: 1, padding: 8, border: '1px solid #d9d9d9', borderRadius: 6 }}
          />
          <input
            placeholder="域名"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            style={{ flex: 1, padding: 8, border: '1px solid #d9d9d9', borderRadius: 6 }}
          />
          <button onClick={addManual} style={{ padding: '8px 16px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            添加
          </button>
        </div>
        {manualList.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
            <span>{m.name} <span style={{ color: '#999' }}>({m.domain})</span></span>
            <button onClick={() => removeManual(i)} style={{ border: 'none', background: 'none', color: '#e74c3c', cursor: 'pointer' }}>删除</button>
          </div>
        ))}
      </div>

      {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '12px 0', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8, cursor: 'pointer' }}>上一步</button>
        <button onClick={handleComplete} disabled={loading} style={{ flex: 1, padding: '12px 0', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? '处理中...' : '开始监控'}
        </button>
      </div>
    </div>
  );
}
