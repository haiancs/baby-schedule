// Mock CloudBase SDK
const mockDb = {
  collection: (name) => {
    return {
      where: (query) => {
        return {
          get: async () => {
            if (query.username === 'validUser') {
              return { data: [{ _id: '1', username: 'validUser', isRegistered: false }] };
            }
            if (query.username === 'registeredUser') {
              return { data: [{ _id: '2', username: 'registeredUser', isRegistered: true }] };
            }
            return { data: [] };
          }
        }
      },
      doc: (id) => {
        return {
          update: async (data) => {
            return { updated: 1 };
          }
        }
      }
    }
  }
};

const mockAuth = {
  createUser: async (data) => {
    return { uid: 'mock-uid-12345' };
  }
};

const mockApp = {
  database: () => mockDb,
  auth: () => mockAuth
};

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

const userAuth = require('./index.js');

async function runMockTests() {
  console.log('--- 测试: userAuth (用户认证) ---');
  
  // 1. 测试不在白名单用户
  const test1 = await userAuth.main({ action: 'register', username: 'invalidUser', password: 'password123' }, {});
  console.log('测试1 (不在白名单):', test1);

  // 2. 测试已注册用户
  const test2 = await userAuth.main({ action: 'register', username: 'registeredUser', password: 'password123' }, {});
  console.log('测试2 (已注册用户):', test2);

  // 3. 测试合法注册
  const test3 = await userAuth.main({ action: 'register', username: 'validUser', password: 'password123' }, {});
  console.log('测试3 (合法白名单注册):', test3);
}

runMockTests();
