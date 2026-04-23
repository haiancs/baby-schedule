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
      // 查询白名单集合 allowed_users
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

      // 生成邮箱映射
      const email = `${username}@baby.local`;
      
      // 创建新用户 (使用 createUser 或 signUpWithEmailAndPassword 取决于 SDK 版本)
      // 注意：这里使用 Node SDK 的管理 API
      const { auth } = app;
      const userResult = await auth().createUser({
        email: email,
        password: password
      });

      // 更新白名单用户状态为已注册
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

  return { code: 400, message: '不支持的 action' };
};
