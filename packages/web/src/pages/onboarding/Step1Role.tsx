import { useState } from 'react';

const ROLES = ['产品营销经理', '产品经理', '市场营销经理', '创始人', '投资人', '其他'];

interface Props {
  onNext: (role: string) => void;
}

export function Step1Role({ onNext }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!selected) {
      setError('请选择一个角色');
      return;
    }
    onNext(selected);
  };

  return (
    <div style={{ maxWidth: 480, margin: '60px auto' }}>
      <div style={{ marginBottom: 8, color: '#999', fontSize: 13 }}>步骤 1 / 3</div>
      <h2>欢迎！让我们了解你的角色</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>以便为你定制情报解读角度。</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {ROLES.map((role) => (
          <label
            key={role}
            onClick={() => { setSelected(role); setError(''); }}
            style={{
              padding: '14px 16px',
              border: selected === role ? '2px solid #1a1a1a' : '1px solid #e5e7eb',
              borderRadius: 8,
              cursor: 'pointer',
              background: selected === role ? '#f5f5f5' : '#fff',
              fontWeight: selected === role ? 600 : 400,
            }}
          >
            <input type="radio" name="role" checked={selected === role} readOnly style={{ marginRight: 10 }} />
            {role}
          </label>
        ))}
      </div>

      {error && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 12 }}>{error}</p>}

      <button
        onClick={handleNext}
        style={{
          width: '100%', padding: '12px 0', background: '#1a1a1a', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer',
        }}
      >
        下一步
      </button>
    </div>
  );
}
