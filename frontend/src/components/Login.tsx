import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Stethoscope, FlaskConical, Building2, Settings, Globe, Moon, Sun } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import './Login.css';
import { useLanguage } from '../i18n/LanguageContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const ROLES = [
  'Farmer',
  'Field Veterinarian',
  'Lab Technician',
  'District Officer',
  'System Administrator'
];

const ROLE_ICONS = {
  'Farmer': <User size={16} />,
  'Field Veterinarian': <Stethoscope size={16} />,
  'Lab Technician': <FlaskConical size={16} />,
  'District Officer': <Building2 size={16} />,
  'System Administrator': <Settings size={16} />
};

export default function Login({ onDemoLogin }: { onDemoLogin?: (user: any) => void }) {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState('light');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };
  
  // User Login State
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  // Admin Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalisePhone = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 10 ? `+91${digits}` : value.startsWith('+') ? value : `+${digits}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mobile.replace(/\D/g, '').length < 10) {
      setError('Enter a valid mobile number.');
      return;
    }
    try {
      setIsSubmitting(true);
      // Temporary demo mode: replace with Supabase signInWithOtp before production.
      await new Promise(resolve => setTimeout(resolve, 500));
      setError('Demo OTP generated: 123456');
      setOtpSent(true);
    } catch (authError: any) {
      setError(authError.message || 'Failed to send OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setIsSubmitting(true);
      if (otp !== '123456') throw new Error('Invalid demo OTP. Use 123456.');
      let authenticatedUser: any = {
        id: '00000000-0000-4000-8000-000000000001',
        phone: normalisePhone(mobile),
        email: email || 'demo@pashuraksha.local',
        role: selectedRole,
        user_metadata: { full_name: 'Demo User', role: selectedRole }
      };

      // A real anonymous Supabase session keeps Storage and report RLS policies active
      // while the OTP itself remains a no-cost local simulation.
      if (isSupabaseConfigured && supabase) {
        const { data, error: anonymousAuthError } = await supabase.auth.signInAnonymously({
          options: { data: { full_name: 'Demo User', role: selectedRole, phone: normalisePhone(mobile) } }
        });
        if (anonymousAuthError || !data.user) {
          throw new Error('Enable Anonymous Sign-Ins in Supabase Authentication → Providers to save demo reports.');
        }
        authenticatedUser = data.user;
      }
      onDemoLogin?.(authenticatedUser);
      navigate('/dashboard');
    } catch (authError: any) {
      setError(authError.message || 'Invalid OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setIsSubmitting(true);
      throw new Error('Administrator login is unavailable while demo authentication is enabled.');
      navigate('/dashboard');
    } catch (authError: any) {
      setError(authError.message || 'Admin login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`login-container ${theme}-theme`}>
      {/* Background decorations removed for formal look */}

      {/* Header */}
      <header className="login-header">
        <div className="logo-container">
          <div className="logo-icon" style={{ padding: 0, overflow: 'hidden', border: '2px solid white' }}>
            <img src={logoImg} alt="PashuRaksha Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span className="logo-text">{t('pashuraksha')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '4px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '4px', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', gap: '0.25rem' }}
            >
              <Globe size={16} /> {language.slice(0, 2).toUpperCase()}
            </button>
            
            {langDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '150px', overflow: 'hidden', zIndex: 50 }}>
                <div onClick={() => handleLanguageChange('English')} style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--text-dark)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>English</div>
                <div onClick={() => handleLanguageChange('Hindi')} style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--text-dark)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>Hindi (हिंदी)</div>
                <div onClick={() => handleLanguageChange('Marathi')} style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--text-dark)', cursor: 'pointer' }}>Marathi (मराठी)</div>
              </div>
            )}
          </div>

          <div className="role-selector">
          <button 
            className="role-btn" 
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
          >
            <span style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-light)' }}>
              {ROLE_ICONS[selectedRole]}
            </span> 
            <span className="hide-mobile-text">
              {t(selectedRole === 'Farmer' ? 'roleFarmer' : 
                 selectedRole === 'Field Veterinarian' ? 'roleVet' : 
                 selectedRole === 'Lab Technician' ? 'roleLab' : 
                 selectedRole === 'District Officer' ? 'roleOfficer' : 'roleAdmin')}
            </span>
            <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>▼</span>
          </button>
          
          {roleDropdownOpen && (
            <div className="role-dropdown fade-in">
              {ROLES.map(role => (
                <div 
                  key={role} 
                  className={`role-item ${selectedRole === role ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedRole(role);
                    setRoleDropdownOpen(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', color: selectedRole === role ? 'var(--primary)' : 'var(--text-light)' }}>
                    {ROLE_ICONS[role]}
                  </span>
                  {t(role === 'Farmer' ? 'roleFarmer' : 
                     role === 'Field Veterinarian' ? 'roleVet' : 
                     role === 'Lab Technician' ? 'roleLab' : 
                     role === 'District Officer' ? 'roleOfficer' : 'roleAdmin')}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Main Content */}
      <main className="login-content">
        <div className="login-card slide-down">
          <h2 className="login-title">{t('welcomeBack')}</h2>
          <p className="login-subtitle">{t('accessDashboard')}</p>
          <p style={{ color: '#b45309', fontSize: '0.82rem', marginBottom: '1rem' }}>Demo authentication is enabled. No SMS will be sent.</p>
          {error && <p role="alert" style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

          {!showAdmin ? (
            <>
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                {!otpSent ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">{t('mobileNumber')}</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        placeholder={t('mobilePlaceholder')}
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">
                        {t('gmail')} <span className="optional">{t('optional')}</span>
                      </label>
                      <input 
                        type="email" 
                        className="form-input" 
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    
                    <button type="submit" className="primary-btn" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending…' : t('sendOtp')}
                    </button>
                  </>
                ) : (
                  <div className="otp-section fade-in">
                    <div className="form-group">
                      <label className="form-label">{t('enterOtp')}</label>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.75rem' }}>
                        {t('sentTo')} {mobile}
                      </p>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={t('otpPlaceholder')}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        required
                        style={{ letterSpacing: '0.25rem', textAlign: 'center', fontSize: '1.25rem' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="button" className="primary-btn" style={{ background: 'var(--bg-color)', color: 'var(--text-dark)', border: '1px solid var(--border-color)' }} onClick={() => setOtpSent(false)}>
                        {t('back')}
                      </button>
                      <button type="submit" className="primary-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying…' : t('verifyLogin')}
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div className="divider">{t('systemStaff')}</div>
              
              <button 
                type="button" 
                className="auth-switch-btn" 
                onClick={() => setShowAdmin(true)}
              >
                <span role="img" aria-label="admin">🔐</span> {t('loginAsAdmin')}
              </button>
            </>
          ) : (
            <div className="admin-block fade-in" style={{ marginTop: 0 }}>
              <div className="admin-header">
                <span role="img" aria-label="admin">🔐</span>
                {t('adminLogin')}
              </div>
              
              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <input 
                    type="email" 
                    className="form-input admin-input" 
                    placeholder="admin@domain.gov.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <input 
                    type="password" 
                    className="form-input admin-input" 
                    placeholder={t('password')}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="primary-btn admin-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in…' : t('secureLogin')}
                </button>
              </form>
              
              <div className="divider">{t('return')}</div>
              
              <button 
                type="button" 
                className="auth-switch-btn" 
                onClick={() => setShowAdmin(false)}
              >
                {t('backToUserLogin')}
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
