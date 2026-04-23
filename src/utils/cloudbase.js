import cloudbase from '@cloudbase/js-sdk';

const ENV_ID = 'cloud1-9gaf7sks5b9ec073';

export const app = cloudbase.init({
  env: ENV_ID,
  timeout: 15000,
  persistenceAuth: false,
  forgetMs: 30000
});

export const getAuth = () => app.auth();

export const getDb = () => app.database();

export const callFunction = (name, data) => app.callFunction({
  name,
  data,
  parse: true
});

export const logout = async () => {
  try {
    await app.auth().signOut();
  } catch (e) {
    // ignore
  }
  return { success: true };
};

export default { app, getAuth, getDb, logout };
