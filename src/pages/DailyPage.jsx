import { useEffect, useMemo, useState, useCallback } from 'react';
import { getDailyEvents, saveDailyEvents } from '../api/eventSync';
import { useAuth } from '../contexts/AuthContext';
import DailyTimeline from '../components/DailyTimeline';
import BabyProfileModal from '../components/BabyProfileModal';
import { Link } from 'react-router-dom';

export const EVENT_META = {
  sleep:  { emoji: '😴', label: '睡觉',   color: 'bg-indigo-100 text-indigo-700' },
  feed:   { emoji: '🍼', label: '喂奶',   color: 'bg-amber-100 text-amber-700' },
  food:   { emoji: '🥣', label: '辅食',   color: 'bg-orange-100 text-orange-700' },
  poop:   { emoji: '💩', label: '大便',   color: 'bg-yellow-100 text-yellow-700' },
  diaper: { emoji: '🩲', label: '换尿布', color: 'bg-sky-100 text-sky-700' },
  play:   { emoji: '🎮', label: '玩耍',   color: 'bg-emerald-100 text-emerald-700' },
};

export const POOP_COLORS = {
  yellow: { label: '黄色', dot: 'bg-yellow-400', ring: 'ring-yellow-400', hex: '#FACC15' },
  green:  { label: '绿色', dot: 'bg-green-500',  ring: 'ring-green-500',  hex: '#22C55E' },
  other:  { label: '其他', dot: 'bg-gray-500',    ring: 'ring-gray-500',   hex: '#6B7280' },
};

export const POINT_EVENT_TYPES = ['feed', 'food', 'poop', 'diaper'];
export const DURATION_EVENT_TYPES = ['sleep', 'play'];

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAY_NAMES[d.getDay()]}`;
}

function getDateStr(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getTodayStr() {
  return getDateStr(new Date());
}

function formatTimeForInput(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function applyTimeToISO(isoString, timeStr) {
  if (!isoString || !timeStr) return isoString;
  const [hh, mm] = timeStr.split(':').map(Number);
  const d = new Date(isoString);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function roundToNearest15Min(dateObj) {
  const ms = 1000 * 60 * 15;
  return new Date(Math.round(dateObj.getTime() / ms) * ms);
}

function formatDuration(hours) {
  if (!hours) return '';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}小时${m}分钟`;
  if (h > 0) return `${h}小时`;
  return `${m}分钟`;
}

export function formatRating(rating) {
  if (rating == null) return '';
  if (rating === Math.floor(rating)) return `${rating}`;
  return `${Math.floor(rating)}½`;
}

function enrichEventForStorage(evt) {
  const enriched = { ...evt };
  if (enriched.startTime && enriched.duration) {
    const start = new Date(enriched.startTime);
    enriched.endTime = new Date(start.getTime() + enriched.duration * 3600000).toISOString();
    enriched.durationMinutes = Math.round(enriched.duration * 60);
  }
  if (!enriched.createdAt) enriched.createdAt = new Date().toISOString();
  enriched.updatedAt = new Date().toISOString();
  return enriched;
}

function eventSubLabel(evt) {
  const parts = [];
  if (evt.duration) parts.push(formatDuration(evt.duration));
  if (evt.amountMl) parts.push(`${evt.amountMl}ml`);
  if (evt.type === 'poop' && evt.rating != null) parts.push(`x${formatRating(evt.rating)}`);
  if (evt.type === 'food' && evt.rating != null) parts.push(`x${formatRating(evt.rating)}`);
  return parts.join(' · ');
}

export default function DailyPage() {
  const { logout } = useAuth();
  const [date, setDate] = useState(getTodayStr);
  const isToday = date === getTodayStr();
  const [showProfile, setShowProfile] = useState(false);

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [timeDraft, setTimeDraft] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const sortedEvents = useMemo(() =>
    [...events].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [events]
  );

  const navigateDate = useCallback((offset) => {
    setDate(prev => {
      const d = new Date(prev + 'T00:00:00');
      d.setDate(d.getDate() + offset);
      return getDateStr(d);
    });
    setEditingId(null);
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingEvents(true);
    (async () => {
      try {
        const data = await getDailyEvents(date);
        if (active) setEvents(data);
      } catch {
        if (active) setEvents([]);
      } finally {
        if (active) setLoadingEvents(false);
      }
    })();
    return () => { active = false; };
  }, [date]);

  const persist = async (nextEvents) => {
    setError('');
    setSaving(true);
    try {
      const enriched = nextEvents.map(enrichEventForStorage);
      await saveDailyEvents(date, enriched);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1200);
    } catch (e) {
      setError(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const createId = () => {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const handleAdd = async (type) => {
    const t = String(type).toLowerCase();
    const now = new Date();
    const baseDate = new Date(date + 'T00:00:00');
    const refTime = isToday ? now : new Date(baseDate.getTime() + 12 * 3600000);
    const nowRounded = roundToNearest15Min(refTime).toISOString();
    const duration = DURATION_EVENT_TYPES.includes(t) ? 1 : undefined;
    const newEvent = {
      id: createId(),
      type: t,
      startTime: nowRounded,
      ...(duration ? { duration } : {}),
      ...(t === 'feed' ? { amountMl: 60 } : {}),
      ...(t === 'food' ? { rating: 1 } : {}),
      ...(t === 'poop' ? { rating: 1, poopColor: 'yellow' } : {}),
    };
    const nextEvents = [...events, newEvent];
    setEvents(nextEvents);
    await persist(nextEvents);
  };

  const handleEventAddFromCanvas = async (evtData) => {
    const newEvent = { id: createId(), ...evtData };
    const nextEvents = [...events, newEvent];
    setEvents(nextEvents);
    await persist(nextEvents);
  };

  const handleDelete = async (id) => {
    const nextEvents = events.filter(e => e.id !== id);
    setEvents(nextEvents);
    setEditingId(null);
    await persist(nextEvents);
  };

  const startEdit = (evt) => {
    setEditingId(evt.id);
    setNoteDraft(evt.note || '');
    setTimeDraft(formatTimeForInput(evt.startTime));
  };

  const cancelEdit = () => { setEditingId(null); setNoteDraft(''); setTimeDraft(''); };

  const saveEdit = async () => {
    const nextEvents = events.map((evt) => {
      if (evt.id === editingId) return { ...evt, note: noteDraft, startTime: applyTimeToISO(evt.startTime, timeDraft) };
      return evt;
    });
    setEvents(nextEvents);
    cancelEdit();
    await persist(nextEvents);
  };

  const handleEventUpdate = async (id, updates) => {
    const nextEvents = events.map(e => e.id === id ? { ...e, ...updates } : e);
    setEvents(nextEvents);
    await persist(nextEvents);
  };

  const dailySummary = useMemo(() => {
    const totalSleep = events.filter(e => e.type === 'sleep').reduce((s, e) => s + (e.duration || 1), 0);
    const totalFeedMl = events.filter(e => e.type === 'feed').reduce((s, e) => s + (e.amountMl || 0), 0);
    const feedCount = events.filter(e => e.type === 'feed').length;
    const foodCount = events.filter(e => e.type === 'food').length;
    const poopCount = events.filter(e => e.type === 'poop').length;
    const diaperCount = events.filter(e => e.type === 'diaper').length;
    const playTime = events.filter(e => e.type === 'play').reduce((s, e) => s + (e.duration || 1), 0);
    return { totalSleep, totalFeedMl, feedCount, foodCount, poopCount, diaperCount, playTime };
  }, [events]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">👶 宝宝作息</h1>
          <div className="flex items-center gap-2">
            {saving && <span className="text-xs text-gray-400">保存中...</span>}
            {justSaved && <span className="text-xs text-emerald-500 font-medium">已保存 ✓</span>}
            <button onClick={() => setShowProfile(true)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="宝宝信息">👶</button>
            <Link to="/weekly" className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">周报</Link>
            <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="退出登录">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3-3m0 0l-3-3m3 3H9"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 flex flex-col gap-4">
        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        {/* Date Nav */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2.5">
          <button onClick={() => navigateDate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" aria-label="前一天">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{formatDate(date)}</span>
            {isToday && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">今天</span>}
          </div>
          <div className="flex items-center gap-1">
            {!isToday && (
              <button onClick={() => setDate(getTodayStr())} className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors mr-1">回到今天</button>
            )}
            <button onClick={() => navigateDate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" aria-label="后一天">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(EVENT_META).map(([type, meta]) => (
            <button key={type} disabled={saving} onClick={() => handleAdd(type)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:shadow-sm active:scale-95 transition-all disabled:opacity-50 ${meta.color}`}>
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loadingEvents && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              <span className="text-sm">加载中...</span>
            </div>
          </div>
        )}

        {/* Daily Summary */}
        {!loadingEvents && events.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-indigo-50 rounded-xl p-2 text-center">
              <p className="text-xs text-indigo-500">睡眠</p>
              <p className="text-sm font-bold text-indigo-700">{formatDuration(dailySummary.totalSleep)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-2 text-center">
              <p className="text-xs text-amber-500">喂奶</p>
              <p className="text-sm font-bold text-amber-700">{dailySummary.totalFeedMl}ml <span className="font-normal text-xs">({dailySummary.feedCount}次)</span></p>
            </div>
            <div className="bg-orange-50 rounded-xl p-2 text-center">
              <p className="text-xs text-orange-500">辅食</p>
              <p className="text-sm font-bold text-orange-700">{dailySummary.foodCount}次</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-2 text-center">
              <p className="text-xs text-yellow-600">大便</p>
              <p className="text-sm font-bold text-yellow-700">{dailySummary.poopCount}次</p>
            </div>
            <div className="bg-sky-50 rounded-xl p-2 text-center">
              <p className="text-xs text-sky-500">换尿布</p>
              <p className="text-sm font-bold text-sky-700">{dailySummary.diaperCount}次</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-2 text-center">
              <p className="text-xs text-emerald-500">玩耍</p>
              <p className="text-sm font-bold text-emerald-700">{formatDuration(dailySummary.playTime)}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative min-h-[540px]">
          <DailyTimeline events={events} date={date} onEventUpdate={handleEventUpdate} onEventAdd={handleEventAddFromCanvas} onNavigateDate={navigateDate} />
        </div>

        {/* Event List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">
              记录列表{events.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">共{events.length}条</span>}
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-400 text-sm">暂无记录</p>
              <p className="text-gray-300 text-xs mt-1">点击上方按钮开始记录</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sortedEvents.map((evt) => {
                const meta = EVENT_META[evt.type] || { emoji: '?', label: evt.type };
                const isEditing = editingId === evt.id;
                const time = new Date(evt.startTime);
                const poopMeta = evt.type === 'poop' && evt.poopColor ? POOP_COLORS[evt.poopColor] : null;
                const sub = eventSubLabel(evt);

                return (
                  <div key={evt.id} className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.emoji}</span>
                          <span className="text-sm font-medium text-gray-700">{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input type="time" value={timeDraft} onChange={(e) => setTimeDraft(e.target.value)} step="900"
                            className="px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                          <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="添加备注..."
                            className="flex-1 min-w-[120px] px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                          <div className="flex gap-1.5">
                            <button disabled={saving} onClick={saveEdit} className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50">保存</button>
                            <button disabled={saving} onClick={cancelEdit} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50">取消</button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-gray-800">{meta.label}</span>
                              {sub && <span className="text-xs text-gray-400">{sub}</span>}
                              {poopMeta && <span className={`inline-block w-3 h-3 rounded-full ${poopMeta.dot}`} title={poopMeta.label} />}
                            </div>
                            {evt.note && <p className="text-xs text-gray-400 truncate mt-0.5">{evt.note}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 font-mono tabular-nums">
                            {time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                          <button disabled={saving} onClick={() => startEdit(evt)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" aria-label="编辑">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                          <button disabled={saving} onClick={() => handleDelete(evt.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="删除">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <BabyProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
