import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertTriangle, CloudRain, FileText, X, CheckCircle2, Info } from 'lucide-react';

export default function Advisories() {
  const { t } = useLanguage();
  const [selectedAdvisory, setSelectedAdvisory] = useState(null);

  return (
    <div className="tab-container slide-down">
      <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '1.5rem' }}>
        {t('advisoriesSchemes')}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Active Alerts */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-dark)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>{t('activeAlerts')}</h3>
        <div className="advisory-card alert" style={{ cursor: 'pointer' }} onClick={() => setSelectedAdvisory({
          title: 'CRITICAL: Lumpy Skin Disease (LSD)',
          type: 'Alert',
          icon: <AlertTriangle size={24} />,
          desc: t('alertText'),
          date: 'Reported 2 hours ago',
          color: '#ef4444',
          detailsTitle: 'Action Required',
          details: [
            'Isolate suspected cases immediately to prevent flock spread.',
            'Restrict animal movement in and out of the farm.',
            'Disinfect premises and use fly/mosquito repellents.',
            'Contact local vet for immediate vaccination of healthy animals.'
          ]
        })}>
          <div className="advisory-icon alert-icon"><AlertTriangle size={24} /></div>
          <div className="advisory-content">
            <h3 className="advisory-title">CRITICAL: Lumpy Skin Disease (LSD)</h3>
            <p className="advisory-text">{t('alertText')}</p>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', marginTop: '0.5rem', display: 'block' }}>Reported 2 hours ago</span>
          </div>
        </div>
        <div className="advisory-card alert" style={{ cursor: 'pointer' }} onClick={() => setSelectedAdvisory({
          title: 'Foot & Mouth Disease (FMD) Warning',
          type: 'Alert',
          icon: <AlertTriangle size={24} />,
          desc: 'Cluster of FMD cases detected in neighboring Borsad block. Strict bio-security advised.',
          date: 'Reported 1 day ago',
          color: '#ef4444',
          detailsTitle: 'Action Required',
          details: [
            'Ensure all animals have received the bi-annual FMD vaccine.',
            'Avoid purchasing animals from affected regions.',
            'Wash hands and equipment before handling healthy animals.',
            'Watch for drooling and blisters on the mouth and hooves.'
          ]
        })}>
          <div className="advisory-icon alert-icon"><AlertTriangle size={24} /></div>
          <div className="advisory-content">
            <h3 className="advisory-title">Foot & Mouth Disease (FMD) Warning</h3>
            <p className="advisory-text">Cluster of FMD cases detected in neighboring Borsad block. Strict bio-security advised.</p>
            <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', marginTop: '0.5rem', display: 'block' }}>Reported 1 day ago</span>
          </div>
        </div>

        {/* Weather Advisory */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-dark)', marginTop: '1rem', marginBottom: '0.5rem' }}>{t('weatherAdvisory')}</h3>
        <div className="advisory-card weather" style={{ cursor: 'pointer' }} onClick={() => setSelectedAdvisory({
          title: 'Heavy Rainfall Alert',
          type: 'Weather',
          icon: <CloudRain size={24} />,
          desc: t('weatherText'),
          date: 'Valid for next 48 hours',
          color: '#3b82f6',
          detailsTitle: 'Precautions',
          details: [
            'Move animals to elevated, dry ground.',
            'Ensure fodder is stored in a dry place to prevent fungal toxins.',
            'Check for hoof infections regularly in wet conditions.',
            'Ensure proper drainage around animal sheds.'
          ]
        })}>
          <div className="advisory-icon weather-icon"><CloudRain size={24} /></div>
          <div className="advisory-content">
            <h3 className="advisory-title">Heavy Rainfall Alert</h3>
            <p className="advisory-text">{t('weatherText')}</p>
          </div>
        </div>
        <div className="advisory-card weather" style={{ cursor: 'pointer' }} onClick={() => setSelectedAdvisory({
          title: 'Heatwave Warning',
          type: 'Weather',
          icon: <CloudRain size={24} />,
          desc: 'Temperatures expected to rise above 40°C next week. Ensure adequate shade and water for cattle.',
          date: 'Valid for next 7 days',
          color: '#f59e0b',
          detailsTitle: 'Precautions',
          details: [
            'Provide continuous access to cool, clean drinking water.',
            'Do not graze animals during peak heat hours (11 AM to 4 PM).',
            'Ensure sheds have adequate cross-ventilation and shade.',
            'Watch for signs of heatstroke (excessive panting, lethargy).'
          ]
        })}>
          <div className="advisory-icon weather-icon" style={{ background: '#f59e0b' }}><CloudRain size={24} /></div>
          <div className="advisory-content">
            <h3 className="advisory-title">Heatwave Warning</h3>
            <p className="advisory-text">Temperatures expected to rise above 40°C next week. Ensure adequate shade and water for cattle.</p>
          </div>
        </div>

        {/* Schemes */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-dark)', marginTop: '1rem', marginBottom: '0.5rem' }}>{t('govtSchemes')}</h3>
        <div className="advisory-card scheme" style={{ cursor: 'pointer' }} onClick={() => setSelectedAdvisory({
          title: 'Vaccination Subsidy',
          type: 'Scheme',
          icon: <FileText size={24} />,
          desc: t('schemeText'),
          date: 'Ongoing program',
          color: 'var(--success)',
          detailsTitle: 'Eligibility & Info',
          details: [
            'Available for all registered dairy farmers.',
            'Covers 100% cost of FMD and Brucellosis vaccines.',
            'Farmers must show their PashuRaksha ID to the visiting vet.',
            'Next vaccination camp scheduled for 15th September.'
          ]
        })}>
          <div className="advisory-icon scheme-icon"><FileText size={24} /></div>
          <div className="advisory-content">
            <h3 className="advisory-title">Vaccination Subsidy</h3>
            <p className="advisory-text">{t('schemeText')}</p>
          </div>
        </div>
        <div className="advisory-card scheme" style={{ cursor: 'pointer' }} onClick={() => setSelectedAdvisory({
          title: 'National Livestock Mission (NLM)',
          type: 'Scheme',
          icon: <FileText size={24} />,
          desc: 'New grants available for fodder cultivation and breed improvement. Deadline: 30/09/2026.',
          date: 'Deadline: 30/09/2026',
          color: 'var(--success)',
          detailsTitle: 'Eligibility & Info',
          details: [
            '50% capital subsidy for establishing fodder seed processing infrastructure.',
            'Grants available for rural poultry and piggery farms.',
            'Applications must be submitted through the official NLM portal.',
            'Requires Aadhar, Land Records, and Bank Details.'
          ]
        })}>
          <div className="advisory-icon scheme-icon"><FileText size={24} /></div>
          <div className="advisory-content">
            <h3 className="advisory-title">National Livestock Mission (NLM)</h3>
            <p className="advisory-text">New grants available for fodder cultivation and breed improvement. Deadline: 30th Sept.</p>
          </div>
        </div>

      </div>

      {/* Advisory Details Modal */}
      {selectedAdvisory && (
        <div className="popup-overlay fade-in" onClick={() => setSelectedAdvisory(null)}>
          <div className="popup-card slide-down" onClick={e => e.stopPropagation()} style={{ textAlign: 'left', maxHeight: '85vh', overflowY: 'auto', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: 'var(--text-dark)' }}>{selectedAdvisory.title}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: selectedAdvisory.color, background: 'var(--card-bg)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: `1px solid ${selectedAdvisory.color}60`, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {selectedAdvisory.type}
                  </span>
                  {selectedAdvisory.date && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      {selectedAdvisory.date}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedAdvisory(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                {selectedAdvisory.desc}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '0.75rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={16} color={selectedAdvisory.color} /> {selectedAdvisory.detailsTitle}
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                {selectedAdvisory.details.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.4rem' }}>{item}</li>
                ))}
              </ul>
            </div>

            <button className="primary-btn" style={{ width: '100%' }} onClick={() => setSelectedAdvisory(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
