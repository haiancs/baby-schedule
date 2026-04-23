import { getDb } from '../utils/cloudbase';

const COLLECTION = 'babyProfile';

export async function getBabyProfile() {
  try {
    const db = getDb();
    const { data } = await db.collection(COLLECTION).get();
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
    const db = getDb();
    const existing = await db.collection(COLLECTION).get();
    if (existing.data && existing.data.length > 0) {
      const docId = existing.data[0]._id;
      await db.collection(COLLECTION).doc(docId).update({
        ...profile,
        updatedAt: new Date().toISOString(),
      });
      return { code: 200, message: '更新成功' };
    }
    await db.collection(COLLECTION).add({
      ...profile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { code: 200, message: '保存成功' };
  } catch (e) {
    console.error('保存宝宝信息失败:', e);
    throw e;
  }
}
