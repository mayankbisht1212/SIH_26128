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
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    // 1. Check local storage for saved session
    const savedMock = localStorage.getItem('pashuraksha_mock_session');
    if (savedMock) {
      try {
        const parsed = JSON.parse(savedMock);
        if (parsed) {
          setSession(parsed);
          return undefined;
        }
      } catch {}
    }

    // 2. Default persistent session if non-existent (ensures refresh never logs out)
    const defaultSession = {
      user: {
        id: 'demo-user-1',
        email: 'ramesh@pashuraksha.gov.in',
        role: 'Farmer',
        user_metadata: { full_name: 'Ramesh Yadav', role: 'Farmer' }
      },
      access_token: 'dev-demo-token'
    };
    localStorage.setItem('pashuraksha_mock_session', JSON.stringify(defaultSession));
    setSession(defaultSession);

    // 3. Supabase listener if configured
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          setSession(data.session);
        }
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (nextSession) {
          setSession(nextSession);
        }
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  const finishMockLogin = (loginPayload: any) => {
    const sessionObj = loginPayload.session || {
      user: loginPayload.user || loginPayload,
      access_token: loginPayload.access_token || `mock-token-${Date.now()}`
    };
    localStorage.setItem('pashuraksha_mock_session', JSON.stringify(sessionObj));
    setSession(sessionObj);
  };

  const logout = () => {
    localStorage.removeItem('pashuraksha_mock_session');
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
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
