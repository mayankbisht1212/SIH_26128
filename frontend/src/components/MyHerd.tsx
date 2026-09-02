import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Activity, Syringe, CalendarCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { requireSupabase, isSupabaseConfigured } from '../lib/supabase';
import { formatDateDDMMYYYY } from '../lib/dateUtils';

const ICONS: Record<string, string> = { 'Cattle (Cow)': '🐄', Buffalo: '🐃', Goat: '🐐', Sheep: '🐑', Poultry: '🐔', Pig: '🐖' };

const DEFAULT_ANIMALS = [
  { dbId: 'local-1', id: 'TAG-1029', type: 'Cattle (Cow)', status: 'healthy', lastVac: '2026-03-15', vaccine: 'LSD / FMD Vaccine', nextVac: '2027-03-15', icon: '🐄' },
  { dbId: 'local-2', id: 'TAG-1030', type: 'Buffalo', status: 'healthy', lastVac: '2025-08-10', vaccine: 'HS / BQ Vaccine', nextVac: '2026-08-10', icon: '🐃' },
  { dbId: 'local-3', id: 'TAG-1031', type: 'Goat', status: 'sick', lastVac: '2026-01-20', vaccine: 'PPR Vaccine', nextVac: '2027-01-20', icon: '🐐' }
];

export default function MyHerd() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [animals, setAnimals] = useState<any[]>(() => {
    try {
      const local = localStorage.getItem('pashuraksha_local_animals');
      if (local) return JSON.parse(local);
    } catch {}
    return DEFAULT_ANIMALS;
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const totalAnimals = animals.length;
  const dueCount = animals.filter(a => a.nextVac === 'Overdue' || (a.nextVac && new Date(a.nextVac) < new Date())).length;
  const vaccinatedCount = totalAnimals - dueCount;

  const vaxData = [
    { name: 'Vaccinated', value: vaccinatedCount, color: '#10b981' },
    { name: 'Due', value: dueCount, color: '#ef4444' }
  ];

  const [showModal, setShowModal] = useState(false);
  const [newAnimal, setNewAnimal] = useState({ id: '', type: 'Cattle (Cow)', status: 'healthy', lastVac: '', vaccine: '', nextVac: '', icon: '🐄' });

  const mapAnimal = (row: any) => ({
    dbId: row.id, id: row.tag_id, type: row.species, status: row.health_status,
    lastVac: row.last_vaccinated_on || '', vaccine: row.vaccine_name || '',
    nextVac: row.next_vaccination_on || '', icon: ICONS[row.species] || '🐾'
  });

  const saveToLocal = (updatedList: any[]) => {
    setAnimals(updatedList);
    try {
      localStorage.setItem('pashuraksha_local_animals', JSON.stringify(updatedList));
    } catch {}
  };

  useEffect(() => {
    const loadAnimals = async () => {
      if (!isSupabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const client = requireSupabase();
        const { data, error: loadError } = await client.from('animals').select('*').order('created_at', { ascending: false });
        if (loadError) {
          console.warn('Supabase animals table query note:', loadError.message);
          // Keep local fallback data if table not found
          return;
        }
        if (data && data.length > 0) {
          saveToLocal(data.map(mapAnimal));
        }
      } catch (loadError: any) {
        console.warn('Could not fetch from Supabase animals table:', loadError.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadAnimals();
  }, []);

  const handleSave = async () => {
    if (!newAnimal.id.trim()) return;
    setError('');

    const localItem = {
      dbId: `local-${Date.now()}`,
      id: newAnimal.id.trim(),
      type: newAnimal.type,
      status: newAnimal.status,
      lastVac: newAnimal.lastVac || '',
      vaccine: newAnimal.vaccine || '',
      nextVac: newAnimal.nextVac || '',
      icon: newAnimal.icon || '🐄'
    };

    const updatedList = [localItem, ...animals];
    saveToLocal(updatedList);
    setShowModal(false);
    setNewAnimal({ id: '', type: 'Cattle (Cow)', status: 'healthy', lastVac: '', vaccine: '', nextVac: '', icon: '🐄' });

    // Try cloud save if Supabase is active
    if (isSupabaseConfigured) {
      try {
        const client = requireSupabase();
        const { data: { user } } = await client.auth.getUser();
        if (user) {
          await client.from('animals').insert({
            owner_id: user.id, tag_id: localItem.id, species: localItem.type,
            health_status: localItem.status, last_vaccinated_on: localItem.lastVac || null,
            vaccine_name: localItem.vaccine || null, next_vaccination_on: localItem.nextVac || null
          });
        }
      } catch (saveError: any) {
        console.warn('Saved locally (Supabase table pending):', saveError.message);
      }
    }
  };

  const handleTypeChange = (type: string) => {
    let icon = '🐄';
    if (type === 'Buffalo') icon = '🐃';
    if (type === 'Goat') icon = '🐐';
    if (type === 'Sheep') icon = '🐑';
    if (type === 'Poultry') icon = '🐔';
    if (type === 'Pig') icon = '🐖';
    setNewAnimal({ ...newAnimal, type, icon });
  };

  const handleUpdateVax = async (animal: any) => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearStr = nextYear.toISOString().split('T')[0];

    const updated = animals.map((item) => item.id === animal.id ? { ...item, lastVac: today, nextVac: nextYearStr } : item);
    saveToLocal(updated);

    if (isSupabaseConfigured && !animal.dbId.startsWith('local-')) {
      try {
        await requireSupabase().from('animals')
          .update({ last_vaccinated_on: today, next_vaccination_on: nextYearStr })
          .eq('id', animal.dbId);
      } catch (updateError: any) {
        console.warn('Updated locally (Supabase table pending):', updateError.message);
      }
    }
  };

  return (
    <div className="tab-container slide-down">
      {error && <p role="alert" style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)' }}>{t('myAnimalsHerd')}</h2>
        <button className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setShowModal(true)}>
          {t('addAnimal')}
        </button>
      </div>

      {/* Herd Dashboard */}
      <div style={{ marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '1.25rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-dark)', fontSize: '1.1rem' }}>Vaccination Dashboard</h3>
        <div className="grid-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
          
          {/* Visual Chart */}
          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={vaxData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value">
                  {vaxData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Stats & Progress */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
              <div style={{ padding: '0.5rem', background: 'var(--bg-color)', borderRadius: '4px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-dark)' }}>{totalAnimals}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>TOTAL</div>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--success)' }}>{vaccinatedCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>VACCINATED</div>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>{dueCount}</div>
                <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>DUE</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: '600' }}>
                <span style={{ color: 'var(--text-light)' }}>Herd Immunity Status</span>
                <span style={{ color: 'var(--text-dark)' }}>{Math.round((vaccinatedCount/totalAnimals)*100) || 0}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((vaccinatedCount/totalAnimals)*100) || 0}%`, height: '100%', background: 'var(--success)', transition: 'width 0.5s ease-in-out' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {isLoading && <p style={{ color: 'var(--text-light)' }}>Loading your animals…</p>}
        {!isLoading && animals.length === 0 && <p style={{ color: 'var(--text-light)' }}>No animals yet. Add your first animal to start tracking vaccinations.</p>}
        {animals.map((animal) => (
          <div key={animal.id} className="animal-card">
            <div className="animal-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{animal.icon}</span>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>{animal.id}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>{t(animal.type.toLowerCase().includes('cattle') ? 'cattle' : animal.type.toLowerCase()) || animal.type}</p>
                </div>
              </div>
              <div className={`status-badge ${animal.status}`}>
                {t(animal.status)}
              </div>
            </div>
            
            <div className="animal-card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="info-block">
                <span className="info-label"><Activity size={14} /> {t('healthStatus')}</span>
                <span className="info-value">{t(animal.status)}</span>
              </div>
              <div className="info-block">
                <span className="info-label"><CalendarCheck size={14} /> Last Vaccinated</span>
                <span className="info-value">{animal.lastVac ? `${formatDateDDMMYYYY(animal.lastVac)} (${animal.vaccine})` : 'None'}</span>
              </div>
              <div className="info-block" style={{ gridColumn: '1 / -1' }}>
                <span className="info-label"><Syringe size={14} /> {t('nextDue')}</span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '0.25rem' }}>
                  <span className="info-value" style={{ color: animal.nextVac === 'Overdue' || new Date(animal.nextVac) < new Date() ? '#ef4444' : 'inherit' }}>
                    {formatDateDDMMYYYY(animal.nextVac)}
                  </span>
                  {(animal.nextVac === 'Overdue' || new Date(animal.nextVac) < new Date()) && (
                    <button 
                      style={{ background: 'var(--success)', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                      onClick={() => handleUpdateVax(animal)}
                    >
                      Mark Vaccinated
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
              <button 
                className="primary-btn" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: '#f59e0b', border: 'none', color: 'white' }}
                onClick={() => navigate('/report')}
              >
                {t('reportSymptomBtn')}
              </button>
              <button 
                className="primary-btn" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', background: '#ef4444', border: 'none', color: 'white' }}
                onClick={() => navigate('/report')}
              >
                {t('reportMortalityBtn')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Animal Modal */}
      {showModal && (
        <div className="popup-overlay fade-in">
          <div className="popup-card slide-down" style={{ textAlign: 'left' }}>
            <h3 className="popup-title" style={{ color: 'var(--text-dark)' }}>{t('addNewAnimalTitle')}</h3>
            
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">Tag ID</label>
              <input type="text" className="form-input" placeholder="e.g. TAG-1032" value={newAnimal.id} onChange={e => setNewAnimal({...newAnimal, id: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Species</label>
              <select className="form-input" value={newAnimal.type} onChange={e => handleTypeChange(e.target.value)}>
                <option value="Cattle (Cow)">Cattle (Cow)</option>
                <option value="Buffalo">Buffalo</option>
                <option value="Goat">Goat</option>
                <option value="Sheep">Sheep</option>
                <option value="Poultry">Poultry</option>
                <option value="Pig">Pig</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('healthStatus')}</label>
              <select className="form-input" value={newAnimal.status} onChange={e => setNewAnimal({...newAnimal, status: e.target.value})}>
                <option value="healthy">{t('healthy')}</option>
                <option value="sick">{t('sick')}</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Last Vaccinated</label>
                <input type="date" className="form-input" value={newAnimal.lastVac} onChange={e => setNewAnimal({...newAnimal, lastVac: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Vaccine Name</label>
                <input type="text" className="form-input" placeholder="e.g. FMD" value={newAnimal.vaccine} onChange={e => setNewAnimal({...newAnimal, vaccine: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('nextDue')} (Date)</label>
              <input type="date" className="form-input" value={newAnimal.nextVac} onChange={e => setNewAnimal({...newAnimal, nextVac: e.target.value})} />
            </div>

            <div className="popup-actions" style={{ marginTop: '1.5rem' }}>
              <button className="popup-btn cancel" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button className="popup-btn confirm" onClick={handleSave}>{t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
