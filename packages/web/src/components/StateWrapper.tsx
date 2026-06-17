import { ReactNode } from 'react';

interface Props {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty?: boolean;
  emptyText?: string;
  emptyHint?: string;
  children: ReactNode;
}

export function StateWrapper({ loading, error, onRetry, empty, emptyText, emptyHint, children }: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
        <span style={{ color: '#999', fontSize: 14 }}>加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ color: '#e74c3c', fontSize: 14, marginBottom: 8 }}>出错了：{error}</p>
        {onRetry && (
          <button onClick={onRetry} style={{ padding: '6px 18px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            重试
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <p style={{ fontSize: 15, color: '#999', marginBottom: 4 }}>{emptyText || '暂无数据'}</p>
        {emptyHint && <p style={{ fontSize: 13, color: '#bbb' }}>{emptyHint}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
