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
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => setSession(data.session));
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
      return () => listener.subscription.unsubscribe();
    }

    const storedDemoSession = localStorage.getItem('pashuraksha_demo_session');
    if (storedDemoSession) {
      try {
        setSession(JSON.parse(storedDemoSession));
        return;
      } catch {
        localStorage.removeItem('pashuraksha_demo_session');
      }
    } else {
      setSession(null);
    }
  }, []);

  const finishDemoLogin = (user: any) => {
    const demoSession = { user, access_token: 'demo-session-only' };
    localStorage.setItem('pashuraksha_demo_session', JSON.stringify(demoSession));
    setSession(demoSession);
  };

  const logout = () => {
    localStorage.removeItem('pashuraksha_demo_session');
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setSession(null);
  };

  if (session === undefined) return null;
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login onDemoLogin={finishDemoLogin} />} />
      <Route path="/*" element={<ProtectedRoutes session={session} onLogout={logout} />} />
    </Routes>
  );
}

export default function App() {
  return <LanguageProvider><BrowserRouter><AppRoutes /></BrowserRouter></LanguageProvider>;
}
