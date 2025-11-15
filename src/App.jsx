import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import { isAuthenticated, logout, verifyToken, getCurrentUser } from './services/authService';
import { initSocket, disconnectSocket } from './services/socketService';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (isAuthenticated()) {
      try {
        await verifyToken();
        setIsLoggedIn(true);
        
        // Initialize socket setelah login berhasil
        const user = getCurrentUser();
        if (user && user.id) {
          initSocket(user.id);
        }
      } catch (error) {
        setIsLoggedIn(false);
        disconnectSocket();
      }
    } else {
      setIsLoggedIn(false);
      disconnectSocket();
    }
    setCheckingAuth(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    
    // Initialize socket setelah login berhasil
    const user = getCurrentUser();
    if (user && user.id) {
      initSocket(user.id);
    }
  };

  const handleLogout = () => {
    logout();
    disconnectSocket(); // Disconnect socket saat logout
    setIsLoggedIn(false);
    setCurrentPage('home');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memeriksa autentikasi...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        <Login onLoginSuccess={handleLoginSuccess} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Snifer
          </div>
          <div className="flex gap-2 items-center">
            <button 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'home' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage('home')}
            >
              Home
            </button>
            <button 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'history' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage('history')}
            >
              History
            </button>
            <button 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'settings' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage('settings')}
            >
              Settings
            </button>
            <button 
              className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                currentPage === 'logs' 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage('logs')}
            >
              Logs
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {currentPage === 'home' && <Home />}
        {currentPage === 'history' && <History />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'logs' && <Logs />}
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;

