import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { MapPin, Phone, Camera, PawPrint, Megaphone, HeartPulse, TrendingUp, ChevronRight, Sparkles, X, AlertOctagon, CheckCircle2, Activity } from 'lucide-react';
import './Tabs.css';
import { formatDateDDMMYYYY } from '../lib/dateUtils';

export default function Dashboard({ profileData }: { profileData?: { name?: string } }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState(null);

  const [displayName, setDisplayName] = useState(() => {
    if (profileData?.name) return profileData.name;
    try {
      const saved = localStorage.getItem('pashuraksha_profile');
      if (saved) return JSON.parse(saved).name || 'Ramesh Yadav';
    } catch {}
    return 'Ramesh Yadav';
  });

  useEffect(() => {
    if (profileData?.name) {
      setDisplayName(profileData.name);
    }
  }, [profileData?.name]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail?.name) {
        setDisplayName(e.detail.name);
      } else {
        try {
          const saved = localStorage.getItem('pashuraksha_profile');
          if (saved) setDisplayName(JSON.parse(saved).name || 'Ramesh Yadav');
        } catch {}
      }
    };
    window.addEventListener('pashuraksha_profile_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('pashuraksha_profile_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => navigate('/report');
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const previousReports = [
    { 
      id: 'RPT-8429', date: '28/08/2026', animal: 'Cattle (LSD suspected)', status: 'Pending Review', color: '#f59e0b', info: 'High fever, severe skin nodules on the neck.',
      details: {
        disease: 'Lumpy Skin Disease (LSD)',
        mortalityRate: '2% - 5%',
        recoveryTime: '2 to 4 weeks',
        potentialLoss: 'Severe drop in milk yield, prolonged infertility',
        description: 'A viral disease of cattle characterized by fever, enlarged lymph nodes, and multiple nodules on the skin and mucous membranes.',
        precautions: [
          'Isolate the infected animal immediately (Prevent direct contact spread).', 
          'Keep healthy cows away from the infected cow\'s water and feed troughs (Prevents spread through saliva/water).',
          'Ensure proper ventilation and control mosquito/tick populations (Air & Vector transmission).',
          'Do not move the animal to common grazing areas.'
        ],
        aftercare: ['Provide soft, easy-to-chew feed.', 'Ensure access to clean drinking water.', 'Clean skin lesions with mild antiseptic.'],
        medications: ['Consult a vet for antibiotics to prevent secondary infections.', 'Anti-inflammatory drugs for fever and pain.']
      }
    },
    { 
      id: 'RPT-8102', date: '15/08/2026', animal: 'Goat (PPR suspected)', status: 'Resolved', color: 'var(--success)', info: 'Severe diarrhea and nasal discharge.',
      details: {
        disease: 'Peste des Petits Ruminants (PPR)',
        mortalityRate: 'Up to 90%',
        recoveryTime: '1 to 2 weeks (if treated early)',
        potentialLoss: 'High risk of complete herd wipeout, severe weight loss',
        description: 'A highly contagious viral disease affecting goats and sheep, characterized by severe fever, mouth sores, diarrhea, and pneumonia.',
        precautions: ['Strict quarantine of new or sick animals.', 'Vaccinate healthy animals in the flock.', 'Bury or burn carcasses safely.'],
        aftercare: ['Rehydration therapy.', 'Provide a warm, dry resting place.', 'Clean eyes and nose regularly.'],
        medications: ['Broad-spectrum antibiotics for secondary pneumonia.', 'Electrolytes for dehydration.']
      }
    }
  ];

  return (
    <div className="tab-container slide-down dashboard-container" style={{ padding: '1rem', paddingBottom: '6rem' }}>
      
      {/* Header Section */}
      <div style={{ marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '1.25rem', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
        <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-dark)', fontWeight: '600', fontSize: '0.9rem' }}>
          {t('namaste')}, {displayName} {t('ji')} 🙏
        </p>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-dark)' }}>
          {t('pashurakshaDashboard')}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem', width: '100%' }}>
          <button
            type="button"
            onClick={() => navigate('/herd')}
            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', width: '100%' }}
          >
            <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center', minHeight: '76px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>3</div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>My Animals</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/herd')}
            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', width: '100%' }}
          >
            <div style={{ width: '100%', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center', minHeight: '76px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#b45309' }}>1</div>
              <div style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Vaccines Due</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/trends')}
            style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', width: '100%' }}
          >
            <div style={{ width: '100%', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.6rem 0.4rem', textAlign: 'center', minHeight: '76px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#b91c1c' }}>1</div>
              <div style={{ fontSize: '0.68rem', color: '#b91c1c', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Nearby Alerts</div>
            </div>
          </button>
        </div>
      </div>

      {/* Ambulance Banner */}
      <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div style={{ background: '#16a34a', padding: '0.5rem', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Phone size={20} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', color: '#166534', fontWeight: '700' }}>{t('ambulanceTitle')}</h3>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#14532d', fontWeight: '800' }}>{t('tollFreeHelpline')}</p>
          </div>
        </div>
        <a href="tel:1962" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#16a34a', color: 'white', textDecoration: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem' }}>
          <Phone size={18} /> {t('call1962')}
        </a>
      </div>

      {/* Upload/Capture Area */}
      <div style={{ background: 'var(--card-bg)', border: '2px dashed #f97316', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-10px', left: '1.25rem', background: '#f97316', color: 'white', padding: '0.2rem 0.75rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem', textTransform: 'uppercase' }}>
          <Sparkles size={12} /> {t('startAiAssessment')}
        </div>
        <h3 style={{ color: 'var(--text-dark)', fontWeight: '700', marginBottom: '0.5rem' }}>{t('checkAnimal')}</h3>
        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{t('checkAnimalDesc')}</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label htmlFor="dashboard-upload" style={{ width: '100%', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)' }}>
            <Camera size={24} />
            <span style={{ fontWeight: '700', fontSize: '1rem' }}>{t('takePhoto')}</span>
          </label>
          <button onClick={() => navigate('/report')} style={{ width: '100%', background: 'var(--bg-color)', border: '1px solid #f97316', color: '#ea580c', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
            {t('nextStep')} <ChevronRight size={20} />
          </button>
        </div>
        <input 
          id="dashboard-upload" 
          type="file" 
          accept="image/*" 
          onChange={handleImageUpload}
          style={{ display: 'none' }} 
        />
      </div>

      {/* Call Doctor */}
      <a href="tel:1962" style={{ textDecoration: 'none', background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
        <div style={{ background: '#dcfce7', padding: '0.75rem', borderRadius: '12px', color: '#16a34a' }}>
          <HeartPulse size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', color: 'var(--text-dark)', fontWeight: '700' }}>{t('callDoctor')}</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-light)', lineHeight: '1.4' }}>{t('callDoctorDesc')}</p>
        </div>
        <ChevronRight size={20} color="var(--text-light)" />
      </a>

      {/* Recent Reports */}
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-dark)', margin: '0 0 1rem 0' }}>{t('recentReports')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {previousReports.map((report) => (
            <div key={report.id} onClick={() => setSelectedReport(report)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-dark)' }}>{report.id}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: '700', color: report.color, background: 'var(--card-bg)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: `1px solid ${report.color}40`, textTransform: 'uppercase' }}>
                    {report.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginBottom: '0.25rem' }}>
                  {formatDateDDMMYYYY(report.date)} • {report.animal}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.4' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>{t('issue')}: </span>
                  {report.info}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ChevronRight size={18} color="var(--text-light)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="popup-overlay fade-in" onClick={() => setSelectedReport(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="popup-card slide-down" onClick={e => e.stopPropagation()} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '500px', textAlign: 'left', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: 'var(--text-dark)' }}>{selectedReport.details.disease}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: selectedReport.color, background: 'var(--card-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: `1px solid ${selectedReport.color}60` }}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: '600' }}>{t('mortalityRate')}</div>
                <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: '700' }}>{selectedReport.details.mortalityRate}</div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: '600' }}>{t('estRecovery')}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700' }}>{selectedReport.details.recoveryTime}</div>
              </div>
              <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '0.25rem', fontWeight: '600' }}>{t('potentialLoss')}</div>
                <div style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: '700' }}>{selectedReport.details.potentialLoss}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                {selectedReport.details.description}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.75rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertOctagon size={16} color="#ef4444" /> {t('precautions')}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                {selectedReport.details.precautions.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.75rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="var(--success)" /> {t('aftercare')}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                {selectedReport.details.aftercare.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.75rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={16} color="#3b82f6" /> {t('medications')}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                {selectedReport.details.medications.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>
                ))}
              </ul>
            </div>

            <button style={{ width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }} onClick={() => setSelectedReport(null)}>
              {t('closeDetails')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
