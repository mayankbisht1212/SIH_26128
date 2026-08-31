import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Mic, Square, ArrowRight, X, MapPin, AlertOctagon, CheckCircle2, Clock, ChevronRight, Activity } from 'lucide-react';
import './ReportForm.css';
import { useLanguage } from '../i18n/LanguageContext';
import { requireSupabase } from '../lib/supabase';

export default function ReportForm({ initialImage }: { initialImage?: string | null }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(2);
  const [image, setImage] = useState(initialImage || null);
  const [symptoms, setSymptoms] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  
  // Step 3 State
  const [species, setSpecies] = useState('');
  const [mortality, setMortality] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [location, setLocation] = useState({ village: '', block: '', district: '', gps: '' });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const symptomOptions = [
    "High Fever (>104°F)", "Skin Nodules / Lumps (LSD)", "Blisters on Mouth & Tongue",
    "Hoof Lesions / Limping", "Excessive Drooling / Salivation", "Loss of Appetite / Lethargy",
    "Sudden Drop in Milk Yield", "Nasal Discharge / Coughing", "Severe Diarrhea", "Swollen Lymph Nodes"
  ];

  const speciesOptions = [
    { id: 'cattle', icon: '🐄', label: 'cattle' },
    { id: 'buffalo', icon: '🐃', label: 'buffalo' },
    { id: 'goat', icon: '🐐', label: 'goat' },
    { id: 'sheep', icon: '🐑', label: 'sheep' },
    { id: 'poultry', icon: '🐔', label: 'poultry' },
    { id: 'pig', icon: '🐖', label: 'pig' }
  ];

  const handleNext = async () => {
    if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setError('');
      try {
        setIsSubmitting(true);
        const client = requireSupabase();
        const { data: { user } } = await client.auth.getUser();
        if (!user) throw new Error('Your session has expired. Please sign in again.');
        const [latitude, longitude] = location.gps.split(',').map((value) => Number(value.trim()));
        const { error: reportError } = await client.from('reports').insert({
          reporter_id: user.id,
          species: species || null,
          symptoms_text: symptoms || null,
          selected_symptoms: selectedSymptoms,
          mortality_count: Number(mortality) || 0,
          village: location.village || null,
          block: location.block || null,
          district: location.district || null,
          latitude: Number.isFinite(latitude) ? latitude : null,
          longitude: Number.isFinite(longitude) ? longitude : null,
          assessment: 'High risk - suspected Lumpy Skin Disease',
          status: 'pending'
        });
        if (reportError) throw reportError;
        setStep(4);
      } catch (submitError) {
        setError(submitError.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleSymptom = (s) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter(item => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const gpsStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        let village = '';
        let block = '';
        let district = '';

        try {
          // Real reverse geocoding via OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            
            village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || addr.town || addr.residential || addr.city_district || '';
            block = addr.county || addr.subdistrict || addr.tehsil || addr.taluk || addr.municipality || addr.city || '';
            district = addr.state_district || addr.district || addr.city || addr.state || '';
          }
        } catch (geoErr) {
          console.warn('Reverse geocoding lookup error:', geoErr);
        }

        setLocation(prev => ({
          village: village || prev.village,
          block: block || prev.block,
          district: district || prev.district,
          gps: gpsStr
        }));
        setIsDetecting(false);
      },
      (error) => {
        let msg = error.message;
        if (error.code === 1) msg = "Location permission denied. Please allow location access in your browser.";
        else if (error.code === 2) msg = "Position unavailable. Make sure your device location/GPS is on.";
        else if (error.code === 3) msg = "Location request timed out. Please try again.";
        alert("Error getting location: " + msg);
        setIsDetecting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setAudioURL("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"); // Mock audio
    } else {
      setIsRecording(true);
      setAudioURL(null);
    }
  };

  return (
    <div className="report-form-container fade-in">
      {error && <p role="alert" style={{ color: '#dc2626', padding: '1rem 1rem 0' }}>{error}</p>}
      {/* Progress Bar removed as requested */}

      <div className="report-content">


        {step === 2 && (
          <div className="step-container slide-down">
            {image && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <img src={image} alt="Uploaded" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)' }}>Image Added</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>Our AI will analyze this photo.</p>
                </div>
                <button onClick={() => setImage(null)} style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-light)' }}>
                  <X size={16} />
                </button>
              </div>
            )}
            <h2 className="step-title">{t('symptomsInstructions')}</h2>
            <p className="step-subtitle">{t('recordHint')}</p>
            
            <div className="voice-record-area">
              <button 
                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
              >
                <span className="mic-icon">{isRecording ? <Square size={32} /> : <Mic size={32} />}</span>
              </button>
              <p className="mic-text">
                {isRecording ? t('recordingStop') : t('tapToRecord')}
              </p>
              {audioURL && (
                <div style={{ marginTop: '1rem', width: '100%' }}>
                  <audio src={audioURL} controls style={{ width: '100%', height: '40px' }} />
                  <button type="button" onClick={() => setAudioURL(null)} style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600' }}>
                    <X size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Delete Recording
                  </button>
                </div>
              )}
            </div>
            
            <div className="upload-divider">{t('orType')}</div>
            
            <textarea
              className="symptoms-input"
              placeholder={t('symptomsPlaceholder')}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
            ></textarea>
          </div>
        )}

        {step === 3 && (
          <div className="step-container slide-down">
            <h2 className="step-title">{t('species')}</h2>
            <div className="species-grid">
              {speciesOptions.map(opt => (
                <div 
                  key={opt.id} 
                  className={`species-card ${species === opt.id ? 'selected' : ''}`}
                  onClick={() => setSpecies(opt.id)}
                >
                  <span className="species-icon">{opt.icon}</span>
                  <span className="species-label">{t(opt.label)}</span>
                </div>
              ))}
            </div>

            <div className="grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h2 className="step-title" style={{ fontSize: '1rem' }}>{t('animalTag')}</h2>
                <select className="form-input" style={{ marginTop: '0.5rem' }}>
                  <option>{t('selectAnimal')}</option>
                  <option>TAG-1029 (Cow)</option>
                  <option>TAG-1030 (Buffalo)</option>
                </select>
              </div>
              <div>
                <h2 className="step-title" style={{ fontSize: '1rem' }}>{t('mortalityCount')}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input" 
                    style={{ width: '80px' }} 
                    value={mortality}
                    onChange={(e) => setMortality(e.target.value)}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>{t('enterIfDead')}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h2 className="step-title">{t('observedSymptoms')}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: '600' }}>
                {selectedSymptoms.length} {t('selected')}
              </span>
            </div>
            
            <div className="symptoms-grid" style={{ marginBottom: '2rem' }}>
              {symptomOptions.map(sym => (
                <div 
                  key={sym} 
                  className={`symptom-pill ${selectedSymptoms.includes(sym) ? 'selected' : ''}`}
                  onClick={() => toggleSymptom(sym)}
                >
                  {sym}
                </div>
              ))}
            </div>

            <div className="location-section">
              <div className="location-header">
                <h2 className="step-title" style={{ marginBottom: 0 }}>
                  <MapPin size={20} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--success)' }}/>
                  {t('locGeo')}
                </h2>
                <button 
                  type="button" 
                  className="detect-btn" 
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  style={{ opacity: isDetecting ? 0.7 : 1, cursor: isDetecting ? 'wait' : 'pointer' }}
                >
                  <MapPin size={16} /> 
                  {isDetecting ? (t('detectGPS') || 'Detecting GPS...') : (t('detectGPSBtn') || 'Detect GPS Location')}
                </button>
              </div>

              <div className="location-grid" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('village')}</label>
                  <input type="text" className="form-input" value={location.village} onChange={(e) => setLocation({...location, village: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('blockTaluka')}</label>
                  <input type="text" className="form-input" value={location.block} onChange={(e) => setLocation({...location, block: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('district')}</label>
                  <input type="text" className="form-input" value={location.district} onChange={(e) => setLocation({...location, district: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('gpsLatLng')}</label>
                  <input type="text" className="form-input" value={location.gps} readOnly style={{ backgroundColor: 'var(--bg-color)' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-container slide-down" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
              <AlertOctagon size={48} color="#ef4444" />
            </div>
            <h2 className="step-title" style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('aiAssessment')}</h2>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '2rem', color: '#ef4444' }}>88% Match</span>
              <span>{t('highRisk')} - {t('suspectedLsd')}</span>
            </h3>

            <div style={{ textAlign: 'left', background: 'var(--bg-color)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: '600', color: 'var(--text-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--success)" /> {t('actionTaken')}
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                {t('alertForwarded')}
              </p>

              <h4 style={{ fontWeight: '600', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                {t('immediateInstructions')}
              </h4>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-light)', paddingLeft: '0', listStyleType: 'none', margin: '0 0 1rem 0' }}>
                <li style={{ marginBottom: '0.5rem' }}>{t('isolateAnimal')}</li>
                <li>{t('doNotSellMilk')}</li>
              </ul>

              <h4 style={{ fontWeight: '600', color: 'var(--text-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#f59e0b" /> Transmission Precautions
              </h4>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-light)', paddingLeft: '1.25rem', margin: 0, lineHeight: '1.5' }}>
                <li style={{ marginBottom: '0.25rem' }}><strong>Contact Spread:</strong> Immediately isolate the sick cow to prevent direct contact with the rest of the herd.</li>
                <li style={{ marginBottom: '0.25rem' }}><strong>Water & Feed:</strong> Do not let healthy animals share water or feed troughs with the infected cow.</li>
                <li><strong>Air & Insects:</strong> Keep the area well-ventilated and control flies/mosquitoes.</li>
              </ul>
            </div>

            <button className="primary-btn" style={{ width: '100%', marginTop: '1rem' }} onClick={() => navigate('/dashboard')}>
              {t('returnHome')}
            </button>
          </div>
        )}
      </div>

      {step < 4 && (
        <div className="action-buttons">
          <button 
            className="secondary-btn" 
            onClick={() => step === 2 ? navigate('/dashboard') : setStep(step - 1)}
          >
            {step === 2 ? 'Cancel' : t('back')}
          </button>
          
          <button 
            className="primary-btn" 
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : step === 3 ? t('submitReport') : t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
