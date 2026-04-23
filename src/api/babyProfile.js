import { getDb, getAuth } from '../utils/cloudbase';

const COLLECTION = 'babyProfile';

async function getOpenid() {
  try {
    const auth = getAuth();
    const user = await auth.getCurrentUser();
    return user?.uid || user?.openid || null;
  } catch {
    return null;
  }
}

export async function getBabyProfile() {
  try {
    const openid = await getOpenid();
    if (!openid) return null;

    const db = getDb();
    const { data } = await db.collection(COLLECTION).where({ _openid: openid }).get();
    if (data && data.length > 0) {
      return data[0];
    }
    return null;
  } catch (e) {
    console.warn('获取宝宝信息失败:', e);
    return null;
  }
}

export async function saveBabyProfile(profile) {
  try {
    const openid = await getOpenid();
    if (!openid) throw new Error('用户未登录');

    const db = getDb();
    const { data: existing } = await db.collection(COLLECTION).where({ _openid: openid }).get();
    if (existing && existing.length > 0) {
      const docId = existing[0]._id;
      await db.collection(COLLECTION).doc(docId).update({
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      return { code: 200, message: '更新成功' };
    }
    await db.collection(COLLECTION).add({
      ...profile,
      _openid: openid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { code: 200, message: '保存成功' };
  } catch (e) {
    console.error('保存宝宝信息失败:', e);
    throw e;
  }
}
