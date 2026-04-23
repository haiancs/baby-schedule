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

    if (username.length < 2) {
      return { code: 400, message: '用户名至少 2 个字符' };
    }

    if (password.length < 6) {
      return { code: 400, message: '密码至少 6 位' };
    }

    try {
      const userRef = db.collection('allowed_users').where({
        username: username
      });
      const { data } = await userRef.get();

      if (data.length > 0 && data[0].isRegistered) {
        return { code: 409, message: '用户已注册，请直接登录' };
      }

      const email = `${username}@baby.local`;

      let uid;
      try {
        const createResult = await db.collection('tencentcloud_defuM4ogh').add({
          email: email,
          password: password,
          username: username,
          createdAt: db.database().serverDate()
        });
        uid = createResult.id;
      } catch (createErr) {
        console.error('createResult error:', createErr);
      }

      if (data.length > 0) {
        await db.collection('allowed_users').doc(data[0]._id).update({
          isRegistered: true,
          uid: uid || `local_${username}`,
          email: email,
          password: password,
          updatedAt: new Date()
        });
      } else {
        await db.collection('allowed_users').add({
          username: username,
          email: email,
          password: password,
          uid: uid || `local_${username}`,
          isRegistered: true,
          createdAt: new Date()
        });
      }

      return {
        code: 200,
        message: '注册成功',
        data: {
          username,
          email,
          uid: uid || `local_${username}`
        }
      };
    } catch (error) {
      console.error('Register error:', error);
      return { code: 500, message: '注册失败', error: error.message };
    }
  }

  if (action === 'login') {
    if (!username || !password) {
      return { code: 400, message: '用户名或密码不能为空' };
    }

    try {
      const userRef = db.collection('allowed_users').where({
        username: username
      });
      const { data } = await userRef.get();

      if (data.length === 0) {
        return { code: 401, message: '用户不存在' };
      }

      const userData = data[0];

      if (!userData.isRegistered) {
        return { code: 401, message: '用户未注册' };
      }

      if (userData.password !== password) {
        return { code: 401, message: '密码错误' };
      }

      return {
        code: 200,
        message: '登录成功',
        data: {
          username,
          uid: userData.uid || username
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return { code: 500, message: '登录失败', error: error.message };
    }
  }

  return { code: 400, message: '不支持的 action' };
};
