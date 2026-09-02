import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Globe, Moon, Sun, AlertTriangle, Megaphone, TrendingUp, Settings, Home as HomeIcon, Bell, X, CheckCircle2 } from 'lucide-react';
import './Home.css';
import './Tabs.css';
import { useLanguage } from '../i18n/LanguageContext';
import { requireSupabase, supabase } from '../lib/supabase';

// Custom Cow Icon for My Animals tab
export function CowIcon({ size = 22, color = 'currentColor', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {/* Horns */}
      <path d="M4 8C3 4.5 5 2.5 7 4" />
      <path d="M20 8C21 4.5 19 2.5 17 4" />
      {/* Ears */}
      <path d="M5 9.5C2.5 10 2.5 12.5 5 12.5" />
      <path d="M19 9.5C21.5 10 21.5 12.5 19 12.5" />
      {/* Head Outline */}
      <path d="M6 7.5H18V13.5C18 16.5 15.5 18 12 18C8.5 18 6 16.5 6 13.5V7.5Z" />
      {/* Muzzle / Snout */}
      <path d="M7.5 14C7.5 13.2 8.2 12.5 9 12.5H15C15.8 12.5 16.5 13.2 16.5 14V17C16.5 18.5 14.5 19.5 12 19.5C9.5 19.5 7.5 18.5 7.5 17V14Z" />
      {/* Nostrils */}
      <circle cx="10" cy="16.5" r="0.8" fill={color} stroke="none" />
      <circle cx="14" cy="16.5" r="0.8" fill={color} stroke="none" />
      {/* Eyes */}
      <circle cx="9" cy="10" r="1" fill={color} stroke="none" />
      <circle cx="15" cy="10" r="1" fill={color} stroke="none" />
    </svg>
  );
}

export default function Home({ children, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [theme, setTheme] = useState('light');
  const [showHomePopup, setShowHomePopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notifications = [
    { id: 1, type: 'alert', title: 'Local Outbreak: FMD', desc: '5 new cases of Foot & Mouth Disease reported within 10km of your location.', time: '10 mins ago', icon: <AlertTriangle size={16} color="#ef4444" /> },
    { id: 2, type: 'vaccine', title: 'Vaccination Due', desc: '3 animals in your herd are overdue for HS/BQ vaccination.', time: '2 hours ago', icon: <CheckCircle2 size={16} color="#f59e0b" /> },
    { id: 3, type: 'scheme', title: 'New Subsidy Available', desc: 'National Livestock Mission has released new grants for fodder cultivation.', time: '1 day ago', icon: <Megaphone size={16} color="var(--primary)" /> },
    { id: 4, type: 'trend', title: 'Trend Alert: LSD', desc: 'LSD cases are rising by 14% in your district this week.', time: '2 days ago', icon: <TrendingUp size={16} color="var(--primary)" /> },
  ];
  
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem('pashuraksha_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Ramesh Yadav',
      address: 'Anand, Gujarat, India',
      phone: '+91 9876543210'
    };
  });

  const [editFormData, setEditFormData] = useState({
    name: 'Ramesh Yadav',
    address: 'Anand, Gujarat, India',
    phone: '+91 9876543210'
  });

  useEffect(() => {
    const loadProfile = async () => {
      const saved = localStorage.getItem('pashuraksha_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfileData(parsed);
          setEditFormData(parsed);
        } catch {}
      }

      if (!supabase) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('profiles').select('full_name, address, phone').eq('id', user.id).maybeSingle();
        if (data && (data.full_name || data.address || data.phone)) {
          const loaded = {
            name: data.full_name || user.user_metadata?.full_name || 'Ramesh Yadav',
            address: data.address || 'Anand, Gujarat, India',
            phone: data.phone || user.phone || '+91 9876543210'
          };
          setProfileData(loaded);
          setEditFormData(loaded);
          localStorage.setItem('pashuraksha_profile', JSON.stringify(loaded));
        }
      } catch (err) {
        console.warn('Could not load profile from Supabase:', err);
      }
    };
    loadProfile();
  }, []);

  const handleGoHome = () => {
    setShowHomePopup(true);
  };

  const confirmGoHome = () => {
    navigate('/dashboard');
    setShowHomePopup(false);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    onLogout?.();
    navigate('/login');
  };

  const startEditingProfile = () => {
    setEditFormData({ ...profileData });
    setIsEditingProfile(true);
    setShowProfilePopup(true);
  };

  const cancelEditingProfile = () => {
    setEditFormData({ ...profileData });
    setIsEditingProfile(false);
  };

  const saveProfile = async () => {
    const updated = {
      name: editFormData.name.trim() || 'Ramesh Yadav',
      address: editFormData.address.trim() || 'Anand, Gujarat, India',
      phone: editFormData.phone.trim() || '+91 9876543210'
    };

    setProfileData(updated);
    setIsEditingProfile(false);

    try {
      localStorage.setItem('pashuraksha_profile', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('pashuraksha_profile_updated', { detail: updated }));
    } catch {}

    try {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const client = requireSupabase();
          await client.from('profiles').upsert({ 
            id: user.id, 
            full_name: updated.name, 
            address: updated.address, 
            phone: updated.phone 
          });
        }
      }
    } catch (saveError) {
      console.warn('Could not save to Supabase:', saveError);
    }
  };

  return (
    <div className={`home-container ${theme}-theme`}>
      {/* Top Navigation */}
      <header className="top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="home-btn" onClick={handleGoHome} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '600' }}>
            <HomeIcon size={18} /> <span className="hide-mobile">{language === 'Hindi' ? 'मुख्य पृष्ठ' : language === 'Marathi' ? 'मुख्य पृष्ठ' : 'Home'}</span>
          </button>
          <div className="profile-section" onClick={() => { setShowProfilePopup(true); setIsEditingProfile(false); }}>
            <div className="profile-avatar">
              <User size={24} color="var(--primary)" />
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{profileData.name}</h3>
              <p className="profile-location">{profileData.address.split(',')[0]}</p>
            </div>
          </div>
        </div>
        
        <div className="nav-actions">
          <div className="language-selector">
            <button 
              className="icon-btn lang-btn" 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            >
              <Globe size={18} style={{ marginRight: 4 }} /> {language.slice(0, 2).toUpperCase()}
            </button>
            
            {langDropdownOpen && (
              <div className="lang-dropdown">
                <div className="lang-option" onClick={() => handleLanguageChange('English')}>English</div>
                <div className="lang-option" onClick={() => handleLanguageChange('Hindi')}>Hindi (हिंदी)</div>
                <div className="lang-option" onClick={() => handleLanguageChange('Marathi')}>Marathi (मराठी)</div>
              </div>
            )}
          </div>
          
          <button className="icon-btn theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button className="icon-btn theme-btn" style={{ position: 'relative' }} onClick={() => setShowNotifications(true)}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: 'white', width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4</span>
          </button>

          <div className="language-selector">
            <button className="icon-btn theme-btn" onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}>
              <Settings size={18} />
            </button>
            {settingsDropdownOpen && (
              <div className="lang-dropdown" style={{ minWidth: '130px', zIndex: 10001 }}>
                <div className="lang-option" onClick={() => { setSettingsDropdownOpen(false); setIsEditingProfile(true); setShowProfilePopup(true); }}>Edit Profile</div>
                <div className="lang-option" style={{ color: '#ef4444', borderTop: '1px solid var(--border-color)' }} onClick={handleLogout}>Log Out</div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <span className="nav-icon"><HomeIcon size={22} /></span>
          <span className="nav-label">Home</span>
        </button>


        <button 
          className={`nav-item ${activeTab === 'herd' ? 'active' : ''}`}
          onClick={() => navigate('/herd')}
        >
          <span className="nav-icon"><CowIcon size={22} /></span>
          <span className="nav-label">My Animals</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'advisories' ? 'active' : ''}`}
          onClick={() => navigate('/advisories')}
        >
          <span className="nav-icon"><Megaphone size={22} /></span>
          <span className="nav-label">Alerts & Tips</span>
        </button>
        
        <button 
          className={`nav-item ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => navigate('/trends')}
        >
          <span className="nav-icon"><TrendingUp size={22} /></span>
          <span className="nav-label">Trends</span>
        </button>
      </nav>

      {/* Custom Popup Modal */}
      {showHomePopup && (
        <div className="popup-overlay fade-in">
          <div className="popup-card slide-down">
            <h3 className="popup-title">PashuRaksha</h3>
            <p className="popup-text">{t('confirmGoHome')}</p>
            <div className="popup-actions">
              <button className="popup-btn cancel" onClick={() => setShowHomePopup(false)}>
                Cancel
              </button>
              <button className="popup-btn confirm" onClick={confirmGoHome}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Popup Modal */}
      {showProfilePopup && (
        <div className="popup-overlay fade-in" onClick={() => setShowProfilePopup(false)}>
          <div className="popup-card slide-down" onClick={e => e.stopPropagation()} style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div className="profile-avatar" style={{ width: '60px', height: '60px', fontSize: '2rem' }}>
                <User size={32} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} 
                    style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: 'var(--text-dark)', padding: '0.4rem', width: '100%', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-color)' }} 
                  />
                ) : (
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: 'var(--text-dark)' }}>{profileData.name}</h3>
                )}
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>Farmer</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Contact Info</h4>
              <div style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                <strong>Address:</strong><br/>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={editFormData.address} 
                    onChange={(e) => setEditFormData({...editFormData, address: e.target.value})} 
                    style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-color)' }} 
                  />
                ) : (
                  profileData.address
                )}
              </div>
              <div style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-dark)' }}>
                <strong>Phone:</strong><br/>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={editFormData.phone} 
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} 
                    style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'var(--bg-color)' }} 
                  />
                ) : (
                  profileData.phone
                )}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Herd Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-dark)' }}>Total Animals:</span>
                <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>15</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-dark)' }}>Vaccinated:</span>
                <span style={{ fontWeight: '700', color: 'var(--success)' }}>12</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dark)' }}>Vaccination Due:</span>
                <span style={{ fontWeight: '700', color: '#ef4444' }}>3</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {isEditingProfile ? (
                <>
                  <button type="button" className="popup-btn cancel" style={{ flex: 1 }} onClick={cancelEditingProfile}>Cancel</button>
                  <button type="button" className="primary-btn" style={{ flex: 1 }} onClick={saveProfile}>Save</button>
                </>
              ) : (
                <>
                  <button type="button" className="popup-btn" style={{ flex: 1, border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-dark)' }} onClick={startEditingProfile}>Edit Profile</button>
                  <button type="button" className="primary-btn" style={{ flex: 1 }} onClick={() => setShowProfilePopup(false)}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Half-Screen Panel */}
      {showNotifications && (
        <>
          <style>{`
            @keyframes slideLeft {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
            .slide-left {
              animation: slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="popup-overlay fade-in" onClick={() => setShowNotifications(false)} style={{ background: 'rgba(0,0,0,0.5)', zIndex: 10005 }} />
          <div className="slide-left" style={{ position: 'fixed', top: 0, right: 0, width: '50%', minWidth: '320px', maxWidth: '400px', height: '100vh', background: 'var(--card-bg)', zIndex: 10006, boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={20} color="var(--primary)" /> {t('Alerts & Advisories') || 'Alerts & Advisories'}
              </h3>
              <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {notifications.map(notif => (
                <div key={notif.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)', borderRadius: '8px', marginBottom: '0.75rem' }}>
                  <div style={{ background: 'var(--card-bg)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                    {notif.icon}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', color: 'var(--text-dark)', fontWeight: '700' }}>{notif.title}</h4>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: '1.4' }}>{notif.desc}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>{notif.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
