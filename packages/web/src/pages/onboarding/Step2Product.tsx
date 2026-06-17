import { useState } from 'react';

interface Props {
  onNext: (data: { name: string; url: string; description: string; audience: string; selling: string; advantages: string; strategy: string }) => void;
  onBack: () => void;
}

export function Step2Product({ onNext, onBack }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('');
  const [selling, setSelling] = useState('');
  const [advantages, setAdvantages] = useState('');
  const [strategy, setStrategy] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isValidUrl = (v: string) => /^https?:\/\/.+/.test(v);

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '产品名称不能为空';
    if (!url.trim()) e.url = '产品 URL 不能为空';
    else if (!isValidUrl(url.trim())) e.url = '请输入有效的 URL（以 http:// 或 https:// 开头）';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    onNext({ name: name.trim(), url: url.trim(), description, audience, selling, advantages, strategy });
  };

  const inputStyle = (field: string) => ({
    width: '100%', padding: '10px 12px', marginBottom: 4,
    border: errors[field] ? '1px solid #e74c3c' : '1px solid #d9d9d9',
    borderRadius: 6, fontSize: 14, boxSizing: 'border-box' as const,
  });

  return (
    <div style={{ maxWidth: 480, margin: '40px auto' }}>
      <div style={{ marginBottom: 8, color: '#999', fontSize: 13 }}>步骤 2 / 3</div>
      <h2>告诉我们你的产品信息</h2>
      <p style={{ color: '#666', marginBottom: 24 }}>系统会站在你的角度分析竞品变化。</p>

      <label style={{ fontSize: 13, fontWeight: 600 }}>产品名称 *</label>
      <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle('name')} />
      {errors.name && <p style={{ color: '#e74c3c', fontSize: 12, marginBottom: 10 }}>{errors.name}</p>}

      <label style={{ fontSize: 13, fontWeight: 600 }}>产品 URL *</label>
      <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" style={inputStyle('url')} />
      {errors.url && <p style={{ color: '#e74c3c', fontSize: 12, marginBottom: 10 }}>{errors.url}</p>}

      <label style={{ fontSize: 13, fontWeight: 600 }}>一句话描述</label>
      <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle('')} />

      <label style={{ fontSize: 13, fontWeight: 600 }}>目标受众</label>
      <input value={audience} onChange={(e) => setAudience(e.target.value)} style={inputStyle('')} />

      <label style={{ fontSize: 13, fontWeight: 600 }}>核心卖点</label>
      <input value={selling} onChange={(e) => setSelling(e.target.value)} style={inputStyle('')} />

      <label style={{ fontSize: 13, fontWeight: 600 }}>竞争优势</label>
      <input value={advantages} onChange={(e) => setAdvantages(e.target.value)} style={inputStyle('')} />

      <label style={{ fontSize: 13, fontWeight: 600 }}>当前阶段战略目标</label>
      <input value={strategy} onChange={(e) => setStrategy(e.target.value)} style={inputStyle('')} />

      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button onClick={onBack} style={{ flex: 1, padding: '12px 0', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 8, cursor: 'pointer' }}>上一步</button>
        <button onClick={handleNext} style={{ flex: 1, padding: '12px 0', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>下一步</button>
      </div>
    </div>
  );
}
