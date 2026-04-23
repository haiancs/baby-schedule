import { useEffect, useMemo, useState } from 'react';
import { getWeeklyEvents } from '../api/eventSync';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const WEEKDAY_SHORT = ['日', '一', '二', '三', '四', '五', '六'];

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()} ${WEEKDAY_SHORT[d.getDay()]}`;
}

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function WeeklyPage() {
  const { logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { startDate, endDate, dateLabels } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const labels = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) labels.push(format(d));
    return { startDate: format(start), endDate: format(today), dateLabels: labels };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const data = await getWeeklyEvents(startDate, endDate);
        if (active) setEvents(data);
      } catch { if (active) setError('获取周数据失败'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    let sleepH = 0, playH = 0, feedMl = 0, feeds = 0, food = 0, poop = 0, diaper = 0;
    events.forEach(e => {
      if (e.type === 'sleep') sleepH += (e.duration || 1);
      if (e.type === 'play') playH += (e.duration || 1);
      if (e.type === 'feed') { feedMl += (e.amountMl || 0); feeds += 1; }
      if (e.type === 'food') food += 1;
      if (e.type === 'poop') poop += 1;
      if (e.type === 'diaper') diaper += 1;
    });
    const days = dateLabels.length;
    return {
      avgSleep: sleepH / days, avgPlay: playH / days,
      avgFeedMl: Math.round(feedMl / days), avgFeeds: Math.round(feeds / days),
      avgFood: Math.round(food / days), avgPoop: Math.round(poop / days), avgDiaper: Math.round(diaper / days),
    };
  }, [events, dateLabels.length]);

  const daily = useMemo(() => dateLabels.map(ds => {
    const de = events.filter(e => {
      const d = new Date(e.startTime);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === ds;
    });
    return {
      dateStr: ds, dayEvents: de,
      sleepH: de.filter(e => e.type === 'sleep').reduce((s, e) => s + (e.duration || 1), 0),
      feedMl: de.filter(e => e.type === 'feed').reduce((s, e) => s + (e.amountMl || 0), 0),
      feedCount: de.filter(e => e.type === 'feed').length,
      foodCount: de.filter(e => e.type === 'food').length,
      poopCount: de.filter(e => e.type === 'poop').length,
      diaperCount: de.filter(e => e.type === 'diaper').length,
      playH: de.filter(e => e.type === 'play').reduce((s, e) => s + (e.duration || 1), 0),
    };
  }), [events, dateLabels]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">📊 周报总览</h1>
          <div className="flex items-center gap-2">
            <Link to="/daily" className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">返回日视图</Link>
            <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="退出登录">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4">
        {loading && <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" /></div>}
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-4">{error}</div>}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-1">日均睡眠</p>
                <p className="text-2xl font-bold text-indigo-500">{formatHours(stats.avgSleep)}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-1">日均喂奶</p>
                <p className="text-xl font-bold text-amber-500">{stats.avgFeedMl}ml</p>
                <p className="text-xs text-gray-400">{stats.avgFeeds}次/天</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-1">日均辅食</p>
                <p className="text-2xl font-bold text-orange-500">{stats.avgFood}次</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-1">日均大便</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.avgPoop}次</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-1">日均换尿布</p>
                <p className="text-2xl font-bold text-sky-500">{stats.avgDiaper}次</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-medium text-gray-400 mb-1">日均玩耍</p>
                <p className="text-2xl font-bold text-emerald-500">{formatHours(stats.avgPlay)}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50"><h2 className="text-sm font-semibold text-gray-900">每日详情</h2></div>
              <div className="divide-y divide-gray-50">
                {daily.map(d => (
                  <div key={d.dateStr} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{formatDateLabel(d.dateStr)}</span>
                      <span className="text-xs text-gray-400">{d.dayEvents.length}条</span>
                    </div>
                    {d.dayEvents.length === 0 ? <p className="text-xs text-gray-300">暂无记录</p> : (
                      <div className="flex gap-2 flex-wrap">
                        {d.sleepH > 0 && <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg">😴 {formatHours(d.sleepH)}</span>}
                        {d.feedCount > 0 && <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-lg">🍼 {d.feedMl}ml ({d.feedCount}次)</span>}
                        {d.foodCount > 0 && <span className="text-xs bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">🥣 {d.foodCount}次</span>}
                        {d.poopCount > 0 && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-lg">💩 {d.poopCount}次</span>}
                        {d.diaperCount > 0 && <span className="text-xs bg-sky-50 text-sky-600 px-2 py-1 rounded-lg">🩲 {d.diaperCount}次</span>}
                        {d.playH > 0 && <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg">🎮 {formatHours(d.playH)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-400">数据已结构化存储，支持后续接入 AI 分析</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
