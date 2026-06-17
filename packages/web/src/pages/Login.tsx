import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // 已登录用户直接跳转
  useEffect(() => {
    if (session) navigate('/onboarding', { replace: true });
  }, [session, navigate]);

  const handleSubmit = async () => {
    setError('');

    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    setLoading(true);
    if (tab === 'login') {
      const { error: err } = await signIn(email, password);
      setLoading(false);
      if (err) {
        if (err.message.includes('Invalid login')) setError('邮箱或密码错误');
        else setError(err.message);
      } else {
        navigate('/onboarding', { replace: true });
      }
    } else {
      const { data, error: err } = await signUp(email, password);
      setLoading(false);
      if (err) {
        if (err.message.includes('already registered')) setError('该邮箱已注册，请直接登录');
        else setError(err.message);
      } else if (data.session) {
        navigate('/onboarding', { replace: true });
      } else {
        setError('注册成功！请检查邮箱并点击确认链接（或关闭 Supabase 邮箱确认后重试）');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5' }}>
      <div style={{ width: 380, padding: 32, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 4 }}>Lensmor Monitor</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 24 }}>竞品情报监控平台</p>

        {/* Tab 切换 */}
        <div style={{ display: 'flex', marginBottom: 20, borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => { setTab('login'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === 'login' ? 600 : 400,
              color: tab === 'login' ? '#1a1a1a' : '#999',
              borderBottom: tab === 'login' ? '2px solid #1a1a1a' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            登录
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            style={{
              flex: 1, padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: tab === 'register' ? 600 : 400,
              color: tab === 'register' ? '#1a1a1a' : '#999',
              borderBottom: tab === 'register' ? '2px solid #1a1a1a' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            注册
          </button>
        </div>

        {/* 表单 */}
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: '100%', padding: '10px 12px', marginBottom: 10, border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: '100%', padding: '10px 12px', marginBottom: 8, border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />

        {error && (
          <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 0', marginTop: 8,
            background: loading ? '#999' : '#1a1a1a', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 15, cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
        </button>
      </div>
    </div>
  );
}
