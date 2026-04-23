import { useEffect, useRef, useState } from 'react';
import { cloudbase } from '../utils/cloudbase';
import { getWeeklyDailyDocs } from '../api/eventSync';
import { getBabyProfile } from '../api/babyProfile';

function getWeekDateRange() {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6);
  const start = startDate.toISOString().split('T')[0];
  return { startDate: start, endDate: endDate };
}

export function buildPlainText(dailyDocs) {
  if (!dailyDocs || dailyDocs.length === 0) return '本周暂无作息数据';
  const sorted = [...dailyDocs].sort((a, b) => a.date.localeCompare(b.date));
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  return sorted.map(doc => {
    const dow = dayNames[new Date(doc.date + 'T00:00:00').getDay()];
    const events = (doc.events || []).map(e => {
      return `  - ${e.time || ''} ${e.type || ''}${e.note ? ' | ' + e.note : ''}${e.duration ? ' (' + e.duration + '小时)' : ''}${e.amountMl ? ' ' + e.amountMl + 'ml' : ''}`;
    }).join('\n');
    return `【${doc.date} (${dow})】\n共 ${(doc.events || []).length} 条记录\n${events || '  (无记录)'}`;
  }).join('\n\n');
}

function buildPrompt(babyProfile, plainText) {
  const babyInfo = babyProfile ? `宝宝信息：
- 名字：${babyProfile.name || '未填写'}
- 性别：${babyProfile.gender === 'male' ? '男宝' : '女宝'}
- 生日：${babyProfile.birthday || '未填写'}${babyProfile.birthday ? '（' + calcAge(babyProfile.birthday) + '）' : ''}
- 出生身长：${babyProfile.birthHeight || '?'} cm
- 出生体重：${babyProfile.birthWeight || '?'} kg
- 当前身长：${babyProfile.height || '?'} cm
- 当前体重：${babyProfile.weight || '?'} kg` : '宝宝信息：未填写（无法进行针对性分析）';

  return `你是一位专业的婴幼儿成长顾问，擅长分析宝宝的作息规律并给出科学建议。

${babyInfo}

以下是宝宝本周的作息记录（共7天）：

${plainText}

请根据以上数据进行分析，给出：
1. 【作息总结】本周作息整体情况
2. 【规律发现】发现的规律和特点（如睡眠时间、喂奶间隔等）
3. 【问题提醒】需要关注的问题（如睡眠不规律、喂奶量偏少等）
4. 【科学建议】具体的改进建议

请用温暖、亲切的口吻回复，适合给家长阅读。回复语言与数据语言一致（中文数据用中文回复）。`;
}

function calcAge(birthday) {
  if (!birthday) return '';
  const birth = new Date(birthday);
  const now = new Date();
  const totalMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (totalMonths < 1) {
    const days = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    return `${days}天`;
  }
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years > 0) return `${years}岁${months > 0 ? months + '月' : ''}`;
  return `${months}个月`;
}

export default function AIAnalysisModal({ isOpen, onClose }) {
  const [phase, setPhase] = useState('loading'); // loading | streaming | done | error
  const [analysisText, setAnalysisText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [isOpen]);

  const runAnalysis = async () => {
    setPhase('loading');
    setAnalysisText('');
    setErrorMsg('');

    try {
      const { startDate, endDate } = getWeekDateRange();
      const [weeklyData, babyProfile] = await Promise.all([
        getWeeklyDailyDocs(startDate, endDate),
        getBabyProfile()
      ]);

      const plainText = buildPlainText(weeklyData);
      const prompt = buildPrompt(babyProfile, plainText);

      setPhase('streaming');

      const res = await cloudbase
        .ai()
        .createModel('minimax-custom')
        .streamText({
          model: 'minimax-m2.7',
          messages: [{ role: 'user', content: prompt }]
        });

      abortRef.current = res;
      let fullText = '';

      for await (const chunk of res.dataStream) {
        const reasoning = chunk?.choices?.[0]?.delta?.reasoning_content;
        const content = chunk?.choices?.[0]?.delta?.content;
        if (reasoning) fullText += reasoning;
        if (content) fullText += content;
        setAnalysisText(fullText);
      }

      setPhase('done');
    } catch (e) {
      if (e?.name === 'AbortError' || e?.message?.includes('abort')) {
        return;
      }
      console.error('AI analysis error:', e);
      setErrorMsg(e?.message || '分析失败，请稍后重试');
      setPhase('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">🤖 AI 作息分析</h2>
          <button
            onClick={() => { abortRef.current?.abort(); onClose(); }}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-[200px]">
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="loading loading-spinner loading-lg text-blue-500"></div>
              <p className="text-sm text-gray-500">正在分析本周作息数据...</p>
            </div>
          )}

          {(phase === 'streaming' || phase === 'done') && (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {analysisText || <span className="text-gray-400 italic">生成中...</span>}
              {phase === 'streaming' && <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"> </span>}
            </div>
          )}

          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <span className="text-4xl">😢</span>
              <p className="text-sm text-red-500">{errorMsg}</p>
              <button
                onClick={runAnalysis}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                点击重试
              </button>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {phase === 'done' && '分析完成'}
            {phase === 'streaming' && '生成中...'}
          </span>
          <button
            onClick={() => { abortRef.current?.abort(); onClose(); }}
            className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
