import { cloud } from '../cloudContext';

// 统一复用 cloudContext 的单例，避免出现多个 SDK 实例
export const cloudbase = cloud;

export { cloud };
export const getAuth = () => cloud.auth();
export const getDb = () => cloud.database();

export const callFunction = async (name, data) => {
  try {
    const res = await cloud.callFunction({
      name,
      data
    });
    return res;
  } catch (err) {
    console.error('callFunction error:', err);
    throw err;
  }
};

export const logout = async () => {
  try {
    await cloud.auth().signOut();
  } catch (e) {
    // ignore
  }
  return { success: true };
};
