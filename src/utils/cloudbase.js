import { useContext } from 'react';
import { CloudContext, auth, cloud } from '../cloudContext';

export const useCloud = () => useContext(CloudContext);

export const getAuth = () => auth;
// 不使用 useContext，直接使用全局导出的 cloud 实例
export const getDb = () => cloud.database();

export const callFunction = async (name, data) => {
  try {
    // 不使用 useContext，直接使用全局导出的 cloud 实例
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
    await auth.signOut();
  } catch (e) {
    // ignore
  }
  return { success: true };
};
