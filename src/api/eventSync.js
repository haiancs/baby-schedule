import { getDb, getAuth } from '../utils/cloudbase';

const STORAGE_PREFIX = 'baby-routine:events:';
const COLLECTION = 'events';

const getLocalEvents = (date) => {
  const raw = globalThis.localStorage?.getItem(`${STORAGE_PREFIX}${date}`);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalEvents = (date, events) => {
  globalThis.localStorage?.setItem(`${STORAGE_PREFIX}${date}`, JSON.stringify(events || []));
};

function isLoggedIn() {
  try {
    const auth = getAuth();
    return !!auth.currentUser;
  } catch {
    return false;
  }
}

/**
 * 每个用户每天一条文档: { date, events: [...], _openid (自动) }
 * 利用 date + _openid 唯一索引做 upsert 语义
 */
export const getDailyEvents = async (date) => {
  if (!isLoggedIn()) return getLocalEvents(date);

  try {
    const db = getDb();
    const { data } = await db.collection(COLLECTION).where({ date }).get();
    if (data && data.length > 0) {
      return data[0].events || [];
    }
    return [];
  } catch (e) {
    console.warn('云端读取失败，回退本地', e);
    return getLocalEvents(date);
  }
};

export const saveDailyEvents = async (date, events) => {
  saveLocalEvents(date, events);

  if (!isLoggedIn()) return { code: 200, message: '本地保存成功' };

  const db = getDb();
  const { data } = await db.collection(COLLECTION).where({ date }).get();

  if (data && data.length > 0) {
    const docId = data[0]._id;
    const result = await db.collection(COLLECTION).doc(docId).update({
      events,
      updatedAt: new Date().toISOString(),
    });
    if (result.updated === 0 && result.code) {
      throw new Error(result.message || '更新失败');
    }
    return { code: 200, message: '已同步' };
  }

  await db.collection(COLLECTION).add({
    date,
    events,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { code: 200, message: '已同步' };
};

export const getWeeklyEvents = async (startDate, endDate) => {
  if (!isLoggedIn()) {
    const results = [];
    const dStart = new Date(startDate);
    const dEnd = new Date(endDate);
    for (let d = new Date(dStart); d <= dEnd; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      results.push(...getLocalEvents(`${yyyy}-${mm}-${dd}`));
    }
    return results;
  }

  try {
    const db = getDb();
    const _ = db.command;
    const { data } = await db.collection(COLLECTION)
      .where({ date: _.gte(startDate).and(_.lte(endDate)) })
      .get();

    const allEvents = [];
    for (const doc of (data || [])) {
      if (Array.isArray(doc.events)) allEvents.push(...doc.events);
    }
    return allEvents;
  } catch (e) {
    console.warn('云端周数据读取失败，回退本地', e);
    const results = [];
    const dStart = new Date(startDate);
    const dEnd = new Date(endDate);
    for (let d = new Date(dStart); d <= dEnd; d.setDate(d.getDate() + 1)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      results.push(...getLocalEvents(`${yyyy}-${mm}-${dd}`));
    }
    return results;
  }
};
