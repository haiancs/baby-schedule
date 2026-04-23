import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logout } from '../utils/cloudbase';

const Navbar = () => {
  const [theme, setTheme] = useState('cyberpunk');
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  // 检测是否是活跃路由
  const isActive = (path) => location.pathname === path;

  // 切换主题
  const toggleTheme = () => {
    const themes = ['light', 'dark', 'cupcake', 'synthwave', 'retro', 'cyberpunk'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    setTheme(newTheme);
  };

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link to="/" className={isActive('/') ? 'active' : ''}>首页</Link></li>
            {/* 可以在这里添加新的链接 */}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl normal-case">
          <span className="text-primary">Cloud</span>
          <span className="text-secondary">Base</span>
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link to="/" className={isActive('/') ? 'active' : ''}>首页</Link></li>
          {/* 可以在这里添加新的链接 */}
        </ul>
      </div>
      <div className="navbar-end">
        {isLoggedIn && (
          <button onClick={handleLogout} className="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
        <button onClick={toggleTheme} className="btn btn-circle btn-ghost">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Navbar; 