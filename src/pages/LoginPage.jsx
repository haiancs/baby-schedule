import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../cloudContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Input Phone, 2: Input OTP
  const [otpData, setOtpData] = useState(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    checkLogin();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length !== 11) {
      setLoginError('请输入有效的11位手机号');
      return;
    }
    
    setLoginError(null);
    setSubmitting(true);
    
    try {
      const { data, error } = await auth.signInWithOtp({ 
        phone: `+86${phone}` // Assuming China mobile numbers
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setOtpData(data);
      setStep(2);
      setCountdown(60);
    } catch (err) {
      console.error('Send OTP failed:', err);
      setLoginError(err?.message || '发送验证码失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setLoginError('请输入有效的验证码');
      return;
    }

    setLoginError(null);
    setSubmitting(true);

    try {
      const { data: loginData, error: loginError } = await otpData.verifyOtp({ 
        token: otp,
      });

      if (loginError) {
        throw new Error(loginError.message);
      }

      // 登录成功，跳转首页
      navigate('/', { replace: true });
      window.location.reload(); // Refresh to update auth context state
    } catch (err) {
      console.error('Verify OTP failed:', err);
      setLoginError(err?.message || '验证失败，请检查验证码是否正确');
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
            <p className="mb-4 text-sm text-red-600 text-center bg-red-50 py-2 px-3 rounded-lg" role="alert">
              {loginError}
            </p>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting || phone.length !== 11}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting ? '发送中...' : '获取验证码'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6位验证码"
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center tracking-widest text-lg font-medium"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || otp.length < 4}
                className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting ? '验证中...' : '登录'}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 0 || submitting}
                  className="text-sm text-blue-500 hover:text-blue-600 disabled:text-gray-400"
                >
                  {countdown > 0 ? `${countdown}秒后可重新发送` : '重新发送验证码'}
                </button>
                <span className="text-gray-300 mx-2">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setLoginError(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  更换手机号
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-xs text-center text-gray-400">
            点击登录即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  );
}
