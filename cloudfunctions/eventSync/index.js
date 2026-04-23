const tcb = require('@cloudbase/node-sdk');

const app = tcb.init({
  env: tcb.SYMBOL_CURRENT_ENV
});
const db = app.database();

exports.main = async (event, context) => {
  const { action, date, events } = event;

  // 获取当前调用的用户信息
  const { OPENID, APPID, UNIONID } = app.auth().getUserInfo() || {};
  const userId = OPENID || event.userInfo?.openId || 'anonymous';

  if (!date) {
    return { code: 400, message: 'Missing date parameter' };
  }

  const collection = db.collection('events');

  try {
    if (action === 'get') {
      // 查询某天的作息事件
      const result = await collection.where({
        date: date,
        _openid: userId
      }).get();

      return {
        code: 200,
        message: '获取成功',
        data: result.data.length > 0 ? result.data[0].events : []
      };
    } 
    
    if (action === 'save') {
      if (!Array.isArray(events)) {
        return { code: 400, message: 'events 必须是数组' };
      }

      // 检查是否已经存在该天的记录
      const existing = await collection.where({
        date: date,
        _openid: userId
      }).get();

      if (existing.data.length > 0) {
        // 更新现有记录
        const docId = existing.data[0]._id;
        await collection.doc(docId).update({
          events: events,
          updatedAt: db.serverDate()
        });
        return { code: 200, message: '更新成功' };
      } else {
        // 创建新记录
        await collection.add({
          date: date,
          events: events,
          _openid: userId,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        });
        return { code: 200, message: '保存成功' };
      }
    }

    return { code: 400, message: 'Unsupported action' };

  } catch (error) {
    return { code: 500, message: '操作失败', error: error.message };
  }
};
