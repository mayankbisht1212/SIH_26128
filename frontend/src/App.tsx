import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import MyHerd from './components/MyHerd';
import Advisories from './components/Advisories';
import Trends from './components/Trends';
import { LanguageProvider } from './i18n/LanguageContext';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import { isMockAuth } from './lib/mockAuth';
import './index.css';

function ProtectedRoutes({ session, onLogout }) {
  if (!session) return <Navigate to="/login" replace />;

  return (
    <Home onLogout={onLogout}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/report" element={<ReportForm />} />
        <Route path="/herd" element={<MyHerd />} />
        <Route path="/advisories" element={<Advisories />} />
        <Route path="/trends" element={<Trends />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Home>
  );
}

function AppRoutes() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    if (isMockAuth) {
      const savedSession = localStorage.getItem('pashuraksha_mock_session');
      if (savedSession) {
        setSession(JSON.parse(savedSession));
      } else {
        const defaultSession = {
          user: { id: 'demo-user', email: 'demo@pashuraksha.local', role: 'Farmer' },
          access_token: 'dev-demo-token'
        };
        localStorage.setItem('pashuraksha_mock_session', JSON.stringify(defaultSession));
        setSession(defaultSession);
      }
      return undefined;
    }
    if (!isSupabaseConfigured) {
      setSession(null);
      return undefined;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const finishMockLogin = (mockSession) => {
    localStorage.setItem('pashuraksha_mock_session', JSON.stringify(mockSession));
    setSession(mockSession);
  };

  const logout = () => {
    localStorage.removeItem('pashuraksha_mock_session');
    setSession(null);
  };

  if (session === undefined) return null;
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login onMockLogin={finishMockLogin} />} />
      <Route path="/*" element={<ProtectedRoutes session={session} onLogout={logout} />} />
    </Routes>
  );
}

export default function App() {
  return <LanguageProvider><BrowserRouter><AppRoutes /></BrowserRouter></LanguageProvider>;
}
