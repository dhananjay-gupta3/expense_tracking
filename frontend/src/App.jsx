import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Auth from './pages/Auth.jsx';
import Profile from './pages/Profile.jsx';
import Home from './pages/Home.jsx';

function AppContent() {
  const { user, initializing } = useAuth();
  const [view, setView] = useState('home');

  // Land on the expense list after every login/logout
  useEffect(() => {
    setView('home');
  }, [user?._id]);

  if (initializing) {
    return (
      <div className="app-splash">
        <div className="app-splash-spinner" />
      </div>
    );
  }

  if (!user) return <Auth />;

  if (view === 'profile') return <Profile onBack={() => setView('home')} />;

  return <Home onOpenProfile={() => setView('profile')} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
