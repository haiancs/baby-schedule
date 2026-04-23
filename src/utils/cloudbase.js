import { useContext } from 'react';
import { CloudContext, auth } from '../cloudContext';

export const useCloud = () => useContext(CloudContext);

export const getAuth = () => auth;
export const getDb = () => useContext(CloudContext).database();

export const callFunction = async (name, data) => {
  try {
    const res = useContext(CloudContext).callFunction({
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
