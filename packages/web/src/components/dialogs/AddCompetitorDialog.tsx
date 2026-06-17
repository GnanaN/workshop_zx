import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export function AddCompetitorDialog({ open, onClose, onAdded }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { session } = useAuth();

  if (!open) return null;

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('名称不能为空'); return; }
    if (!domain.trim()) { setError('域名不能为空'); return; }

    setSaving(true);
    const { data, error: err } = await supabase.from('competitors').insert({
      name: name.trim(),
      domain: domain.trim(),
      status: 'monitoring',
      user_id: session?.user?.id,
    }).select('id').single();
    setSaving(false);

    if (err) { setError(err.message); return; }

    if (data && session) {
      await supabase.from('collection_jobs').insert({
        competitor_id: data.id,
        user_id: session.user.id,
        status: 'queued',
      });
    }

    setName(''); setDomain('');
    onAdded();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 420, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px' }}>添加竞品</h3>
        <input
          placeholder="竞品名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, marginBottom: 10, fontSize: 14, boxSizing: 'border-box' }}
        />
        <input
          placeholder="域名（如 example.com）"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: 6, marginBottom: 8, fontSize: 14, boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={onClose} style={{ padding: '8px 20px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>取消</button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>
            {saving ? '添加中...' : '添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
