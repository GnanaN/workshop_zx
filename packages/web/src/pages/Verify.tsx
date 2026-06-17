import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function VerifyPage() {
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState<{ id: number; message: string; created_at: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from('health_check')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (error) {
      setStatus('error');
      console.error(error);
    } else {
      setRecords(data || []);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleWrite = async () => {
    if (!message.trim()) return;
    setStatus('loading');
    const { error } = await supabase.from('health_check').insert({ message: message.trim() });
    if (error) {
      setStatus('error');
      console.error(error);
    } else {
      setStatus('ok');
      setMessage('');
      await fetchRecords();
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', fontFamily: 'monospace' }}>
      <h2>Supabase 通路验证</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          placeholder="输入测试消息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleWrite()}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={handleWrite} disabled={status === 'loading'} style={{ padding: '0 16px' }}>
          {status === 'loading' ? '...' : '写入'}
        </button>
      </div>
      {status === 'ok' && <p style={{ color: 'green' }}>写入成功 ✓</p>}
      {status === 'error' && <p style={{ color: 'red' }}>连接失败 ✗ —— 检查 SUPABASE_URL / SUPABASE_ANON_KEY</p>}

      <h3>最近记录（health_check 表）</h3>
      {records.length === 0 ? (
        <p>暂无记录，写一条试试</p>
      ) : (
        <ul>
          {records.map((r) => (
            <li key={r.id}>
              [{new Date(r.created_at).toLocaleString()}] {r.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
