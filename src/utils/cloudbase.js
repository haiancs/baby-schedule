import cloudbaseSDK from "@cloudbase/js-sdk";
import { cloud } from '../cloudContext';

export const cloudbase = cloudbaseSDK.init({
  env: import.meta.env.VITE_CLOUDBASE_ENV_ID,
  region: import.meta.env.VITE_CLOUDBASE_REGION || 'ap-shanghai'
});

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
