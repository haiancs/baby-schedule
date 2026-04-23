// Override require to return mock
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === '@cloudbase/node-sdk') {
    return {
      init: () => mockApp,
      SYMBOL_CURRENT_ENV: 'mock-env'
    };
  }
  return originalRequire.apply(this, arguments);
};

const tcb = require('@cloudbase/node-sdk');

// Mock data store
const mockDataStore = [
  { _id: 'doc-1', date: '2023-10-01', _openid: 'mock-openid', events: [{ id: 1, type: 'sleep', time: '10:00' }] }
];

const mockDb = {
  serverDate: () => new Date(),
  collection: (name) => {
    return {
      where: (query) => {
        return {
          get: async () => {
            const matches = mockDataStore.filter(doc => doc.date === query.date && doc._openid === query._openid);
            return { data: matches };
          }
        }
      },
      doc: (id) => {
        return {
          update: async (data) => {
            const index = mockDataStore.findIndex(d => d._id === id);
            if (index > -1) {
              mockDataStore[index].events = data.events;
              mockDataStore[index].updatedAt = data.updatedAt;
            }
            return { updated: 1 };
          }
        }
      },
      add: async (data) => {
        const newDoc = { _id: `doc-${mockDataStore.length + 1}`, ...data };
        mockDataStore.push(newDoc);
        return { id: newDoc._id };
      }
    }
  }
};

const mockApp = {
  database: () => mockDb,
  auth: () => ({
    getUserInfo: () => ({ OPENID: 'mock-openid' })
  })
};

const eventSync = require('./index.js');

async function runMockTests() {
  console.log('--- 测试: eventSync (作息事件 CRUD) ---');
  
  // 1. 获取现有事件
  const test1 = await eventSync.main({ action: 'get', date: '2023-10-01' }, {});
  console.log('测试1 (获取 2023-10-01 数据):', test1);

  // 2. 获取不存在的事件
  const test2 = await eventSync.main({ action: 'get', date: '2023-10-02' }, {});
  console.log('测试2 (获取不存在的 2023-10-02 数据):', test2);

  // 3. 保存新事件 (创建)
  const newEvents = [{ id: 2, type: 'eat', time: '12:00' }];
  const test3 = await eventSync.main({ action: 'save', date: '2023-10-02', events: newEvents }, {});
  console.log('测试3 (保存新日期 2023-10-02):', test3);
  
  // 验证保存结果
  const test4 = await eventSync.main({ action: 'get', date: '2023-10-02' }, {});
  console.log('测试4 (验证刚才保存的 2023-10-02 数据):', test4);

  // 4. 更新已有事件 (更新)
  const updatedEvents = [{ id: 1, type: 'sleep', time: '10:00' }, { id: 3, type: 'play', time: '14:00' }];
  const test5 = await eventSync.main({ action: 'save', date: '2023-10-01', events: updatedEvents }, {});
  console.log('测试5 (更新已有的 2023-10-01 数据):', test5);

  // 验证更新结果
  const test6 = await eventSync.main({ action: 'get', date: '2023-10-01' }, {});
  console.log('测试6 (验证刚才更新的 2023-10-01 数据):', JSON.stringify(test6));
}

runMockTests();
