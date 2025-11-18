import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { FiMenu } from 'react-icons/fi';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ProfileDropdown from './components/ProfileDropdown';
import Home from './pages/Home';
import Tools from './pages/Tools';
import History from './pages/History';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Telegram from './pages/Telegram';
import MemberManagement from './pages/MemberManagement';
import TransactionManagement from './pages/TransactionManagement';
import { isAuthenticated, logout, verifyToken, getCurrentUser, getUserRoles, isAdmin } from './services/authService';
import { initSocket, disconnectSocket } from './services/socketService';

// Component untuk proteksi route admin only
function AdminOnlyRoute({ children }) {
  const admin = isAdmin();
  return admin ? children : <Navigate to="/dashboard" replace />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [socketInitialized, setSocketInitialized] = useState(false);

  // Get current page from URL
  const getCurrentPageFromPath = (pathname) => {
    const path = pathname.replace('/', '') || 'dashboard';
    return path;
  };

  const currentPage = getCurrentPageFromPath(location.pathname);

  useEffect(() => {
    // Check if desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Debounce untuk checkAuth agar tidak terlalu sering dipanggil
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 100); // Debounce 100ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const checkAuth = async () => {
    if (isAuthenticated()) {
      try {
        // Gunakan cache untuk verifyToken, hanya force refresh jika diperlukan
        // Ini mengurangi jumlah request ke server dan menghindari rate limit
        await verifyToken(false);
        setIsLoggedIn(true);
        
        // Initialize socket setelah login berhasil (hanya sekali)
        const user = getCurrentUser();
        if (user && user.id && !socketInitialized) {
          initSocket(user.id);
          setSocketInitialized(true);
        }
        
        // Redirect ke dashboard jika sudah login dan di root atau login
        if (location.pathname === '/' || location.pathname === '/login') {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        setIsLoggedIn(false);
        setSocketInitialized(false);
        disconnectSocket();
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    } else {
      setIsLoggedIn(false);
      setSocketInitialized(false);
      disconnectSocket();
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
    setCheckingAuth(false);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    
    // Initialize socket setelah login berhasil (hanya sekali)
    const user = getCurrentUser();
    if (user && user.id && !socketInitialized) {
      initSocket(user.id);
      setSocketInitialized(true);
    }
    
    // Redirect ke dashboard setelah login berhasil
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    logout();
    disconnectSocket(); // Disconnect socket saat logout
    setIsLoggedIn(false);
    setSocketInitialized(false);
    navigate('/login', { replace: true });
  };

  const setCurrentPage = (page) => {
    navigate(`/${page}`, { replace: false });
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
      <Routes>
        <Route path="/login" element={
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
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onClose={closeSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />
      
      <div 
        className="flex-1 flex flex-col overflow-hidden"
        style={{
          marginLeft: isDesktop ? (sidebarCollapsed ? '64px' : '256px') : '0',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <header 
          className="bg-white border-b border-gray-200 shadow-sm fixed top-0 z-30"
          style={{
            left: isDesktop ? (sidebarCollapsed ? '64px' : '256px') : '0',
            right: '0',
            transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <FiMenu className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={toggleSidebarCollapse}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar collapse"
              >
                <FiMenu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            <ProfileDropdown 
              onLogout={handleLogout}
              onNavigate={setCurrentPage}
            />
          </div>
        </header>
        
        <main className="flex-1 overflow-auto pt-[73px]">
          <div className="max-w-[98%] w-full mx-auto px-2 md:px-4 py-4 md:py-8">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tools" element={<Tools setCurrentPage={setCurrentPage} />} />
              <Route path="/transaction-request" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/profile" element={<Profile />} />
              <Route 
                path="/telegram" 
                element={<AdminOnlyRoute><Telegram /></AdminOnlyRoute>} 
              />
              <Route path="/member-management" element={<MemberManagement />} />
              <Route path="/transaction-management" element={<TransactionManagement />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
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

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;

