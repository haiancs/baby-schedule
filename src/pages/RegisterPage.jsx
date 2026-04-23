import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from '../utils/cloudbase';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = username.trim();
    if (!trimmed) { setError('请输入用户名'); return; }
    if (trimmed.length < 2) { setError('用户名至少 2 个字符'); return; }
    if (password.length < 6) { setError('密码至少需要 6 位'); return; }
    if (password !== confirmPwd) { setError('两次输入的密码不一致'); return; }

    setLoading(true);
    try {
      const auth = getAuth();
      await auth.signUpWithUsernameAndPassword(trimmed, password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Register failed:', err);
      const msg = err?.message || '';
      if (msg.includes('exist')) {
        setError('该用户名已被注册');
      } else if (msg.includes('network') || msg.includes('timeout')) {
        setError('网络连接失败，请稍后重试');
      } else {
        setError(msg || '注册失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-amber-50/30">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 mb-4">
            <span className="text-4xl">👶</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">创建账号</h1>
          <p className="mt-1.5 text-sm text-gray-400">开始记录宝宝的每一天</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {success ? (
            <div className="py-6 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 rounded-full mb-3">
                <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">注册成功</h2>
              <p className="text-sm text-gray-400">正在跳转到登录页...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5" htmlFor="reg-username">用户名</label>
                  <input
                    id="reg-username" type="text" required autoComplete="username" autoFocus
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    placeholder="至少 2 个字符"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5" htmlFor="reg-password">密码</label>
                  <input
                    id="reg-password" type="password" required autoComplete="new-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    placeholder="至少 6 位密码"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5" htmlFor="reg-confirm">确认密码</label>
                  <input
                    id="reg-confirm" type="password" required autoComplete="new-password"
                    value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                    placeholder="再次输入密码"
                  />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 active:scale-[0.98] text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>注册中...</span>
                    </>
                  ) : '注 册'}
                </button>
              </form>
            </>
          )}
        </div>

        {!success && (
          <p className="mt-5 text-center text-sm text-gray-400">
            已有账号？{' '}
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium transition-colors">登录</Link>
          </p>
        )}
      </div>
    </div>
  );
}
