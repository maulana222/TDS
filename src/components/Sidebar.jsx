import { Link, useLocation } from 'react-router-dom';
import { getCurrentUser, isAdmin } from '../services/authService';
import { 
  FiLayout, 
  FiHome, 
  FiTool,
  FiClock, 
  FiFileText,
  FiLogOut,
  FiX,
  FiMenu,
  FiUsers,
  FiDatabase
} from 'react-icons/fi';

function Sidebar({ currentPage, setCurrentPage, onLogout, isOpen, onToggle, onClose, isCollapsed, onToggleCollapse }) {
  const user = getCurrentUser();
  const location = useLocation();
  const admin = isAdmin();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiLayout, path: '/dashboard' },
    { id: 'tools', label: 'Tools', icon: FiTool, path: '/tools' },
    { id: 'transaction-management', label: 'Transaksi', icon: FiDatabase, path: '/transaction-management' },
    // Only show Member for admin
    ...(admin ? [{ id: 'member-management', label: 'Member', icon: FiUsers, path: '/member-management' }] : []),
    { id: 'logs', label: 'Logs', icon: FiFileText, path: '/logs' },
    { id: 'history', label: 'History', icon: FiClock, path: '/history' },
  ];

  const handleMenuClick = (pageId) => {
    setCurrentPage(pageId);
    // Close sidebar on mobile after clicking menu
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Overlay untuk mobile dengan animasi fade */}
      <div 
        className={`
          fixed inset-0 bg-black z-40 md:hidden
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-50 visible' : 'opacity-0 invisible'}
        `}
        onClick={onClose}
      />

      {/* Sidebar dengan animasi smooth */}
      <aside 
        className={`
          fixed
          top-0 left-0
          ${isCollapsed ? 'w-16' : 'w-64'} 
          bg-white border-r border-gray-200 shadow-lg md:shadow-sm
          h-screen flex flex-col z-50
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
         {/* Header - Fixed */}
         <div 
           className={`fixed top-0 left-0 ${isCollapsed ? 'w-16' : 'w-64'} bg-white border-b border-gray-200 z-10 py-4 flex items-center transition-all duration-300 ${
             isCollapsed ? 'px-2 justify-center' : 'px-6 justify-end'
           }`}
           style={{
             transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
           }}
         >
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Collapse sidebar"
                title="Collapse"
              >
                <FiX className="w-4 h-4 text-gray-600 rotate-45" />
              </button>
            )}
            {isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Expand sidebar"
                title="Expand"
              >
                <FiMenu className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <FiX className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 md:px-4 py-6 overflow-y-auto mt-[73px]">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      handleMenuClick(item.id);
                    }}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg font-medium transition-all duration-300 ease-in-out ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-colors duration-300 ${active ? 'text-white' : 'text-gray-600'}`} />
                    {!isCollapsed && (
                      <span className={`truncate transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-6 border-t border-gray-200 transition-all duration-300`}>
          <button
            onClick={onLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-lg font-medium transition-all duration-300 ease-in-out text-red-600 hover:text-red-700 hover:bg-red-50`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <FiLogOut className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
                Logout
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;

