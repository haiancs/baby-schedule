import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cloudbase } from '../utils/cloudbase';

export default function AIHistoryModal({ isOpen, onClose }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchRecords();
    }
  }, [isOpen]);

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await cloudbase.database().collection('ai_analysis_records')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      setRecords(res.data || []);
      setCurrentIndex(0);
    } catch (e) {
      console.error('Fetch history failed:', e);
      setError('获取历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentRecord = records[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">📑 历史 AI 分析</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 bg-gray-50 flex flex-col items-center min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 h-full">
              <div className="loading loading-spinner loading-lg text-blue-500"></div>
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center h-full">
              <span className="text-4xl">😢</span>
              <p className="text-sm text-red-500">{error}</p>
              <button onClick={fetchRecords} className="text-sm text-blue-500 hover:text-blue-600 font-medium">重试</button>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 h-full">
              <span className="text-4xl">📭</span>
              <p className="text-sm text-gray-500">暂无历史分析记录</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
                <div className="text-xs font-medium text-gray-400 mb-3 flex items-center justify-between">
                  <span>📅 {currentRecord.dateRange || '未知日期'}</span>
                  <span>{new Date(currentRecord.createdAt).toLocaleString()}</span>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed overflow-y-auto flex-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentRecord.content}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-5">
                <button
                  disabled={currentIndex === records.length - 1}
                  onClick={() => setCurrentIndex(i => i + 1)}
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  &larr; 更早
                </button>
                <span className="text-sm font-medium text-gray-500">
                  {records.length - currentIndex} / {records.length}
                </span>
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(i => i - 1)}
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  较新 &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
