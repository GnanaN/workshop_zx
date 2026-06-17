import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  competitorId: string;
}

const INFO_FIELDS = [
  { key: 'industry', label: '行业' },
  { key: 'founded', label: '成立年份' },
  { key: 'headquarters', label: '总部' },
  { key: 'employees', label: '员工规模' },
  { key: 'funding', label: '融资情况' },
  { key: 'business_model', label: '商业模式' },
  { key: 'key_products', label: '核心产品' },
];

export function EditCompetitorDialog({ open, onClose, onSaved, competitorId }: Props) {
  const [info, setInfo] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !competitorId) return;
    supabase.from('competitors').select('name,domain,company_info').eq('id', competitorId).single().then(({ data }) => {
      if (data) {
        setName(data.name || '');
        setDomain(data.domain || '');
        setInfo(data.company_info || {});
      }
    });
  }, [open, competitorId]);

  if (!open) return null;

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('名称不能为空'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('competitors').update({
      name: name.trim(),
      domain: domain.trim(),
      company_info: info,
    }).eq('id', competitorId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
    onClose();
  };

  const setField = (key: string, value: string) => setInfo((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px' }}>编辑竞品</h3>

        <label style={{ fontSize: 13, fontWeight: 600 }}>名称</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, marginBottom: 10, fontSize: 14, boxSizing: 'border-box' }} />

        <label style={{ fontSize: 13, fontWeight: 600 }}>域名</label>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, marginBottom: 10, fontSize: 14, boxSizing: 'border-box' }} />

        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>公司基本面</p>
        {INFO_FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: '#999' }}>{f.label}</label>
            <input
              value={info[f.key] || ''}
              onChange={(e) => setField(f.key, e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        ))}

        {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>取消</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
