import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. Page load hote hi check karo ki kya user logged in hai
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (loggedIn === "true") {
      setIsAuth(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsAuth(false);
  };

  if (loading) return null; // Blink hone se bachane ke liye

  if (!isAuth) {
    return <Login setAuth={setIsAuth} />;
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <nav style={{ padding: '15px 40px', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#818cf8' }}>Krins CRM Dashboard</h3>
        <button 
          onClick={handleLogout} 
          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </nav>

      <Dashboard />
    </div>
  );
}

export default App;