import { useState } from 'react';
import { supabase } from '../../lib/supabase';

const ERROR_TYPES = [
  '内容错误', '优先级错误', '竞品识别错误',
  '链接失效', '信息过时', '重复报告',
  '不相关', '其他',
];

export function FeedbackButtons({ reportId }: { reportId: string }) {
  const [submitted, setSubmitted] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorType, setErrorType] = useState('');

  const submit = async (type: string, error?: string) => {
    await supabase.from('feedbacks').insert({ report_id: reportId, type, error_type: error || null });
    setSubmitted(type);
    setShowError(false);
  };

  if (submitted) {
    return <p style={{ fontSize: 13, color: '#52c41a' }}>已记录反馈：{submitted === 'useful' ? '有用' : submitted === 'not_important' ? '不重要' : `有误 — ${errorType}`}</p>;
  }

  if (showError) {
    return (
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>请选择错误类型：</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {ERROR_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setErrorType(t)}
              style={{
                padding: '5px 12px', fontSize: 12, borderRadius: 14, border: '1px solid',
                borderColor: errorType === t ? '#e74c3c' : '#d9d9d9',
                color: errorType === t ? '#e74c3c' : '#666',
                background: errorType === t ? '#fde8e8' : '#fff',
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => errorType && submit('error', errorType)}
            disabled={!errorType}
            style={{ padding: '6px 18px', border: 'none', borderRadius: 6, background: errorType ? '#e74c3c' : '#ccc', color: '#fff', cursor: errorType ? 'pointer' : 'default', fontSize: 13 }}
          >
            确认提交
          </button>
          <button onClick={() => setShowError(false)} style={{ padding: '6px 18px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 16, display: 'flex', gap: 12 }}>
      <span style={{ fontSize: 13, color: '#999', marginRight: 4, alignSelf: 'center' }}>这条情报对你有用吗？</span>
      <button onClick={() => submit('useful')} style={{ padding: '6px 16px', border: '1px solid #52c41a', borderRadius: 6, background: '#fff', color: '#52c41a', cursor: 'pointer', fontSize: 13 }}>
        有用
      </button>
      <button onClick={() => submit('not_important')} style={{ padding: '6px 16px', border: '1px solid #d9d9d9', borderRadius: 6, background: '#fff', color: '#666', cursor: 'pointer', fontSize: 13 }}>
        不重要
      </button>
      <button onClick={() => setShowError(true)} style={{ padding: '6px 16px', border: '1px solid #e74c3c', borderRadius: 6, background: '#fff', color: '#e74c3c', cursor: 'pointer', fontSize: 13 }}>
        有误
      </button>
    </div>
  );
}
