import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CompetitorSidebar } from '../components/competitors/CompetitorSidebar';
import { AddCompetitorDialog } from '../components/dialogs/AddCompetitorDialog';

export function MainLayout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [sidebarKey, setSidebarKey] = useState(0);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleAdded = () => setSidebarKey((k) => k + 1);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: 260, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Lensmor</h2>
        </div>
        <nav style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>竞品</span>
          <span style={{ fontSize: 13, color: '#999', cursor: 'pointer' }} onClick={() => navigate('/inbox')}>收件箱</span>
        </nav>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <CompetitorSidebar key={sidebarKey} />
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setShowAdd(true)}
            style={{ width: '100%', padding: '8px 0', border: '1px solid #1a1a1a', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}
          >
            + 添加竞品
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={handleLogout} style={{ border: 'none', background: 'none', color: '#999', cursor: 'pointer', fontSize: 13 }}>退出登录</button>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </div>
      </main>
      <AddCompetitorDialog open={showAdd} onClose={() => setShowAdd(false)} onAdded={handleAdded} />
    </div>
  );
}
