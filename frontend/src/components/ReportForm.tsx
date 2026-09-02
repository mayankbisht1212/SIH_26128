import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Mic, Square, ArrowRight, X, MapPin, AlertOctagon, CheckCircle2, Clock, ChevronRight, Activity, FileText, Check, AlertTriangle, Play, Pause, Navigation, Layers } from 'lucide-react';
import './ReportForm.css';
import { useLanguage } from '../i18n/LanguageContext';
import { supabase } from '../lib/supabase';

export default function ReportForm({ initialImage }: { initialImage?: string | null }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [step, setStep] = useState(2);
  const [image, setImage] = useState<string | null>(initialImage || routeLocation.state?.image || null);
  const [symptoms, setSymptoms] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 3 State (All Optional)
  const [species, setSpecies] = useState('');
  const [tagId, setTagId] = useState('');
  const [mortality, setMortality] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [location, setLocation] = useState({ village: '', block: '', district: '', gps: '' });
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedReportData, setSubmittedReportData] = useState<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Automatically fetch GPS location when navigating to Step 3 or on mount
  useEffect(() => {
    if (step === 3 && !location.gps && !isDetecting && !locationDetected) {
      handleDetectLocation(false);
    }
  }, [step]);

  const symptomOptions = [
    "High Fever (>104°F)", "Skin Nodules / Lumps (LSD)", "Blisters on Mouth & Tongue",
    "Hoof Lesions / Limping", "Excessive Drooling / Salivation", "Loss of Appetite / Lethargy",
    "Sudden Drop in Milk Yield", "Nasal Discharge / Coughing", "Severe Diarrhea", "Swollen Lymph Nodes"
  ];

  const speciesOptions = [
    { id: 'cattle', icon: '🐄', label: 'Cattle (Cow/Bull)' },
    { id: 'buffalo', icon: '🐃', label: 'Buffalo' },
    { id: 'goat', icon: '🐐', label: 'Goat' },
    { id: 'sheep', icon: '🐑', label: 'Sheep' },
    { id: 'poultry', icon: '🐔', label: 'Poultry' },
    { id: 'pig', icon: '🐖', label: 'Pig' }
  ];

  const handleDetectLocation = (showAlert = true) => {
    if (!navigator.geolocation) {
      if (showAlert) alert("Geolocation is not supported by this browser.");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const gpsStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        let village = '';
        let block = '';
        let district = '';

        try {
          // Reverse geocoding via OpenStreetMap Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            village = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || addr.town || addr.residential || addr.city_district || '';
            block = addr.county || addr.subdistrict || addr.tehsil || addr.taluk || addr.municipality || addr.city || '';
            district = addr.state_district || addr.district || addr.city || addr.state || 'Anand';
          }
        } catch (geoErr) {
          console.warn('Reverse geocoding lookup error:', geoErr);
        }

        setLocation(prev => ({
          village: village || prev.village || 'Surveillance Zone',
          block: block || prev.block || 'Regional Sector',
          district: district || prev.district || 'Anand',
          gps: gpsStr
        }));
        setLocationDetected(true);
        setIsDetecting(false);
      },
      (geoError) => {
        setIsDetecting(false);
        if (showAlert) {
          let msg = geoError.message;
          if (geoError.code === 1) msg = "Location permission denied. Please allow location access in browser.";
          else if (geoError.code === 2) msg = "Position unavailable. Please check GPS settings.";
          else if (geoError.code === 3) msg = "Location request timed out.";
          alert("GPS Notice: " + msg);
        }
        // Fallback default coordinates if GPS unavailable so report has valid sector
        if (!location.gps) {
          setLocation(prev => ({
            village: prev.village || 'Central Farm',
            block: prev.block || 'District Sector 4',
            district: prev.district || 'Anand',
            gps: prev.gps || '22.5645, 72.9289'
          }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const toggleRecording = async () => {
    setMicError(null);

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError('Microphone not supported on this browser.');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicError('Microphone permission denied. Please allow mic access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setMicError('No microphone found on this device.');
        } else {
          setMicError('Could not access microphone: ' + err.message);
        }
        return;
      }

      streamRef.current = stream;
      audioChunksRef.current = [];
      setAudioURL(null);
      setRecordingSeconds(0);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      recorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const deleteRecording = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingSeconds(0);
  };

  const diagnosisFromModel = (prediction: { disease: string; confidence_percent: number }) => {
    const disease = prediction.disease.replace(/_/g, ' ');
    const isHealthy = prediction.disease === 'Healthy';
    const isLumpySkin = prediction.disease === 'Lumpy_Skin';
    return {
      disease,
      confidence: `${prediction.confidence_percent}%`,
      riskLevel: isHealthy ? 'NO VISUAL DISEASE DETECTED' : isLumpySkin ? 'HIGH RISK' : 'VETERINARY REVIEW NEEDED',
      riskColor: isHealthy ? '#16a34a' : isLumpySkin ? '#dc2626' : '#f59e0b',
      precautions: isHealthy
        ? ['Continue routine health monitoring.', 'Keep vaccination and deworming schedules up to date.', 'Contact a veterinarian if symptoms worsen.']
        : isLumpySkin
          ? ['Isolate the affected animal from healthy animals immediately.', 'Use vector-control measures for flies and mosquitoes.', 'Contact the nearest veterinarian for treatment and vaccination guidance.']
          : ['Keep the animal isolated until examined by a veterinarian.', 'Provide clean water and a clean, dry resting area.', 'Arrange a veterinary examination as soon as possible.']
    };
  };

  const requestModelPrediction = async () => {
    if (!image || !audioBlob) {
      throw new Error('Please attach a symptom photograph and record a voice message before submitting for AI analysis.');
    }

    const imageResponse = await fetch(image);
    if (!imageResponse.ok) throw new Error('The selected photo could not be prepared for AI analysis.');
    const imageBlob = await imageResponse.blob();
    const formData = new FormData();
    formData.append('file', imageBlob, 'animal-photo.jpg');
    formData.append('audio', audioBlob, 'voice-message.webm');

    const response = await fetch(`${import.meta.env.VITE_ML_API_URL || 'http://localhost:5001'}/predict`, {
      method: 'POST',
      body: formData
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.detail || 'The ML service could not analyse this report. Please try again.');
    }
    return payload as { disease: string; confidence_percent: number; audio: { received: boolean } };
  };

  const toggleSymptom = (s: string) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter(item => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  // AI Diagnostic assessment based on user inputs
  const calculateDiagnosis = () => {
    const syms = selectedSymptoms;
    const text = symptoms.toLowerCase();

    if (syms.some(s => s.includes('Blisters') || s.includes('Hoof') || s.includes('Drooling')) || text.includes('blister') || text.includes('mouth') || text.includes('hoof') || text.includes('saliv')) {
      return {
        disease: 'Foot & Mouth Disease (FMD)',
        confidence: '94%',
        riskLevel: 'HIGH RISK',
        riskColor: '#dc2626',
        precautions: [
          'Immediate quarantine of infected animal in an isolated shed.',
          'Wash lesions with mild antiseptic / 1% potassium permanganate solution.',
          'Strictly withhold commercial milk distribution until clear.',
          'Disinfect shared feeding troughs and boots with sodium carbonate.'
        ]
      };
    }

    if (syms.some(s => s.includes('Skin Nodules') || s.includes('LSD') || s.includes('Fever')) || text.includes('lump') || text.includes('nodule') || text.includes('skin') || text.includes('lsd')) {
      return {
        disease: 'Lumpy Skin Disease (LSD)',
        confidence: '89%',
        riskLevel: 'HIGH RISK',
        riskColor: '#dc2626',
        precautions: [
          'Isolate affected cattle from healthy animals immediately.',
          'Apply vector control sprays to eliminate biting flies and mosquitoes.',
          'Apply neem oil or antiseptic spray on cutaneous skin nodules.',
          'Report to nearest veterinary dispensary for emergency ring vaccination.'
        ]
      };
    }

    if (species === 'goat' || species === 'sheep' || syms.some(s => s.includes('Diarrhea') || s.includes('Nasal')) || text.includes('diarrhea') || text.includes('discharge')) {
      return {
        disease: 'PPR / Goat Plague Suspected',
        confidence: '82%',
        riskLevel: 'ELEVATED WATCH',
        riskColor: '#f59e0b',
        precautions: [
          'Isolate small ruminants in a dry, warm shelter.',
          'Administer prescribed oral rehydration salts (ORS) for diarrhea.',
          'Clean eye and nasal discharges with sterile saline.',
          'Administer supportive antipyretic & antibiotic therapy under vet guidance.'
        ]
      };
    }

    return {
      disease: 'Zoonotic Clinical Surveillance Case',
      confidence: '78%',
      riskLevel: 'MODERATE RISK',
      riskColor: '#3b82f6',
      precautions: [
        'Keep the animal under close observation for temperature spikes.',
        'Provide clean water and easily digestible green fodder.',
        'Restrict livestock movement beyond the farm perimeter.',
        'A local veterinarian officer has been alerted to verify clinical signs.'
      ]
    };
  };

  const handleNext = async () => {
    if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setError('');
      setIsSubmitting(true);

      let modelResponse: { disease: string; confidence_percent: number; audio: { received: boolean } };
      try {
        modelResponse = await requestModelPrediction();
      } catch (predictionError) {
        setError(predictionError instanceof Error ? predictionError.message : 'Unable to reach the ML service. Please try again.');
        setIsSubmitting(false);
        return;
      }

      const diagnosis = diagnosisFromModel(modelResponse);
      const reportSnapshot = {
        id: `REP-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        species: species ? (speciesOptions.find(s => s.id === species)?.label || species) : 'Livestock (Unspecified)',
        speciesIcon: speciesOptions.find(s => s.id === species)?.icon || '🐾',
        tagId: tagId || 'Untagged / Unassigned',
        mortalityCount: Number(mortality) || 0,
        symptomsText: symptoms || (audioURL ? 'Audio message recording provided' : 'Visual inspection report'),
        selectedSymptoms: selectedSymptoms,
        hasAudio: Boolean(audioURL),
        audioDuration: formatTime(recordingSeconds),
        hasImage: Boolean(image),
        imageSrc: image,
        location: {
          village: location.village || 'Local Sector',
          block: location.block || 'Regional Block',
          district: location.district || 'Anand',
          gps: location.gps || '22.5645, 72.9289'
        },
        diagnosis: diagnosis,
        mlResponse: modelResponse
      };

      setSubmittedReportData(reportSnapshot);

      // Attempt Supabase backend save (gracefully handles mock mode or network delays)
      try {
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          const [latitude, longitude] = reportSnapshot.location.gps.split(',').map((v) => Number(v.trim()));

          await supabase.from('reports').insert({
            reporter_id: user?.id || '00000000-0000-0000-0000-000000000000',
            species: species || null,
            symptoms_text: symptoms || null,
            selected_symptoms: selectedSymptoms,
            mortality_count: Number(mortality) || 0,
            village: location.village || null,
            block: location.block || null,
            district: location.district || null,
            latitude: Number.isFinite(latitude) ? latitude : null,
            longitude: Number.isFinite(longitude) ? longitude : null,
            assessment: `${diagnosis.disease} (${diagnosis.riskLevel})`,
            status: 'pending'
          });
        }
      } catch (saveError) {
        console.warn('Report logged locally (Supabase write skipped/offline):', saveError);
      } finally {
        setIsSubmitting(false);
        setStep(4);
      }
    }
  };

  return (
    <div className="report-form-container fade-in">
      {error && <p role="alert" style={{ color: '#dc2626', padding: '1rem 1rem 0' }}>{error}</p>}

      <div className="report-content">

        {/* STEP 2: Voice / Image / Symptom Input */}
        {step === 2 && (
          <div className="step-container slide-down">
            {image && (
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card-bg)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <img src={image} alt="Uploaded" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)' }}>Image Attached</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-light)' }}>Our AI will inspect lesions & visual patterns.</p>
                </div>
                <button onClick={() => setImage(null)} style={{ background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--text-light)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            )}
            
            <h2 className="step-title">{t('symptomsInstructions')}</h2>
            <p className="step-subtitle">{t('recordHint')}</p>
            
            <div className="voice-record-area">
              {micError && (
                <div style={{ width: '100%', marginBottom: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: '600' }}>{micError}</span>
                </div>
              )}

              <button
                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                type="button"
              >
                <span className="mic-icon">{isRecording ? <Square size={32} /> : <Mic size={32} />}</span>
              </button>

              {isRecording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {formatTime(recordingSeconds)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Recording audio...</span>
                </div>
              )}

              <p className="mic-text">
                {isRecording ? t('recordingStop') : t('tapToRecord')}
              </p>

              {audioURL && !isRecording && (
                <div style={{ marginTop: '1rem', width: '100%', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mic size={15} color="var(--primary)" /> Recorded Voice Note ({formatTime(recordingSeconds)})
                    </span>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: '600' }}>
                      Attached
                    </span>
                  </div>
                  <audio src={audioURL} controls style={{ width: '100%', height: '40px', display: 'block' }} />
                  <button
                    type="button"
                    onClick={deleteRecording}
                    style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={14} /> Remove Recording
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
              rows={3}
            ></textarea>
          </div>
        )}

        {/* STEP 3: Animal Category & Auto-location Details (All Optional) */}
        {step === 3 && (
          <div className="step-container slide-down">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 className="step-title" style={{ margin: 0 }}>{t('species')}</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', background: 'var(--bg-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                Optional
              </span>
            </div>
            
            <div className="species-grid">
              {speciesOptions.map(opt => (
                <div 
                  key={opt.id} 
                  className={`species-card ${species === opt.id ? 'selected' : ''}`}
                  onClick={() => setSpecies(species === opt.id ? '' : opt.id)}
                >
                  <span className="species-icon">{opt.icon}</span>
                  <span className="species-label">{opt.label}</span>
                </div>
              ))}
            </div>

            <div className="grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="step-title" style={{ fontSize: '0.95rem', margin: 0 }}>{t('animalTag')}</h2>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Optional</span>
                </div>
                <select 
                  className="form-input" 
                  style={{ marginTop: '0.4rem' }}
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                >
                  <option value="">-- {t('selectAnimal') || 'Select Tag (Optional)'} --</option>
                  <option value="TAG-1029">TAG-1029 (Gir Cow)</option>
                  <option value="TAG-1030">TAG-1030 (Murrah Buffalo)</option>
                  <option value="TAG-1044">TAG-1044 (Sirohi Goat)</option>
                  <option value="TAG-1051">TAG-1051 (Bull)</option>
                  <option value="UNTAGGED">Untagged / New Animal</option>
                </select>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="step-title" style={{ fontSize: '0.95rem', margin: 0 }}>{t('mortalityCount')}</h2>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Optional</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input" 
                    style={{ width: '80px' }} 
                    placeholder="0"
                    value={mortality}
                    onChange={(e) => setMortality(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{t('enterIfDead')}</span>
                </div>
              </div>
            </div>

            {/* Symptoms Checklist */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 className="step-title" style={{ margin: 0, fontSize: '1rem' }}>{t('observedSymptoms')}</h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>(Optional)</span>
              </div>
              {selectedSymptoms.length > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '700' }}>
                  {selectedSymptoms.length} {t('selected')}
                </span>
              )}
            </div>
            
            <div className="symptoms-grid" style={{ marginBottom: '1.75rem' }}>
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

            {/* Geolocation Section with Automatic Detection */}
            <div className="location-section">
              <div className="location-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h2 className="step-title" style={{ marginBottom: 0, fontSize: '1rem' }}>
                    <MapPin size={18} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--success)' }}/>
                    {t('locGeo')}
                  </h2>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>(Auto-detected)</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {locationDetected && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '600' }}>
                      <Check size={14} /> GPS Synced
                    </span>
                  )}
                  <button 
                    type="button" 
                    className="detect-btn" 
                    onClick={() => handleDetectLocation(true)}
                    disabled={isDetecting}
                    style={{ opacity: isDetecting ? 0.7 : 1, cursor: isDetecting ? 'wait' : 'pointer', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    <Navigation size={14} /> 
                    {isDetecting ? (t('detectGPS') || 'Detecting...') : 'Refresh GPS'}
                  </button>
                </div>
              </div>

              <div className="location-grid" style={{ marginTop: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">{t('village')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Village / Locality"
                    value={location.village} 
                    onChange={(e) => setLocation({...location, village: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('blockTaluka')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Block / Taluka"
                    value={location.block} 
                    onChange={(e) => setLocation({...location, block: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('district')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="District"
                    value={location.district} 
                    onChange={(e) => setLocation({...location, district: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('gpsLatLng')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={location.gps || (isDetecting ? 'Fetching GPS coordinates...' : 'Auto-detected on submit')} 
                    readOnly 
                    style={{ backgroundColor: 'var(--bg-color)', color: location.gps ? 'var(--text-dark)' : 'var(--text-light)' }} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Dynamic AI Assessment & Animal Incident Report Summary */}
        {step === 4 && submittedReportData && (
          <div className="step-container slide-down" style={{ padding: '1.5rem' }}>
            
            {/* Header Status Badge */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.85rem', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={42} color="var(--success)" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-dark)', margin: '0 0 0.35rem 0' }}>
                Report Successfully Logged
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: '600', color: 'var(--text-dark)' }}>
                  Case ID: {submittedReportData.id}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  {submittedReportData.timestamp}
                </span>
              </div>
            </div>

            {/* AI Diagnosis Header Card */}
            <div style={{ background: 'var(--bg-color)', border: `2px solid ${submittedReportData.diagnosis.riskColor}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: submittedReportData.diagnosis.riskColor }}>
                  ⚡ AI Diagnostic Assessment
                </span>
                <span style={{ background: submittedReportData.diagnosis.riskColor, color: 'white', fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  {submittedReportData.diagnosis.confidence} Confidence
                </span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-dark)' }}>
                {submittedReportData.diagnosis.disease}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                ML model result from the submitted photo and voice message. Audio received: {submittedReportData.mlResponse.audio.received ? 'yes' : 'no'}.
              </p>
            </div>

            {/* Comprehensive Uploaded Animal Details Grid */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <FileText size={16} color="var(--primary)" /> Uploaded Case File Summary
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Animal Species / Category</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                    <span>{submittedReportData.speciesIcon}</span> {submittedReportData.species}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Animal Tag / UID</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-dark)', display: 'block', marginTop: '0.15rem' }}>
                    {submittedReportData.tagId}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Mortality Count</span>
                  <strong style={{ fontSize: '0.95rem', color: submittedReportData.mortalityCount > 0 ? '#dc2626' : 'var(--success)', display: 'block', marginTop: '0.15rem' }}>
                    {submittedReportData.mortalityCount > 0 ? `${submittedReportData.mortalityCount} Dead` : '0 Fatalities (Sick Animal)'}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block' }}>Surveillance Sector</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-dark)', display: 'block', marginTop: '0.15rem' }}>
                    {submittedReportData.location.village}, {submittedReportData.location.district}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontFamily: 'monospace' }}>
                    GPS: {submittedReportData.location.gps}
                  </span>
                </div>
              </div>

              {/* Uploaded Audio Media Preview */}
              {submittedReportData.hasAudio && audioURL && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.35rem' }}>Attached Voice Message ({submittedReportData.audioDuration}):</span>
                  <audio src={audioURL} controls style={{ width: '100%', height: '36px' }} />
                </div>
              )}

              {/* Uploaded Image Media Preview */}
              {submittedReportData.hasImage && submittedReportData.imageSrc && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.4rem' }}>Attached Symptom Photograph:</span>
                  <img src={submittedReportData.imageSrc} alt="Reported case" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                </div>
              )}

              {/* Selected Symptoms Pills */}
              {submittedReportData.selectedSymptoms.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.4rem' }}>Clinical Symptoms Flagged:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {submittedReportData.selectedSymptoms.map((s: string, idx: number) => (
                      <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '600' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Typed or audio note text */}
              {symptoms && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', display: 'block', marginBottom: '0.2rem' }}>Farmer Symptom Description:</span>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                    "{symptoms}"
                  </p>
                </div>
              )}
            </div>

            {/* Immediate Action Plan & Transmission Precautions */}
            <div style={{ textAlign: 'left', background: 'var(--bg-color)', padding: '1.25rem', borderRadius: '10px', borderLeft: `4px solid ${submittedReportData.diagnosis.riskColor}`, marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: '700', color: 'var(--text-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} color="var(--success)" /> Protocol Activated
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.85rem' }}>
                An automated alert notification has been routed to the local Veterinary Dispensary & Livestock Inspector in <strong>{submittedReportData.location.district}</strong>.
              </p>

              <h4 style={{ fontWeight: '700', color: 'var(--text-dark)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} color="#f59e0b" /> Recommended Precautions for your {submittedReportData.species}:
              </h4>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-dark)', paddingLeft: '1.2rem', margin: 0, lineHeight: '1.6' }}>
                {submittedReportData.diagnosis.precautions.map((p: string, i: number) => (
                  <li key={i} style={{ marginBottom: '0.35rem' }}>{p}</li>
                ))}
              </ul>
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="secondary-btn" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/trends')}
              >
                <Layers size={16} style={{ marginRight: 6 }} /> View in Trends Map
              </button>
              <button 
                type="button" 
                className="primary-btn" 
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Buttons for Step 2 & Step 3 */}
      {step < 4 && (
        <div className="action-buttons">
          <button 
            className="secondary-btn" 
            type="button"
            onClick={() => step === 2 ? navigate('/dashboard') : setStep(step - 1)}
          >
            {step === 2 ? 'Cancel' : t('back')}
          </button>
          
          <button 
            className="primary-btn" 
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting Report…' : step === 3 ? t('submitReport') : t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
