import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiCalendar, FiEdit2 } from 'react-icons/fi';
import { getCurrentUser } from '../services/authService';

function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const getInitials = (username) => {
    if (!username) return 'U';
    const parts = username.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header dengan avatar */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-700 px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-2xl shadow-lg">
              {getInitials(user.username)}
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-1">{user.username}</h1>
              {user.email && (
                <p className="text-blue-100 flex items-center gap-2">
                  <FiMail className="w-4 h-4" />
                  {user.email}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                Informasi Profil
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Username</label>
                  <p className="text-gray-900 mt-1">{user.username}</p>
                </div>
                {user.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 mt-1">{user.email}</p>
                  </div>
                )}
                {user.id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-gray-900 mt-1 font-mono text-sm">{user.id}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiCalendar className="w-5 h-5" />
                Aktivitas
              </h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-600 text-sm">
                  Informasi aktivitas akan ditampilkan di sini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;

