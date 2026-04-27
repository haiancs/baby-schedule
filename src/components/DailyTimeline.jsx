import { useEffect, useRef, useState, useCallback } from 'react';
import { POOP_COLORS, POINT_EVENT_TYPES, DURATION_EVENT_TYPES } from '../pages/DailyPage';

const LANE_CONFIG = [
  { key: 'sleep',  label: '😴 睡觉',   y: 55,  color: '#818CF8', bgColor: 'rgba(129,140,248,0.08)' },
  { key: 'feed',   label: '🍼 喂奶',   y: 115, color: '#F59E0B', bgColor: 'rgba(245,158,11,0.08)' },
  { key: 'food',   label: '🥣 辅食',   y: 175, color: '#F97316', bgColor: 'rgba(249,115,22,0.08)' },
  { key: 'poop',   label: '💩 大便',   y: 235, color: '#EAB308', bgColor: 'rgba(234,179,8,0.08)' },
  { key: 'diaper', label: '🩲 换尿布', y: 295, color: '#38BDF8', bgColor: 'rgba(56,189,248,0.08)' },
  { key: 'play',   label: '🎮 玩耍',   y: 355, color: '#34D399', bgColor: 'rgba(52,211,153,0.08)' },
];

const LANE_Y = {};
LANE_CONFIG.forEach(l => { LANE_Y[l.key] = l.y; });
const LANE_HEIGHT = 50;
const TOTAL_HOURS = 24;
const LABEL_WIDTH = 56;

const HALF_RATING_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3];
const ML_PRESETS = [30, 60, 90, 120, 150, 180];

function formatRatingLabel(val) {
  if (val === Math.floor(val)) return `${val}`;
  return `${Math.floor(val)}½`;
}

export default function DailyTimeline({ events, date, onEventUpdate, onEventAdd, onNavigateDate }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [popoverState, setPopoverState] = useState({
    visible: false, eventId: null, eventType: null, x: 0, y: 0,
    rating: 1, poopColor: null, amountMl: 60,
  });

  const animationRef = useRef(null);

  const dragStateRef = useRef({
    active: false, eventId: null, dragType: null,
    initialX: 0, initialHour: 0, initialDuration: 1, hasMoved: false,
  });

  const panStateRef = useRef({
    active: false, startX: 0, hasPanned: false,
  });

  // 同步最新的 props 到 ref，避免 Canvas 动画循环闭包陈旧
  const eventsRef = useRef(events);
  const dateRef = useRef(date);
  const onNavigateDateRef = useRef(onNavigateDate);
  eventsRef.current = events;
  dateRef.current = date;
  onNavigateDateRef.current = onNavigateDate;

  const getHourFromX = useCallback((targetX, width) => {
    const canvasX = targetX - LABEL_WIDTH;
    const canvasWidth = width - LABEL_WIDTH;
    if (canvasX < 0) return 0;
    if (canvasX > canvasWidth) return TOTAL_HOURS;
    return (canvasX / canvasWidth) * TOTAL_HOURS;
  }, []);

  const snapHourTo15Min = (hour) => Math.round(hour * 4) / 4;

  // ─── Canvas render ───
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // roundRect 兼容性回退
    const drawRoundRect = (x, y, w, h, r) => {
      if (ctx.roundRect) {
        ctx.roundRect(x, y, w, h, r);
        return;
      }
      const radius = Math.min(r, w / 2, h / 2);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    const render = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cw = width - LABEL_WIDTH;

      ctx.clearRect(0, 0, width, height);

      // Lane backgrounds + labels
      LANE_CONFIG.forEach(lane => {
        ctx.fillStyle = lane.bgColor;
        ctx.fillRect(LABEL_WIDTH, lane.y - 4, cw, LANE_HEIGHT - 8);
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '11px ui-sans-serif, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(lane.label, 4, lane.y + (LANE_HEIGHT - 16) / 2);
      });

      const getX = (hour) => LABEL_WIDTH + (hour / TOTAL_HOURS) * cw;

      // Grid
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      for (let h = 0; h <= 24; h++) {
        const x = getX(h);
        ctx.beginPath(); ctx.moveTo(x, 42); ctx.lineTo(x, height);
        ctx.strokeStyle = h % 6 === 0 ? '#E5E7EB' : '#F3F4F6';
        ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = (h >= 7 && h <= 21) ? '#6B7280' : '#D1D5DB';
        ctx.font = '11px ui-sans-serif, system-ui, -apple-system, sans-serif';
        if (h % 2 === 0) ctx.fillText(`${String(h).padStart(2, '0')}:00`, x, 16);
      }

      // "Now" indicator
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      if (dateRef.current === todayStr) {
        const nh = now.getHours() + now.getMinutes() / 60;
        const nx = getX(nh);
        ctx.beginPath(); ctx.moveTo(nx, 42); ctx.lineTo(nx, height);
        ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#EF4444';
        ctx.beginPath(); ctx.arc(nx, 42, 3, 0, Math.PI * 2); ctx.fill();
        ctx.font = 'bold 10px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('现在', nx, 4);
      }

      // Events
      eventsRef.current.forEach(evt => {
        const d = new Date(evt.startTime);
        const sh = d.getHours() + d.getMinutes() / 60;
        const x = getX(sh);
        const y = LANE_Y[evt.type] || 55;

        if (DURATION_EVENT_TYPES.includes(evt.type)) {
          const dur = evt.duration || 1;
          const eh = sh + dur;
          const ex = getX(eh);
          const w = Math.max(ex - x, 4);
          const lc = LANE_CONFIG.find(l => l.key === evt.type);
          ctx.fillStyle = lc?.color || '#818CF8';
          ctx.globalAlpha = dragStateRef.current.eventId === evt.id ? 0.9 : 0.75;
          ctx.beginPath(); drawRoundRect(x, y, w, LANE_HEIGHT - 16, 8); ctx.fill();
          // resize handle
          ctx.fillStyle = '#fff';
          ctx.beginPath(); drawRoundRect(x + w - 6, y + (LANE_HEIGHT - 16) / 2 - 8, 4, 16, 2); ctx.fill();
          // duration label
          if (w > 40) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 11px ui-sans-serif, system-ui, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const hrs = Math.floor(dur); const mins = Math.round((dur - hrs) * 60);
            ctx.fillText(hrs > 0 ? (mins > 0 ? `${hrs}h${mins}m` : `${hrs}h`) : `${mins}m`, x + w / 2, y + (LANE_HEIGHT - 16) / 2);
          }
          // drag tooltip
          if (dragStateRef.current.eventId === evt.id) {
            ctx.fillStyle = '#111827'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
            const th = dragStateRef.current.dragType === 'resize-end' ? eh : sh;
            ctx.fillText(`${Math.floor(th)}:${String(Math.round((th % 1) * 60)).padStart(2, '0')}`, dragStateRef.current.dragType === 'resize-end' ? ex : x, y - 10);
          }
          ctx.globalAlpha = 1.0;
        } else {
          // Point events
          const emojiMap = { poop: '💩', feed: '🍼', food: '🥣', diaper: '🩲' };
          const emoji = emojiMap[evt.type] || '?';
          ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

          // Poop color halo
          if (evt.type === 'poop' && evt.poopColor) {
            ctx.fillStyle = POOP_COLORS[evt.poopColor]?.hex || '#78716C';
            ctx.globalAlpha = 0.25;
            ctx.beginPath(); ctx.arc(x, y + 15, 13, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          ctx.shadowColor = 'rgba(0,0,0,0.06)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1;

          if (evt.type === 'feed') {
            // Feed: show emoji + ml label
            ctx.fillText(emoji, x, y + 12);
            ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
            if (evt.amountMl) {
              ctx.font = 'bold 9px ui-sans-serif, system-ui, sans-serif';
              ctx.fillStyle = '#B45309';
              ctx.fillText(`${evt.amountMl}ml`, x, y + 28);
            }
          } else if (evt.type === 'diaper') {
            // Simple single emoji
            ctx.fillText(emoji, x, y + 15);
          } else {
            // Poop / Food: half-rating rendering
            const rating = evt.rating || 1;
            const full = Math.floor(rating);
            const hasHalf = rating % 1 !== 0;
            if (full <= 1 && !hasHalf) {
              ctx.fillText(emoji, x, y + 15);
            } else {
              const ov = 12;
              const total = full + (hasHalf ? 1 : 0);
              const tw = (total - 1) * ov;
              const sx = x - tw / 2;
              for (let i = 0; i < full; i++) ctx.fillText(emoji, sx + i * ov, y + 15);
              if (hasHalf) {
                ctx.globalAlpha = 0.4;
                ctx.fillText(emoji, sx + full * ov, y + 15);
                ctx.globalAlpha = 1.0;
              }
            }
          }

          ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
        }
      });

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ─── Pointer events ───
  const handlePointerDown = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const width = rect.width, cw = width - LABEL_WIDTH;

    for (let i = eventsRef.current.length - 1; i >= 0; i--) {
      const evt = eventsRef.current[i];
      const d = new Date(evt.startTime);
      const sh = d.getHours() + d.getMinutes() / 60;
      const dur = evt.duration || 1;
      const eh = sh + dur;
      const evtX = LABEL_WIDTH + (sh / TOTAL_HOURS) * cw;
      const evtEndX = LABEL_WIDTH + (eh / TOTAL_HOURS) * cw;
      const evtY = LANE_Y[evt.type] || 55;

      let isHit = false, hitDragType = 'move';
      if (DURATION_EVENT_TYPES.includes(evt.type)) {
        const w = Math.max(evtEndX - evtX, 4), h = LANE_HEIGHT - 16;
        if (x >= evtX && x <= evtX + w && y >= evtY && y <= evtY + h) {
          isHit = true;
          if (x >= evtX + w - 15) hitDragType = 'resize-end';
        }
      } else {
        const dx = x - evtX, dy = y - (evtY + 15);
        if (dx * dx + dy * dy <= 18 * 18) isHit = true;
      }

      if (isHit) {
        if (POINT_EVENT_TYPES.includes(evt.type)) {
          dragStateRef.current = { active: true, eventId: evt.id, dragType: hitDragType, initialX: x, initialY: y, initialHour: sh, initialDuration: dur, hasMoved: false };
          e.target.setPointerCapture(e.pointerId);
          return;
        }
        setPopoverState(p => ({ ...p, visible: false }));
        dragStateRef.current = { active: true, eventId: evt.id, dragType: hitDragType, initialX: x, initialY: y, initialHour: sh, initialDuration: dur, hasMoved: false };
        e.target.setPointerCapture(e.pointerId);
        return;
      }
    }

    // 点击空白区域：开始 pan（用于左右滑动切换日期）
    setPopoverState(p => ({ ...p, visible: false }));
    panStateRef.current = { active: true, startX: x, hasPanned: false };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    const width = rect.width;

    if (dragStateRef.current.active) {
      if (!dragStateRef.current.hasMoved && (Math.abs(x - dragStateRef.current.initialX) > 5 || Math.abs(y - dragStateRef.current.initialY) > 5)) {
        dragStateRef.current.hasMoved = true;
      }
      const { initialX, initialHour, initialDuration, eventId, dragType, hasMoved } = dragStateRef.current;
      const ce = eventsRef.current.find(ev => ev.id === eventId);
      if (ce && POINT_EVENT_TYPES.includes(ce.type) && !hasMoved) return;

      const delta = getHourFromX(x, width) - getHourFromX(initialX, width);
      const ev = eventsRef.current.find(ev => ev.id === eventId);
      if (ev && onEventUpdate) {
        if (dragType === 'move') {
          const ns = snapHourTo15Min(initialHour + delta);
          const nd = new Date(ev.startTime);
          nd.setHours(Math.floor(ns), (ns % 1) * 60, 0, 0);
          if (nd.getTime() !== new Date(ev.startTime).getTime()) onEventUpdate(eventId, { startTime: nd.toISOString() });
        } else if (dragType === 'resize-end') {
          const nd = Math.max(0.25, snapHourTo15Min(initialDuration + delta));
          if (nd !== ev.duration) onEventUpdate(eventId, { duration: nd });
        }
      }
      return;
    }

    // 空白区域 pan：水平拖动超过阈值切换日期
    if (panStateRef.current.active && !panStateRef.current.hasPanned) {
      const dx = x - panStateRef.current.startX;
      const threshold = 80;
      if (Math.abs(dx) > threshold) {
        panStateRef.current.hasPanned = true;
        if (onNavigateDateRef.current) {
          onNavigateDateRef.current(dx > 0 ? -1 : 1);
        }
      }
    }
  };

  const handlePointerUp = (e) => {
    if (dragStateRef.current.active) {
      const { eventId, hasMoved, initialX, initialY } = dragStateRef.current;
      const evt = eventsRef.current.find(ev => ev.id === eventId);

      // Show popover on click (not drag) for configurable point events
      if (evt && !hasMoved && ['feed', 'food', 'poop'].includes(evt.type)) {
        setPopoverState({
          visible: true, eventId: evt.id, eventType: evt.type,
          x: initialX, y: initialY,
          rating: evt.rating || 1,
          poopColor: evt.poopColor || null,
          amountMl: evt.amountMl || 60,
        });
      }
      dragStateRef.current.active = false;
      dragStateRef.current.eventId = null;
    }

    // 结束空白区域 pan
    if (panStateRef.current.active) {
      panStateRef.current.active = false;
    }

    e.target.releasePointerCapture(e.pointerId);
  };

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };

  const handleDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('text/plain');
    if (!POINT_EVENT_TYPES.includes(type)) return;
    const rect = containerRef.current.getBoundingClientRect();
    const snapped = snapHourTo15Min(getHourFromX(e.clientX - rect.left, rect.width));
    const dd = dateRef.current ? new Date(dateRef.current + 'T00:00:00') : new Date();
    dd.setHours(Math.floor(snapped), (snapped % 1) * 60, 0, 0);
    if (onEventAdd) {
      onEventAdd({
        type, startTime: dd.toISOString(),
        ...(type === 'feed' ? { amountMl: 60 } : {}),
        ...(type === 'food' ? { rating: 1 } : {}),
        ...(type === 'poop' ? { rating: 1, poopColor: 'yellow' } : {}),
      });
    }
  };

  const popLeft = Math.max(90, Math.min(popoverState.x, (containerRef.current?.getBoundingClientRect().width || 400) - 90));
  const popHeight = popoverState.eventType === 'poop' ? 140 : popoverState.eventType === 'feed' ? 120 : 90;

  return (
    <div ref={containerRef}
      className="absolute inset-0 rounded-2xl overflow-hidden cursor-crosshair touch-none select-none"
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      onDragOver={handleDragOver} onDrop={handleDrop}>
      <canvas ref={canvasRef} className="block" />

      {/* Popover */}
      {popoverState.visible && (
        <div className="absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 flex flex-col gap-2"
          style={{ left: `${popLeft}px`, top: `${Math.max(10, popoverState.y - popHeight)}px`, transform: 'translate(-50%, 0)' }}
          onPointerDown={(e) => e.stopPropagation()}>

          {/* ── Feed: ml selector ── */}
          {popoverState.eventType === 'feed' && (
            <>
              <div className="flex items-center justify-between gap-2">
                <button onClick={() => {
                  const v = Math.max(10, popoverState.amountMl - 10);
                  setPopoverState(p => ({ ...p, amountMl: v }));
                  if (onEventUpdate) onEventUpdate(popoverState.eventId, { amountMl: v });
                }} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-lg flex items-center justify-center">−</button>
                <span className="text-lg font-bold text-amber-600 tabular-nums min-w-[60px] text-center">{popoverState.amountMl}ml</span>
                <button onClick={() => {
                  const v = popoverState.amountMl + 10;
                  setPopoverState(p => ({ ...p, amountMl: v }));
                  if (onEventUpdate) onEventUpdate(popoverState.eventId, { amountMl: v });
                }} className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-lg flex items-center justify-center">+</button>
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                {ML_PRESETS.map(ml => (
                  <button key={ml} onClick={() => {
                    setPopoverState(p => ({ ...p, amountMl: ml }));
                    if (onEventUpdate) onEventUpdate(popoverState.eventId, { amountMl: ml });
                  }} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    ml === popoverState.amountMl ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{ml}</button>
                ))}
              </div>
            </>
          )}

          {/* ── Food: half-rating ── */}
          {popoverState.eventType === 'food' && (
            <div className="flex items-center justify-center gap-1">
              {HALF_RATING_OPTIONS.map(val => (
                <button key={val} onClick={() => {
                  setPopoverState(p => ({ ...p, rating: val }));
                  if (onEventUpdate) onEventUpdate(popoverState.eventId, { rating: val });
                }} className={`min-w-[32px] h-8 px-1.5 rounded-lg text-xs font-bold transition-all ${
                  val === popoverState.rating ? 'bg-orange-500 text-white scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{formatRatingLabel(val)}</button>
              ))}
            </div>
          )}

          {/* ── Poop: half-rating + color ── */}
          {popoverState.eventType === 'poop' && (
            <>
              <div className="flex items-center justify-center gap-1">
                {HALF_RATING_OPTIONS.map(val => (
                  <button key={val} onClick={() => {
                    setPopoverState(p => ({ ...p, rating: val }));
                    if (onEventUpdate) onEventUpdate(popoverState.eventId, { rating: val });
                  }} className={`min-w-[32px] h-8 px-1.5 rounded-lg text-xs font-bold transition-all ${
                    val === popoverState.rating ? 'bg-yellow-500 text-white scale-105' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{formatRatingLabel(val)}</button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 border-t border-gray-100">
                {Object.entries(POOP_COLORS).map(([key, meta]) => (
                  <button key={key} onClick={() => {
                    setPopoverState(p => ({ ...p, poopColor: key }));
                    if (onEventUpdate) onEventUpdate(popoverState.eventId, { poopColor: key });
                  }} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                    popoverState.poopColor === key ? `ring-2 ${meta.ring} bg-gray-50 font-bold` : 'hover:bg-gray-50 text-gray-500'
                  }`}>
                    <span className={`w-3 h-3 rounded-full ${meta.dot}`} />
                    <span>{meta.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <button onClick={() => setPopoverState(p => ({ ...p, visible: false }))}
            className="text-xs text-gray-400 hover:text-gray-600 text-center pt-0.5">关闭</button>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45" />
        </div>
      )}
    </div>
  );
}
