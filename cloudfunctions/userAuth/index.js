const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
});
const db = app.database();

exports.main = async (event, context) => {
  const { action, username, password } = event;

  if (action === 'register') {
    if (!username || !password) {
      return { code: 400, message: '用户名或密码不能为空' };
    }

    try {
      const userRef = db.collection('allowed_users').where({
        username: username
      });
      const { data } = await userRef.get();

      if (data.length === 0) {
        return { code: 403, message: '用户不在白名单内' };
      }

      const userData = data[0];
      if (userData.isRegistered) {
        return { code: 409, message: '用户已注册，请勿重复注册' };
      }

      const email = `${username}@baby.local`;
      const { auth } = app;
      const userResult = await auth().createUser({
        email: email,
        password: password
      });

      await db.collection('allowed_users').doc(userData._id).update({
        isRegistered: true,
        uid: userResult.uid || '',
        updatedAt: new Date()
      });

      return {
        code: 200,
        message: '注册成功',
        data: {
          username,
          email,
          uid: userResult.uid
        }
      };
    } catch (error) {
      return { code: 500, message: '注册失败', error: error.message };
    }
  }

  if (action === 'login') {
    if (!username || !password) {
      return { code: 400, message: '用户名或密码不能为空' };
    }

    try {
      const email = `${username}@baby.local`;
      const { auth } = app;
      await auth().signInWithEmailAndPassword(email, password);

      return {
        code: 200,
        message: '登录成功',
        data: { username }
      };
    } catch (error) {
      return { code: 401, message: '用户名或密码错误' };
    }
  }

  return { code: 400, message: '不支持的 action' };
};
