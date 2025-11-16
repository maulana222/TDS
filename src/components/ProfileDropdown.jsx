import { useState, useRef, useEffect } from 'react';
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { getCurrentUser } from '../services/authService';

function ProfileDropdown({ onLogout, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const user = getCurrentUser();

  // Generate initials from username
  const getInitials = (username) => {
    if (!username) return 'U';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(user?.username);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuItemClick = (action) => {
    setIsOpen(false);
    if (action === 'profile') {
      // Navigate to profile page or show profile modal
      onNavigate?.('profile');
    } else if (action === 'settings') {
      onNavigate?.('settings');
    } else if (action === 'logout') {
      onLogout();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Profile menu"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm shadow-md">
          {initials}
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700">
          {user?.username || 'User'}
        </span>
        <FiChevronDown className={`hidden md:block w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-900">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{user?.email || ''}</p>
          </div>
          
          <div className="py-1">
            <button
              onClick={() => handleMenuItemClick('profile')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FiUser className="w-4 h-4" />
              <span>Profile</span>
            </button>
            
            <button
              onClick={() => handleMenuItemClick('settings')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FiSettings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>

          <div className="border-t border-gray-200 pt-1">
            <button
              onClick={() => handleMenuItemClick('logout')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileDropdown;

