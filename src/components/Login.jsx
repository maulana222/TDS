import { useState } from 'react';
import { login } from '../services/authService';
import toast from 'react-hot-toast';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Validasi username
  const validateUsername = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Username harus diisi';
    }
    if (trimmed.length < 3 || trimmed.length > 50) {
      return 'Username harus antara 3-50 karakter';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username hanya boleh berisi huruf, angka, dan underscore';
    }
    return null;
  };

  // Validasi password
  const validatePassword = (value) => {
    if (!value) {
      return 'Password harus diisi';
    }
    if (value.length < 6 || value.length > 100) {
      return 'Password harus antara 6-100 karakter';
    }
    return null;
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    // Real-time validation
    const error = validateUsername(value);
    setErrors(prev => ({ ...prev, username: error || null }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    // Real-time validation
    const error = validatePassword(value);
    setErrors(prev => ({ ...prev, password: error || null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi semua field
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrors({
        username: usernameError,
        password: passwordError
      });
      
      if (usernameError) {
        toast.error(usernameError);
      } else if (passwordError) {
        toast.error(passwordError);
      }
      return;
    }

    // Clear errors
    setErrors({});

    setLoading(true);
    try {
      // Sanitize input sebelum dikirim
      const sanitizedUsername = username.trim().toLowerCase();
      await login(sanitizedUsername, password);
      toast.success('Login berhasil!');
      onLoginSuccess();
    } catch (error) {
      toast.error(error.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Snifer
          </h1>
          <p className="text-gray-600">Transaction Request Tool</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onBlur={() => {
                const error = validateUsername(username);
                setErrors(prev => ({ ...prev, username: error || null }));
              }}
              disabled={loading}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan username (3-50 karakter)"
              autoComplete="username"
              maxLength={50}
              pattern="[a-zA-Z0-9_]+"
              title="Username hanya boleh berisi huruf, angka, dan underscore"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => {
                const error = validatePassword(password);
                setErrors(prev => ({ ...prev, password: error || null }));
              }}
              disabled={loading}
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 transition-all ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Masukkan password (minimal 6 karakter)"
              autoComplete="current-password"
              maxLength={100}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Memproses...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Hubungi administrator untuk mendapatkan akses
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

