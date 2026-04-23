import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../cloudContext';
import { startWechatWebLogin } from '../utils/wechatWebAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkLogin();
  }, []);

  const checkLogin = async () => {
    try {
      const loginState = await auth.getLoginState();
      if (loginState) {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Check login failed:', err);
    }
  };

  const handleLogin = async () => {
    setLoginError(null);
    setSubmitting(true);
    try {
      await startWechatWebLogin();
    } catch (err) {
      console.error('WeChat login start failed:', err);
      setLoginError(err?.message || '无法跳转微信授权，请稍后重试');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 via-white to-amber-50/30">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-sm border border-gray-100 mb-4">
            <span className="text-4xl">👶</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">宝宝作息</h1>
          <p className="mt-1.5 text-sm text-gray-400">记录每一天的成长</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {loginError && (
            <p className="mb-3 text-sm text-red-600 text-center" role="alert">
              {loginError}
            </p>
          )}
          <button
            type="button"
            disabled={submitting}
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-green-500/20 flex items-center justify-center gap-3 disabled:opacity-60 disabled:pointer-events-none">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89a5.718 5.718 0 0 0-.406-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
            </svg>
            <span>微信登录</span>
          </button>

          <p className="mt-4 text-xs text-center text-gray-400">
            点击上方按钮即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}
