import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { session } = useAuth();
  const [hasCompetitors, setHasCompetitors] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.from('competitors').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setHasCompetitors((count || 0) > 0);
    });
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h2 style={{ marginBottom: 8, fontSize: 22 }}>
          {session?.user?.email ? `欢迎，${session.user.email}` : '欢迎使用 Lensmor Monitor'}
        </h2>
        <p style={{ color: '#666', lineHeight: 1.6, fontSize: 14 }}>
          {hasCompetitors === null ? '加载中...'
            : hasCompetitors ? '点击左侧竞品查看详情情报。'
              : '点击左下角「添加竞品」开始监控你的第一个竞争对手。'}
        </p>
      </div>
    </div>
  );
}
