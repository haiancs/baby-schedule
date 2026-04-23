import { useState } from 'react';
import { Link } from 'react-router-dom';
import { callFunction } from '../utils/cloudbase';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('请输入用户名'); return; }
    if (!password) { setError('请输入密码'); return; }

    setLoading(true);
    try {
      const res = await callFunction('userauth', {
        action: 'login',
        username: username.trim(),
        password
      });

      if (res.code !== 200) {
        setError(res.message || '登录失败');
        return;
      }

      await refreshUser();
    } catch (err) {
      console.error('Login failed:', err);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-amber-50/30">
      <div className="w-full max-w-sm mx-4">
        {/* Logo & title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 mb-4">
            <span className="text-4xl">👶</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">宝宝作息</h1>
          <p className="mt-1.5 text-sm text-gray-400">记录每一天的成长</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5" htmlFor="username">用户名</label>
              <input
                id="username" type="text" required autoComplete="username" autoFocus
                value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="请输入用户名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5" htmlFor="password">密码</label>
              <input
                id="password" type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                placeholder="请输入密码"
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>登录中...</span>
                </>
              ) : '登 录'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-gray-400">
          还没有账号？{' '}
          <Link to="/register" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">注册</Link>
        </p>
      </div>
    </div>
  );
}
