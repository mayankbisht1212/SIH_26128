import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Select from 'react-select';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Flame, MapPin, Navigation, Crosshair, RefreshCw, Locate,
  AlertTriangle, Download, Layers,
  Filter, Calendar, ArrowRight
} from 'lucide-react';
import './Tabs.css';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar
} from 'recharts';


// Haversine distance calculator in kilometers
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

interface TrendsMapProps {
  selectedDistrict: DistrictData;
  selectedState: { value: string; label: string };
  stateDistricts: DistrictData[];
  userLocation: { lat: number; lng: number; accuracy?: number; placeName?: string } | null;
  viewMode: 'both' | 'user' | 'outbreak';
  currentDistanceKm: number | null;
  timeRange: string;
  onSelectDistrict: (district: DistrictData) => void;
}

function TrendsMap({
  selectedDistrict,
  selectedState,
  stateDistricts,
  userLocation,
  viewMode,
  currentDistanceKm,
  onSelectDistrict
}: TrendsMapProps) {
  const [showNodes, setShowNodes] = useState(true);

  // Determine focus center based on view mode
  const focusLat = viewMode === 'user' && userLocation
    ? userLocation.lat
    : selectedDistrict.center[0];
  const focusLng = viewMode === 'user' && userLocation
    ? userLocation.lng
    : selectedDistrict.center[1];

  // Build the OpenStreetMap embed URL (no API key, always works)
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${focusLng - 1.5}%2C${focusLat - 1.2}%2C${focusLng + 1.5}%2C${focusLat + 1.2}&layer=mapnik&marker=${focusLat}%2C${focusLng}`;

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '440px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', background: '#0f172a' }}>

      {/* OSM Iframe - guaranteed to always render */}
      <iframe
        key={`${focusLat.toFixed(4)}-${focusLng.toFixed(4)}`}
        src={osmEmbedUrl}
        title="Disease Surveillance Map"
        style={{ display: 'block', width: '100%', height: '440px', border: 'none' }}
        loading="lazy"
        referrerPolicy="no-referrer"
      />

      {/* Floating info panel - top left */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 20, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', color: 'white', minWidth: '200px', maxWidth: '250px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 0 3px rgba(239,68,68,0.3)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f8fafc', lineHeight: 1.2 }}>
            {selectedDistrict.label}
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.12rem' }}>State: <strong style={{ color: '#38bdf8' }}>{selectedState.label}</strong></div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.12rem' }}>Clusters: <strong style={{ color: selectedDistrict.kpi.clusters > 5 ? '#ef4444' : '#f59e0b' }}>{selectedDistrict.kpi.clusters}</strong></div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.12rem' }}>Reports: <strong style={{ color: '#f8fafc' }}>{selectedDistrict.kpi.reports}</strong></div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Vax: <strong style={{ color: selectedDistrict.kpi.vaxStatus === 'positive' ? '#10b981' : '#ef4444' }}>{selectedDistrict.kpi.vax}%</strong></div>
        {userLocation && currentDistanceKm !== null && (
          <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.72rem', color: '#94a3b8' }}>
            Distance from you: <strong style={{ color: '#38bdf8' }}>{currentDistanceKm} km</strong>
          </div>
        )}
        <div style={{ marginTop: '0.35rem', fontSize: '0.64rem', color: '#475569', fontFamily: 'monospace' }}>
          {selectedDistrict.center[0].toFixed(4)}°N, {selectedDistrict.center[1].toFixed(4)}°E
        </div>
      </div>

      {/* Toggle nodes button - top right */}
      <button
        type="button"
        onClick={() => setShowNodes(v => !v)}
        style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20, padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', background: 'rgba(15,23,42,0.92)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', backdropFilter: 'blur(8px)' }}
      >
        {showNodes ? '▲ Hide Nodes' : '▼ District Nodes'}
      </button>

      {/* District node list - bottom right */}
      {showNodes && stateDistricts.length > 1 && (
        <div style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 20, background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.6rem', maxHeight: '200px', overflowY: 'auto', minWidth: '190px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
            Monitored Districts
          </div>
          {stateDistricts.map((d) => {
            const isActive = d.value === selectedDistrict.value;
            const color = d.kpi.clusters > 5 ? '#ef4444' : d.kpi.clusters > 2 ? '#f59e0b' : '#10b981';
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => onSelectDistrict(d)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%', padding: '0.3rem 0.4rem', background: isActive ? 'rgba(37,99,235,0.3)' : 'transparent', border: isActive ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer', marginBottom: '0.2rem', textAlign: 'left' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.72rem', color: isActive ? '#93c5fd' : '#cbd5e1', fontWeight: isActive ? '700' : '400', lineHeight: 1.2 }}>{d.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color, fontWeight: '700' }}>{d.kpi.clusters}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* OSM credit */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 20, background: 'rgba(15,23,42,0.8)', borderRadius: '6px', padding: '0.25rem 0.5rem', fontSize: '0.62rem', color: '#64748b' }}>
        Map data © OpenStreetMap contributors
      </div>
    </div>
  );
}


export interface DistrictData {
  value: string;
  label: string;
  stateCode: string;
  stateName: string;
  center: [number, number];
  kpi: {
    reports: number;
    clusters: number;
    mortality: number;
    vax: number;
    vaxStatus: 'positive' | 'negative';
  };
}

export interface UserLocationState {
  lat: number;
  lng: number;
  accuracy?: number;
  placeName?: string;
  timestamp?: number;
}

// -------------------------------------------------------------
// Complete 36 States and Union Territories of India Dataset
// -------------------------------------------------------------
export const stateOptions = [
  { value: 'AN', label: 'Andaman & Nicobar Islands (UT)' },
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' },
  { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' },
  { value: 'CH', label: 'Chandigarh (UT)' },
  { value: 'CG', label: 'Chhattisgarh' },
  { value: 'DN', label: 'Dadra & Nagar Haveli and Daman & Diu (UT)' },
  { value: 'DL', label: 'Delhi (NCT)' },
  { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JK', label: 'Jammu & Kashmir (UT)' },
  { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' },
  { value: 'LA', label: 'Ladakh (UT)' },
  { value: 'LD', label: 'Lakshadweep (UT)' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' },
  { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' },
  { value: 'NL', label: 'Nagaland' },
  { value: 'OD', label: 'Odisha' },
  { value: 'PY', label: 'Puducherry (UT)' },
  { value: 'PB', label: 'Punjab' },
  { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TG', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UK', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' }
];

export const districtOptionsMap: Record<string, DistrictData[]> = {
  'AN': [
    { value: 'port_blair', label: 'South Andaman (Port Blair)', stateCode: 'AN', stateName: 'Andaman & Nicobar', center: [11.62, 92.72], kpi: { reports: 4, clusters: 1, mortality: 1, vax: 89.5, vaxStatus: 'positive' } },
    { value: 'nicobar', label: 'Nicobar', stateCode: 'AN', stateName: 'Andaman & Nicobar', center: [9.15, 92.76], kpi: { reports: 2, clusters: 0, mortality: 0, vax: 94.0, vaxStatus: 'positive' } }
  ],
  'AP': [
    { value: 'guntur', label: 'Guntur / Amaravati', stateCode: 'AP', stateName: 'Andhra Pradesh', center: [16.30, 80.44], kpi: { reports: 18, clusters: 8, mortality: 12, vax: 78.4, vaxStatus: 'positive' } },
    { value: 'visakhapatnam', label: 'Visakhapatnam', stateCode: 'AP', stateName: 'Andhra Pradesh', center: [17.68, 83.21], kpi: { reports: 11, clusters: 4, mortality: 6, vax: 84.1, vaxStatus: 'positive' } },
    { value: 'tirupati', label: 'Tirupati / Chittoor', stateCode: 'AP', stateName: 'Andhra Pradesh', center: [13.62, 79.41], kpi: { reports: 22, clusters: 11, mortality: 24, vax: 66.8, vaxStatus: 'negative' } },
    { value: 'kurnool', label: 'Kurnool', stateCode: 'AP', stateName: 'Andhra Pradesh', center: [15.82, 78.03], kpi: { reports: 15, clusters: 7, mortality: 14, vax: 71.0, vaxStatus: 'positive' } }
  ],
  'AR': [
    { value: 'itanagar', label: 'Papum Pare (Itanagar)', stateCode: 'AR', stateName: 'Arunachal Pradesh', center: [27.08, 93.60], kpi: { reports: 5, clusters: 2, mortality: 3, vax: 76.5, vaxStatus: 'positive' } },
    { value: 'tawang', label: 'Tawang', stateCode: 'AR', stateName: 'Arunachal Pradesh', center: [27.58, 91.86], kpi: { reports: 3, clusters: 1, mortality: 1, vax: 82.0, vaxStatus: 'positive' } },
    { value: 'pasighat', label: 'East Siang (Pasighat)', stateCode: 'AR', stateName: 'Arunachal Pradesh', center: [28.06, 95.32], kpi: { reports: 6, clusters: 3, mortality: 4, vax: 69.2, vaxStatus: 'positive' } }
  ],
  'AS': [
    { value: 'kamrup', label: 'Kamrup Metro (Guwahati)', stateCode: 'AS', stateName: 'Assam', center: [26.14, 91.73], kpi: { reports: 24, clusters: 12, mortality: 28, vax: 63.4, vaxStatus: 'negative' } },
    { value: 'dibrugarh', label: 'Dibrugarh', stateCode: 'AS', stateName: 'Assam', center: [27.47, 94.91], kpi: { reports: 16, clusters: 6, mortality: 11, vax: 75.0, vaxStatus: 'positive' } },
    { value: 'silchar', label: 'Cachar (Silchar)', stateCode: 'AS', stateName: 'Assam', center: [24.83, 92.77], kpi: { reports: 14, clusters: 5, mortality: 9, vax: 72.8, vaxStatus: 'positive' } },
    { value: 'jorhat', label: 'Jorhat', stateCode: 'AS', stateName: 'Assam', center: [26.75, 94.21], kpi: { reports: 9, clusters: 3, mortality: 4, vax: 80.5, vaxStatus: 'positive' } }
  ],
  'BR': [
    { value: 'patna', label: 'Patna', stateCode: 'BR', stateName: 'Bihar', center: [25.59, 85.13], kpi: { reports: 36, clusters: 18, mortality: 52, vax: 52.3, vaxStatus: 'negative' } },
    { value: 'gaya', label: 'Gaya', stateCode: 'BR', stateName: 'Bihar', center: [24.79, 85.00], kpi: { reports: 27, clusters: 14, mortality: 38, vax: 58.1, vaxStatus: 'negative' } },
    { value: 'muzaffarpur', label: 'Muzaffarpur', stateCode: 'BR', stateName: 'Bihar', center: [26.12, 85.39], kpi: { reports: 31, clusters: 16, mortality: 44, vax: 49.0, vaxStatus: 'negative' } },
    { value: 'bhagalpur', label: 'Bhagalpur', stateCode: 'BR', stateName: 'Bihar', center: [25.24, 86.98], kpi: { reports: 19, clusters: 9, mortality: 22, vax: 64.7, vaxStatus: 'positive' } }
  ],
  'CH': [
    { value: 'chandigarh', label: 'Chandigarh Urban', stateCode: 'CH', stateName: 'Chandigarh', center: [30.73, 76.77], kpi: { reports: 3, clusters: 1, mortality: 1, vax: 93.5, vaxStatus: 'positive' } }
  ],
  'CG': [
    { value: 'raipur', label: 'Raipur', stateCode: 'CG', stateName: 'Chhattisgarh', center: [21.25, 81.62], kpi: { reports: 21, clusters: 9, mortality: 18, vax: 73.2, vaxStatus: 'positive' } },
    { value: 'bilaspur', label: 'Bilaspur', stateCode: 'CG', stateName: 'Chhattisgarh', center: [22.07, 82.13], kpi: { reports: 17, clusters: 7, mortality: 13, vax: 68.9, vaxStatus: 'positive' } },
    { value: 'durg', label: 'Durg / Bhilai', stateCode: 'CG', stateName: 'Chhattisgarh', center: [21.19, 81.28], kpi: { reports: 14, clusters: 5, mortality: 10, vax: 79.4, vaxStatus: 'positive' } },
    { value: 'bastar', label: 'Bastar (Jagdalpur)', stateCode: 'CG', stateName: 'Chhattisgarh', center: [19.07, 82.03], kpi: { reports: 12, clusters: 4, mortality: 8, vax: 62.0, vaxStatus: 'negative' } }
  ],
  'DN': [
    { value: 'daman', label: 'Daman', stateCode: 'DN', stateName: 'Dadra & Nagar Haveli and Daman & Diu', center: [20.39, 72.83], kpi: { reports: 4, clusters: 1, mortality: 2, vax: 86.4, vaxStatus: 'positive' } },
    { value: 'silvassa', label: 'Dadra & Nagar Haveli (Silvassa)', stateCode: 'DN', stateName: 'Dadra & Nagar Haveli and Daman & Diu', center: [20.27, 73.00], kpi: { reports: 5, clusters: 2, mortality: 3, vax: 81.0, vaxStatus: 'positive' } }
  ],
  'DL': [
    { value: 'delhi_central', label: 'Central Delhi', stateCode: 'DL', stateName: 'Delhi', center: [28.61, 77.20], kpi: { reports: 6, clusters: 2, mortality: 3, vax: 88.5, vaxStatus: 'positive' } },
    { value: 'delhi_north', label: 'North Delhi (Alipur)', stateCode: 'DL', stateName: 'Delhi', center: [28.70, 77.10], kpi: { reports: 11, clusters: 5, mortality: 7, vax: 81.0, vaxStatus: 'positive' } },
    { value: 'delhi_south', label: 'South Delhi (Mehrauli)', stateCode: 'DL', stateName: 'Delhi', center: [28.53, 77.20], kpi: { reports: 8, clusters: 3, mortality: 4, vax: 85.0, vaxStatus: 'positive' } }
  ],
  'GA': [
    { value: 'north_goa', label: 'North Goa (Panaji)', stateCode: 'GA', stateName: 'Goa', center: [15.49, 73.82], kpi: { reports: 4, clusters: 1, mortality: 2, vax: 91.2, vaxStatus: 'positive' } },
    { value: 'south_goa', label: 'South Goa (Margao)', stateCode: 'GA', stateName: 'Goa', center: [15.28, 73.98], kpi: { reports: 3, clusters: 1, mortality: 1, vax: 94.0, vaxStatus: 'positive' } }
  ],
  'GJ': [
    { value: 'anand', label: 'Anand', stateCode: 'GJ', stateName: 'Gujarat', center: [22.56, 72.92], kpi: { reports: 14, clusters: 10, mortality: 20, vax: 72.8, vaxStatus: 'positive' } },
    { value: 'ahmedabad', label: 'Ahmedabad', stateCode: 'GJ', stateName: 'Gujarat', center: [23.02, 72.57], kpi: { reports: 8, clusters: 4, mortality: 5, vax: 81.2, vaxStatus: 'positive' } },
    { value: 'surat', label: 'Surat', stateCode: 'GJ', stateName: 'Gujarat', center: [21.17, 72.83], kpi: { reports: 22, clusters: 12, mortality: 35, vax: 65.5, vaxStatus: 'negative' } },
    { value: 'rajkot', label: 'Rajkot', stateCode: 'GJ', stateName: 'Gujarat', center: [22.30, 70.80], kpi: { reports: 3, clusters: 1, mortality: 2, vax: 88.0, vaxStatus: 'positive' } },
    { value: 'vadodara', label: 'Vadodara', stateCode: 'GJ', stateName: 'Gujarat', center: [22.30, 73.18], kpi: { reports: 11, clusters: 5, mortality: 12, vax: 79.5, vaxStatus: 'positive' } },
    { value: 'mehsana', label: 'Mehsana', stateCode: 'GJ', stateName: 'Gujarat', center: [23.58, 72.36], kpi: { reports: 9, clusters: 3, mortality: 6, vax: 83.1, vaxStatus: 'positive' } }
  ],
  'HR': [
    { value: 'karnal', label: 'Karnal', stateCode: 'HR', stateName: 'Haryana', center: [29.68, 76.99], kpi: { reports: 16, clusters: 8, mortality: 14, vax: 82.5, vaxStatus: 'positive' } },
    { value: 'hisar', label: 'Hisar', stateCode: 'HR', stateName: 'Haryana', center: [29.14, 75.72], kpi: { reports: 21, clusters: 11, mortality: 26, vax: 71.0, vaxStatus: 'positive' } },
    { value: 'gurugram', label: 'Gurugram', stateCode: 'HR', stateName: 'Haryana', center: [28.45, 77.02], kpi: { reports: 7, clusters: 3, mortality: 5, vax: 89.0, vaxStatus: 'positive' } },
    { value: 'ambala', label: 'Ambala', stateCode: 'HR', stateName: 'Haryana', center: [30.37, 76.77], kpi: { reports: 10, clusters: 4, mortality: 8, vax: 84.6, vaxStatus: 'positive' } }
  ],
  'HP': [
    { value: 'shimla', label: 'Shimla', stateCode: 'HP', stateName: 'Himachal Pradesh', center: [31.10, 77.17], kpi: { reports: 7, clusters: 2, mortality: 4, vax: 86.4, vaxStatus: 'positive' } },
    { value: 'kangra', label: 'Kangra (Dharamshala)', stateCode: 'HP', stateName: 'Himachal Pradesh', center: [32.09, 76.26], kpi: { reports: 12, clusters: 5, mortality: 9, vax: 78.0, vaxStatus: 'positive' } },
    { value: 'mandi', label: 'Mandi', stateCode: 'HP', stateName: 'Himachal Pradesh', center: [31.70, 76.93], kpi: { reports: 8, clusters: 3, mortality: 5, vax: 81.5, vaxStatus: 'positive' } }
  ],
  'JK': [
    { value: 'srinagar', label: 'Srinagar', stateCode: 'JK', stateName: 'Jammu & Kashmir', center: [34.08, 74.79], kpi: { reports: 9, clusters: 4, mortality: 6, vax: 80.2, vaxStatus: 'positive' } },
    { value: 'jammu', label: 'Jammu', stateCode: 'JK', stateName: 'Jammu & Kashmir', center: [32.72, 74.85], kpi: { reports: 18, clusters: 9, mortality: 19, vax: 73.5, vaxStatus: 'positive' } },
    { value: 'anantnag', label: 'Anantnag', stateCode: 'JK', stateName: 'Jammu & Kashmir', center: [33.73, 75.15], kpi: { reports: 11, clusters: 5, mortality: 8, vax: 76.0, vaxStatus: 'positive' } }
  ],
  'JH': [
    { value: 'ranchi', label: 'Ranchi', stateCode: 'JH', stateName: 'Jharkhand', center: [23.34, 85.30], kpi: { reports: 22, clusters: 10, mortality: 25, vax: 61.4, vaxStatus: 'negative' } },
    { value: 'jamshedpur', label: 'East Singhbhum (Jamshedpur)', stateCode: 'JH', stateName: 'Jharkhand', center: [22.80, 86.20], kpi: { reports: 16, clusters: 7, mortality: 18, vax: 67.2, vaxStatus: 'positive' } },
    { value: 'dhanbad', label: 'Dhanbad', stateCode: 'JH', stateName: 'Jharkhand', center: [23.79, 86.43], kpi: { reports: 19, clusters: 8, mortality: 21, vax: 59.8, vaxStatus: 'negative' } }
  ],
  'KA': [
    { value: 'bengaluru', label: 'Bengaluru Urban', stateCode: 'KA', stateName: 'Karnataka', center: [12.97, 77.59], kpi: { reports: 8, clusters: 3, mortality: 4, vax: 91.0, vaxStatus: 'positive' } },
    { value: 'mysuru', label: 'Mysuru', stateCode: 'KA', stateName: 'Karnataka', center: [12.29, 76.63], kpi: { reports: 14, clusters: 6, mortality: 11, vax: 83.5, vaxStatus: 'positive' } },
    { value: 'belagavi', label: 'Belagavi', stateCode: 'KA', stateName: 'Karnataka', center: [15.84, 74.49], kpi: { reports: 26, clusters: 14, mortality: 34, vax: 64.0, vaxStatus: 'negative' } },
    { value: 'hubballi', label: 'Dharwad (Hubballi)', stateCode: 'KA', stateName: 'Karnataka', center: [15.36, 75.12], kpi: { reports: 17, clusters: 8, mortality: 16, vax: 76.2, vaxStatus: 'positive' } }
  ],
  'KL': [
    { value: 'thiruvananthapuram', label: 'Thiruvananthapuram', stateCode: 'KL', stateName: 'Kerala', center: [8.52, 76.93], kpi: { reports: 5, clusters: 1, mortality: 2, vax: 94.8, vaxStatus: 'positive' } },
    { value: 'kochi', label: 'Ernakulam (Kochi)', stateCode: 'KL', stateName: 'Kerala', center: [9.98, 76.29], kpi: { reports: 7, clusters: 2, mortality: 3, vax: 92.5, vaxStatus: 'positive' } },
    { value: 'kozhikode', label: 'Kozhikode', stateCode: 'KL', stateName: 'Kerala', center: [11.25, 75.78], kpi: { reports: 9, clusters: 4, mortality: 5, vax: 88.0, vaxStatus: 'positive' } },
    { value: 'palakkad', label: 'Palakkad', stateCode: 'KL', stateName: 'Kerala', center: [10.78, 76.65], kpi: { reports: 12, clusters: 5, mortality: 8, vax: 85.1, vaxStatus: 'positive' } }
  ],
  'LA': [
    { value: 'leh', label: 'Leh', stateCode: 'LA', stateName: 'Ladakh', center: [34.15, 77.57], kpi: { reports: 3, clusters: 1, mortality: 1, vax: 87.2, vaxStatus: 'positive' } },
    { value: 'kargil', label: 'Kargil', stateCode: 'LA', stateName: 'Ladakh', center: [34.55, 76.13], kpi: { reports: 2, clusters: 0, mortality: 0, vax: 89.0, vaxStatus: 'positive' } }
  ],
  'LD': [
    { value: 'kavaratti', label: 'Kavaratti', stateCode: 'LD', stateName: 'Lakshadweep', center: [10.56, 72.64], kpi: { reports: 1, clusters: 0, mortality: 0, vax: 96.0, vaxStatus: 'positive' } }
  ],
  'MP': [
    { value: 'bhopal', label: 'Bhopal', stateCode: 'MP', stateName: 'Madhya Pradesh', center: [23.25, 77.41], kpi: { reports: 19, clusters: 8, mortality: 22, vax: 74.5, vaxStatus: 'positive' } },
    { value: 'indore', label: 'Indore', stateCode: 'MP', stateName: 'Madhya Pradesh', center: [22.71, 75.85], kpi: { reports: 16, clusters: 7, mortality: 17, vax: 82.0, vaxStatus: 'positive' } },
    { value: 'jabalpur', label: 'Jabalpur', stateCode: 'MP', stateName: 'Madhya Pradesh', center: [23.18, 79.98], kpi: { reports: 24, clusters: 11, mortality: 31, vax: 66.8, vaxStatus: 'negative' } },
    { value: 'gwalior', label: 'Gwalior', stateCode: 'MP', stateName: 'Madhya Pradesh', center: [26.21, 78.17], kpi: { reports: 28, clusters: 14, mortality: 39, vax: 59.5, vaxStatus: 'negative' } }
  ],
  'MH': [
    { value: 'pune', label: 'Pune', stateCode: 'MH', stateName: 'Maharashtra', center: [18.52, 73.85], kpi: { reports: 5, clusters: 2, mortality: 6, vax: 85.2, vaxStatus: 'positive' } },
    { value: 'mumbai', label: 'Mumbai', stateCode: 'MH', stateName: 'Maharashtra', center: [19.07, 72.87], kpi: { reports: 1, clusters: 0, mortality: 0, vax: 95.0, vaxStatus: 'positive' } },
    { value: 'nagpur', label: 'Nagpur', stateCode: 'MH', stateName: 'Maharashtra', center: [21.14, 79.08], kpi: { reports: 18, clusters: 8, mortality: 15, vax: 55.4, vaxStatus: 'negative' } },
    { value: 'nashik', label: 'Nashik', stateCode: 'MH', stateName: 'Maharashtra', center: [19.99, 73.78], kpi: { reports: 12, clusters: 5, mortality: 10, vax: 68.2, vaxStatus: 'positive' } },
    { value: 'satara', label: 'Satara', stateCode: 'MH', stateName: 'Maharashtra', center: [17.68, 73.99], kpi: { reports: 8, clusters: 4, mortality: 15, vax: 74.0, vaxStatus: 'positive' } },
    { value: 'sambhajinagar', label: 'Chhatrapati Sambhajinagar', stateCode: 'MH', stateName: 'Maharashtra', center: [19.87, 75.34], kpi: { reports: 21, clusters: 10, mortality: 28, vax: 61.8, vaxStatus: 'negative' } }
  ],
  'MN': [
    { value: 'imphal_west', label: 'Imphal West', stateCode: 'MN', stateName: 'Manipur', center: [24.81, 93.93], kpi: { reports: 8, clusters: 3, mortality: 5, vax: 77.0, vaxStatus: 'positive' } },
    { value: 'churachandpur', label: 'Churachandpur', stateCode: 'MN', stateName: 'Manipur', center: [24.33, 93.67], kpi: { reports: 6, clusters: 2, mortality: 4, vax: 71.5, vaxStatus: 'positive' } }
  ],
  'ML': [
    { value: 'shillong', label: 'East Khasi Hills (Shillong)', stateCode: 'ML', stateName: 'Meghalaya', center: [25.57, 91.89], kpi: { reports: 7, clusters: 2, mortality: 4, vax: 79.4, vaxStatus: 'positive' } },
    { value: 'tura', label: 'West Garo Hills (Tura)', stateCode: 'ML', stateName: 'Meghalaya', center: [25.51, 90.22], kpi: { reports: 9, clusters: 4, mortality: 7, vax: 70.0, vaxStatus: 'positive' } }
  ],
  'MZ': [
    { value: 'aizawl', label: 'Aizawl', stateCode: 'MZ', stateName: 'Mizoram', center: [23.72, 92.71], kpi: { reports: 5, clusters: 1, mortality: 2, vax: 84.5, vaxStatus: 'positive' } },
    { value: 'lunglei', label: 'Lunglei', stateCode: 'MZ', stateName: 'Mizoram', center: [22.88, 92.73], kpi: { reports: 4, clusters: 1, mortality: 1, vax: 81.0, vaxStatus: 'positive' } }
  ],
  'NL': [
    { value: 'kohima', label: 'Kohima', stateCode: 'NL', stateName: 'Nagaland', center: [25.67, 94.10], kpi: { reports: 6, clusters: 2, mortality: 3, vax: 78.0, vaxStatus: 'positive' } },
    { value: 'dimapur', label: 'Dimapur', stateCode: 'NL', stateName: 'Nagaland', center: [25.90, 93.72], kpi: { reports: 11, clusters: 5, mortality: 8, vax: 72.4, vaxStatus: 'positive' } }
  ],
  'OD': [
    { value: 'khordha', label: 'Khordha (Bhubaneswar)', stateCode: 'OD', stateName: 'Odisha', center: [20.29, 85.82], kpi: { reports: 18, clusters: 7, mortality: 14, vax: 79.8, vaxStatus: 'positive' } },
    { value: 'cuttack', label: 'Cuttack', stateCode: 'OD', stateName: 'Odisha', center: [20.46, 85.88], kpi: { reports: 15, clusters: 6, mortality: 11, vax: 82.0, vaxStatus: 'positive' } },
    { value: 'sambalpur', label: 'Sambalpur', stateCode: 'OD', stateName: 'Odisha', center: [21.46, 83.98], kpi: { reports: 22, clusters: 10, mortality: 27, vax: 63.5, vaxStatus: 'negative' } },
    { value: 'ganjam', label: 'Ganjam (Berhampur)', stateCode: 'OD', stateName: 'Odisha', center: [19.31, 84.79], kpi: { reports: 25, clusters: 12, mortality: 32, vax: 59.0, vaxStatus: 'negative' } }
  ],
  'PY': [
    { value: 'puducherry', label: 'Puducherry Urban', stateCode: 'PY', stateName: 'Puducherry', center: [11.94, 79.80], kpi: { reports: 4, clusters: 1, mortality: 2, vax: 91.5, vaxStatus: 'positive' } },
    { value: 'karaikal', label: 'Karaikal', stateCode: 'PY', stateName: 'Puducherry', center: [10.92, 79.83], kpi: { reports: 3, clusters: 1, mortality: 1, vax: 89.0, vaxStatus: 'positive' } }
  ],
  'PB': [
    { value: 'ludhiana', label: 'Ludhiana', stateCode: 'PB', stateName: 'Punjab', center: [30.90, 75.85], kpi: { reports: 25, clusters: 13, mortality: 36, vax: 68.0, vaxStatus: 'positive' } },
    { value: 'amritsar', label: 'Amritsar', stateCode: 'PB', stateName: 'Punjab', center: [31.63, 74.87], kpi: { reports: 19, clusters: 9, mortality: 24, vax: 74.5, vaxStatus: 'positive' } },
    { value: 'jalandhar', label: 'Jalandhar', stateCode: 'PB', stateName: 'Punjab', center: [31.32, 75.57], kpi: { reports: 14, clusters: 6, mortality: 15, vax: 82.1, vaxStatus: 'positive' } },
    { value: 'bathinda', label: 'Bathinda', stateCode: 'PB', stateName: 'Punjab', center: [30.21, 74.94], kpi: { reports: 22, clusters: 11, mortality: 29, vax: 64.3, vaxStatus: 'negative' } }
  ],
  'RJ': [
    { value: 'jaipur', label: 'Jaipur', stateCode: 'RJ', stateName: 'Rajasthan', center: [26.91, 75.78], kpi: { reports: 28, clusters: 15, mortality: 45, vax: 42.5, vaxStatus: 'negative' } },
    { value: 'jodhpur', label: 'Jodhpur', stateCode: 'RJ', stateName: 'Rajasthan', center: [26.23, 73.02], kpi: { reports: 35, clusters: 20, mortality: 60, vax: 38.1, vaxStatus: 'negative' } },
    { value: 'udaipur', label: 'Udaipur', stateCode: 'RJ', stateName: 'Rajasthan', center: [24.58, 73.71], kpi: { reports: 10, clusters: 4, mortality: 12, vax: 70.5, vaxStatus: 'positive' } },
    { value: 'bikaner', label: 'Bikaner', stateCode: 'RJ', stateName: 'Rajasthan', center: [28.02, 73.31], kpi: { reports: 15, clusters: 7, mortality: 22, vax: 62.8, vaxStatus: 'negative' } },
    { value: 'kota', label: 'Kota', stateCode: 'RJ', stateName: 'Rajasthan', center: [25.21, 75.86], kpi: { reports: 17, clusters: 8, mortality: 20, vax: 68.0, vaxStatus: 'positive' } }
  ],
  'SK': [
    { value: 'gangtok', label: 'East Sikkim (Gangtok)', stateCode: 'SK', stateName: 'Sikkim', center: [27.33, 88.61], kpi: { reports: 3, clusters: 1, mortality: 1, vax: 92.0, vaxStatus: 'positive' } },
    { value: 'namchi', label: 'South Sikkim (Namchi)', stateCode: 'SK', stateName: 'Sikkim', center: [27.16, 88.36], kpi: { reports: 2, clusters: 0, mortality: 0, vax: 94.5, vaxStatus: 'positive' } }
  ],
  'TN': [
    { value: 'chennai', label: 'Chennai', stateCode: 'TN', stateName: 'Tamil Nadu', center: [13.08, 80.27], kpi: { reports: 6, clusters: 2, mortality: 3, vax: 93.0, vaxStatus: 'positive' } },
    { value: 'coimbatore', label: 'Coimbatore', stateCode: 'TN', stateName: 'Tamil Nadu', center: [11.01, 76.95], kpi: { reports: 15, clusters: 7, mortality: 12, vax: 84.2, vaxStatus: 'positive' } },
    { value: 'madurai', label: 'Madurai', stateCode: 'TN', stateName: 'Tamil Nadu', center: [9.92, 78.11], kpi: { reports: 20, clusters: 10, mortality: 22, vax: 76.5, vaxStatus: 'positive' } },
    { value: 'trichy', label: 'Tiruchirappalli', stateCode: 'TN', stateName: 'Tamil Nadu', center: [10.79, 78.70], kpi: { reports: 13, clusters: 5, mortality: 9, vax: 81.8, vaxStatus: 'positive' } }
  ],
  'TG': [
    { value: 'hyderabad', label: 'Hyderabad', stateCode: 'TG', stateName: 'Telangana', center: [17.38, 78.48], kpi: { reports: 9, clusters: 3, mortality: 5, vax: 89.0, vaxStatus: 'positive' } },
    { value: 'warangal', label: 'Warangal', stateCode: 'TG', stateName: 'Telangana', center: [17.96, 79.59], kpi: { reports: 18, clusters: 8, mortality: 19, vax: 74.0, vaxStatus: 'positive' } },
    { value: 'nizamabad', label: 'Nizamabad', stateCode: 'TG', stateName: 'Telangana', center: [18.67, 78.09], kpi: { reports: 14, clusters: 6, mortality: 12, vax: 77.5, vaxStatus: 'positive' } },
    { value: 'karimnagar', label: 'Karimnagar', stateCode: 'TG', stateName: 'Telangana', center: [18.43, 79.12], kpi: { reports: 12, clusters: 5, mortality: 10, vax: 80.2, vaxStatus: 'positive' } }
  ],
  'TR': [
    { value: 'agartala', label: 'West Tripura (Agartala)', stateCode: 'TR', stateName: 'Tripura', center: [23.83, 91.28], kpi: { reports: 8, clusters: 3, mortality: 5, vax: 81.4, vaxStatus: 'positive' } },
    { value: 'gomati', label: 'Gomati (Udaipur)', stateCode: 'TR', stateName: 'Tripura', center: [23.53, 91.48], kpi: { reports: 5, clusters: 2, mortality: 3, vax: 78.0, vaxStatus: 'positive' } }
  ],
  'UP': [
    { value: 'lucknow', label: 'Lucknow', stateCode: 'UP', stateName: 'Uttar Pradesh', center: [26.84, 80.94], kpi: { reports: 42, clusters: 25, mortality: 85, vax: 35.0, vaxStatus: 'negative' } },
    { value: 'kanpur', label: 'Kanpur Nagar', stateCode: 'UP', stateName: 'Uttar Pradesh', center: [26.44, 80.33], kpi: { reports: 38, clusters: 22, mortality: 75, vax: 38.5, vaxStatus: 'negative' } },
    { value: 'agra', label: 'Agra', stateCode: 'UP', stateName: 'Uttar Pradesh', center: [27.17, 78.00], kpi: { reports: 29, clusters: 16, mortality: 48, vax: 49.0, vaxStatus: 'negative' } },
    { value: 'varanasi', label: 'Varanasi', stateCode: 'UP', stateName: 'Uttar Pradesh', center: [25.31, 82.97], kpi: { reports: 32, clusters: 18, mortality: 54, vax: 44.2, vaxStatus: 'negative' } },
    { value: 'prayagraj', label: 'Prayagraj', stateCode: 'UP', stateName: 'Uttar Pradesh', center: [25.43, 81.84], kpi: { reports: 26, clusters: 13, mortality: 41, vax: 52.0, vaxStatus: 'negative' } },
    { value: 'meerut', label: 'Meerut', stateCode: 'UP', stateName: 'Uttar Pradesh', center: [28.98, 77.70], kpi: { reports: 23, clusters: 11, mortality: 30, vax: 66.5, vaxStatus: 'positive' } }
  ],
  'UK': [
    { value: 'dehradun', label: 'Dehradun', stateCode: 'UK', stateName: 'Uttarakhand', center: [30.31, 78.03], kpi: { reports: 11, clusters: 4, mortality: 7, vax: 83.0, vaxStatus: 'positive' } },
    { value: 'haridwar', label: 'Haridwar', stateCode: 'UK', stateName: 'Uttarakhand', center: [29.94, 78.16], kpi: { reports: 17, clusters: 8, mortality: 16, vax: 72.4, vaxStatus: 'positive' } },
    { value: 'nainital', label: 'Nainital (Haldwani)', stateCode: 'UK', stateName: 'Uttarakhand', center: [29.38, 79.46], kpi: { reports: 8, clusters: 3, mortality: 5, vax: 85.0, vaxStatus: 'positive' } }
  ],
  'WB': [
    { value: 'kolkata', label: 'Kolkata', stateCode: 'WB', stateName: 'West Bengal', center: [22.57, 88.36], kpi: { reports: 9, clusters: 3, mortality: 5, vax: 87.5, vaxStatus: 'positive' } },
    { value: 'howrah', label: 'Howrah', stateCode: 'WB', stateName: 'West Bengal', center: [22.59, 88.26], kpi: { reports: 16, clusters: 7, mortality: 14, vax: 78.0, vaxStatus: 'positive' } },
    { value: 'burdwan', label: 'Purba Bardhaman', stateCode: 'WB', stateName: 'West Bengal', center: [23.23, 87.86], kpi: { reports: 24, clusters: 12, mortality: 32, vax: 64.0, vaxStatus: 'negative' } },
    { value: 'darjeeling', label: 'Darjeeling (Siliguri)', stateCode: 'WB', stateName: 'West Bengal', center: [26.72, 88.39], kpi: { reports: 11, clusters: 4, mortality: 8, vax: 81.2, vaxStatus: 'positive' } }
  ]
};

// Flatten all districts for fast global nearest searches
const ALL_DISTRICTS: DistrictData[] = Object.values(districtOptionsMap).flat();

// Generate dynamic chart data based on district reports, disease filter, and time horizon
const generateDynamicChartData = (reports: number, diseaseFilter: string, timeRange: string) => {
  const timeMultiplier = timeRange === '7D' ? 0.35 : timeRange === '90D' ? 2.5 : 1.0;
  const baseMultiplier = Math.max(1, (reports / 5) * timeMultiplier);

  const getDiseaseVal = (base: number, key: string) => {
    if (diseaseFilter === 'all') return Math.max(1, Math.floor(base * baseMultiplier));
    if (diseaseFilter === key) return Math.max(2, Math.floor(base * 2.2 * baseMultiplier));
    return Math.max(0, Math.floor(base * 0.2 * baseMultiplier));
  };

  const incidence = [
    { name: timeRange === '7D' ? 'Day 1-2' : timeRange === '90D' ? 'Month 1' : 'Week 1', fmd: getDiseaseVal(1.5, 'fmd'), lsd: getDiseaseVal(2.0, 'lsd'), ppr: getDiseaseVal(1.0, 'ppr') },
    { name: timeRange === '7D' ? 'Day 3-4' : timeRange === '90D' ? 'Month 2' : 'Week 2', fmd: getDiseaseVal(2.2, 'fmd'), lsd: getDiseaseVal(3.8, 'lsd'), ppr: getDiseaseVal(1.4, 'ppr') },
    { name: timeRange === '7D' ? 'Day 5-6' : timeRange === '90D' ? 'Month 3' : 'Week 3', fmd: getDiseaseVal(3.1, 'fmd'), lsd: getDiseaseVal(5.5, 'lsd'), ppr: getDiseaseVal(2.2, 'ppr') },
    { name: timeRange === '7D' ? 'Day 7' : timeRange === '90D' ? 'Current' : 'Week 4', fmd: getDiseaseVal(3.9, 'fmd'), lsd: getDiseaseVal(8.2, 'lsd'), ppr: getDiseaseVal(2.8, 'ppr') },
  ];

  const distribution = [
    { name: 'Foot & Mouth (FMD)', value: getDiseaseVal(18, 'fmd'), color: '#f97316' },
    { name: 'Lumpy Skin (LSD)', value: getDiseaseVal(32, 'lsd'), color: '#ef4444' },
    { name: 'PPR (Goat Plague)', value: getDiseaseVal(12, 'ppr'), color: '#8b5cf6' },
    { name: 'Anthrax & HS/BQ', value: Math.max(1, Math.floor(6 * baseMultiplier)), color: '#10b981' },
  ];

  return { incidence, distribution };
};

// Custom styles for react-select to support light/dark modes
const selectStyles = {
  control: (base: any) => ({
    ...base,
    fontSize: '0.85rem',
    backgroundColor: 'var(--card-bg)',
    borderColor: 'var(--border-color)',
  }),
  singleValue: (base: any) => ({
    ...base,
    color: 'var(--text-dark)'
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'var(--card-bg)',
    zIndex: 100
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'var(--bg-color)' : 'transparent',
    color: 'var(--text-dark)',
    cursor: 'pointer'
  })
};

export default function Trends() {
  const { t } = useLanguage();

  // State and District Selection
  const [selectedState, setSelectedState] = useState(stateOptions.find(s => s.value === 'GJ') || stateOptions[0]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData>(districtOptionsMap['GJ'][0]);

  // Analytics Filters
  const [selectedDisease, setSelectedDisease] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '90D'>('30D');

  // User Geolocation State
  const [userLocation, setUserLocation] = useState<UserLocationState | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'detecting' | 'active' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'both' | 'user' | 'outbreak'>('both');

  // Handle state change: update state and reset district to the first one in the new state
  const handleStateChange = (newState: any) => {
    setSelectedState(newState);
    const districts = districtOptionsMap[newState.value] || [];
    if (districts.length > 0) {
      setSelectedDistrict(districts[0]);
    }
  };

  // Fetch real-time user location
  const fetchUserLocation = useCallback((_isManual = false) => {
    setLocationStatus('detecting');
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLoc: UserLocationState = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          placeName: 'My Live Location',
          timestamp: position.timestamp
        };

        // Reverse geocoding via OpenStreetMap Nominatim with graceful fallback
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const locality = data.address?.city || data.address?.town || data.address?.village || data.address?.county || data.address?.suburb;
            const state = data.address?.state;
            if (locality) {
              newLoc.placeName = `${locality}${state ? ', ' + state : ''}`;
            }
          }
        } catch {
          // Keep default placeName
        }

        setUserLocation(newLoc);
        setLocationStatus('active');
        setViewMode('both');
      },
      (error) => {
        let msg = 'Could not access your location.';
        if (error.code === 1) msg = 'Location permission denied.';
        else if (error.code === 2) msg = 'Location position unavailable.';
        else if (error.code === 3) msg = 'Location request timed out.';

        setLocationStatus('error');
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);

  // Demo location setter for testing/fallback
  const setDemoLocation = (lat: number, lng: number, name: string) => {
    setUserLocation({
      lat,
      lng,
      accuracy: 20,
      placeName: name,
      timestamp: Date.now()
    });
    setLocationStatus('active');
    setViewMode('both');
  };

  // Find user's closest district across all 36 Indian States & UTs
  const nearestDistrictInfo = useMemo(() => {
    if (!userLocation) return null;
    let closestDist = Infinity;
    let closestNode: DistrictData | null = null;

    for (const d of ALL_DISTRICTS) {
      const dist = calculateDistance(userLocation.lat, userLocation.lng, d.center[0], d.center[1]);
      if (dist < closestDist) {
        closestDist = dist;
        closestNode = d;
      }
    }
    return closestNode ? { district: closestNode, distanceKm: closestDist } : null;
  }, [userLocation]);

  // Find closest active outbreak cluster (>5 clusters) across India
  const closestHotspotInfo = useMemo(() => {
    if (!userLocation) return null;
    let closestDist = Infinity;
    let hotspotNode: DistrictData | null = null;

    for (const d of ALL_DISTRICTS) {
      if (d.kpi.clusters >= 5) {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, d.center[0], d.center[1]);
        if (dist < closestDist) {
          closestDist = dist;
          hotspotNode = d;
        }
      }
    }
    return hotspotNode ? { district: hotspotNode, distanceKm: closestDist } : null;
  }, [userLocation]);

  // Calculate distance between user location and current outbreak center
  const currentDistanceKm = useMemo(() => {
    if (!userLocation || !selectedDistrict) return null;
    return calculateDistance(userLocation.lat, userLocation.lng, selectedDistrict.center[0], selectedDistrict.center[1]);
  }, [userLocation, selectedDistrict]);

  const getRiskLevel = (dist: number) => {
    if (dist < 25) return { tag: 'danger', label: 'CRITICAL PROXIMITY', text: 'Within Active Containment Zone (<25km)' };
    if (dist < 75) return { tag: 'warning', label: 'ELEVATED SURVEILLANCE', text: 'Regional Buffer Zone (25-75km)' };
    return { tag: 'safe', label: 'SAFE PERIMETER', text: 'Outside Direct Impact Zone (>75km)' };
  };

  const riskInfo = currentDistanceKm !== null ? getRiskLevel(currentDistanceKm) : null;

  // Memoized Chart & KPI Data
  const dynamicCharts = useMemo(() => {
    return generateDynamicChartData(selectedDistrict.kpi.reports, selectedDisease, timeRange);
  }, [selectedDistrict, selectedDisease, timeRange]);

  const blockData = useMemo(() => {
    const mult = Math.max(1, selectedDistrict.kpi.reports / 6);
    return [
      { name: `${selectedDistrict.label} North`, cases: Math.floor(7 * mult), deaths: Math.floor(2 * mult) },
      { name: `${selectedDistrict.label} Central`, cases: Math.floor(12 * mult), deaths: Math.floor(4 * mult) },
      { name: `${selectedDistrict.label} East`, cases: Math.floor(5 * mult), deaths: Math.floor(1 * mult) },
      { name: `${selectedDistrict.label} Rural Block`, cases: Math.floor(9 * mult), deaths: Math.floor(6 * mult) },
    ];
  }, [selectedDistrict]);

  const vaccinationData = useMemo(() => {
    const vax = selectedDistrict.kpi.vax;
    return [
      { name: 'Cattle (LSD/FMD)', rate: Math.min(99, Math.round(vax * 1.05)) },
      { name: 'Buffalo (HS/BQ)', rate: Math.min(99, Math.round(vax * 0.88)) },
      { name: 'Goat/Sheep (PPR)', rate: Math.min(99, Math.round(vax * 0.92)) },
      { name: 'Poultry (Ranikhet)', rate: Math.min(99, Math.round(vax * 0.65)) },
    ];
  }, [selectedDistrict]);

  // CSV Data Export
  const handleExportCSV = () => {
    const headers = ['State', 'District', 'Latitude', 'Longitude', 'Total Reports', 'Active Clusters', 'Mortality', 'Vaccination Rate', 'Disease Filter', 'Time Range'];
    const row = [
      selectedState.label,
      selectedDistrict.label,
      selectedDistrict.center[0],
      selectedDistrict.center[1],
      selectedDistrict.kpi.reports,
      selectedDistrict.kpi.clusters,
      selectedDistrict.kpi.mortality,
      `${selectedDistrict.kpi.vax}%`,
      selectedDisease.toUpperCase(),
      timeRange
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PashuRaksha_Surveillance_${selectedDistrict.value}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Switch to suggested nearest district
  const handleSwitchToNearest = (nearest: DistrictData) => {
    const foundState = stateOptions.find(s => s.value === nearest.stateCode);
    if (foundState) setSelectedState(foundState);
    setSelectedDistrict(nearest);
    setViewMode('both');
  };

  const stateDistricts = districtOptionsMap[selectedState.value] || [];

  return (
    <div className="tab-container slide-down trends-container">
      {/* Header & Filter Row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.02em' }}>
              National Epidemiological Surveillance
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-light)' }}>
              Real-time zoonotic disease outbreak tracking across 36 Indian States & Union Territories
            </p>
          </div>

          <button
            type="button"
            className="map-action-btn"
            onClick={handleExportCSV}
            style={{ background: 'var(--card-bg)', borderColor: 'var(--border-color)', fontWeight: '600' }}
            title="Download Epidemiological CSV Dataset"
          >
            <Download size={14} /> Export Report (CSV)
          </button>
        </div>

        {/* State & District Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.35rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select State / UT ({stateOptions.length} Regions)
            </label>
            <Select
              value={selectedState}
              onChange={handleStateChange}
              options={stateOptions}
              classNamePrefix="react-select"
              styles={selectStyles}
              isSearchable={true}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-light)', marginBottom: '0.35rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select District Node ({stateDistricts.length} Monitored)
            </label>
            <Select
              value={selectedDistrict}
              onChange={(option: any) => setSelectedDistrict(option)}
              options={stateDistricts}
              isSearchable={true}
              classNamePrefix="react-select"
              styles={selectStyles}
            />
          </div>
        </div>

        {/* Analytics Filter Toolbar: Disease Type & Time Horizon */}
        <div className="analytics-filter-bar">
          <div className="filter-group">
            <span className="filter-label"><Filter size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Disease:</span>
            {[
              { id: 'all', label: 'All Diseases' },
              { id: 'lsd', label: 'Lumpy Skin (LSD)' },
              { id: 'fmd', label: 'Foot & Mouth (FMD)' },
              { id: 'ppr', label: 'PPR / Goat Plague' }
            ].map(d => (
              <button
                key={d.id}
                type="button"
                className={`filter-pill ${selectedDisease === d.id ? 'active' : ''}`}
                onClick={() => setSelectedDisease(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <span className="filter-label"><Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Horizon:</span>
            {(['7D', '30D', '90D'] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`filter-pill ${timeRange === t ? 'active' : ''}`}
                onClick={() => setTimeRange(t)}
              >
                {t === '7D' ? 'Last 7 Days' : t === '30D' ? 'Last 30 Days' : 'Past 90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Smart Nearest District Suggestion Banner */}
      {nearestDistrictInfo && nearestDistrictInfo.district.value !== selectedDistrict.value && (
        <div className="nearest-suggestion-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Locate size={18} color="var(--primary)" />
            <span>
              📍 <strong>Detected Nearest Center:</strong> You are <strong>{nearestDistrictInfo.distanceKm} km</strong> from <strong>{nearestDistrictInfo.district.label}, {nearestDistrictInfo.district.stateName}</strong>.
            </span>
          </div>
          <button
            type="button"
            className="switch-district-btn"
            onClick={() => handleSwitchToNearest(nearestDistrictInfo.district)}
          >
            Switch to {nearestDistrictInfo.district.label} <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* 1. Critical Alert Banner */}
      <div className="critical-alert-banner" style={{ background: selectedDistrict.kpi.clusters > 5 ? '#dc2626' : '#f59e0b' }}>
        <div className="critical-icon">
          <Flame size={28} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'white', color: selectedDistrict.kpi.clusters > 5 ? '#dc2626' : '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
              {selectedDistrict.kpi.clusters > 5 ? 'CRITICAL OUTBREAK' : 'ELEVATED SURVEILLANCE'}
            </span>
            District Center: {selectedDistrict.label}, {selectedState.label}
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4, opacity: 0.95 }}>
            {selectedDistrict.kpi.clusters > 5
              ? `High-risk cluster of ${selectedDisease === 'all' ? 'LSD & FMD' : selectedDisease.toUpperCase()} detected in ${selectedDistrict.label} surveillance perimeter. Immediate containment & ring vaccination protocol active.`
              : `Routine active surveillance active in ${selectedDistrict.label}. No rapid epidemic surge detected in current ${timeRange} window.`}
          </p>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Total Reports ({timeRange})</div>
          <div className="kpi-value">{selectedDistrict.kpi.reports}</div>
          <div className="kpi-subtext positive">↑ +14% vs previous period</div>
        </div>
        <div className="kpi-card" style={{ borderColor: selectedDistrict.kpi.clusters > 5 ? '#fca5a5' : 'var(--border-color)', background: selectedDistrict.kpi.clusters > 5 ? '#fef2f2' : 'var(--card-bg)' }}>
          <div className="kpi-title" style={{ color: selectedDistrict.kpi.clusters > 5 ? '#dc2626' : 'var(--text-light)' }}>Active Outbreak Clusters</div>
          <div className="kpi-value" style={{ color: selectedDistrict.kpi.clusters > 5 ? '#dc2626' : 'var(--text-dark)' }}>{selectedDistrict.kpi.clusters}</div>
          <div className="kpi-subtext negative">Across {selectedDistrict.label} sector</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Total Livestock Mortality</div>
          <div className="kpi-value">{selectedDistrict.kpi.mortality}</div>
          <div className="kpi-subtext neutral">Including flock & poultry</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Avg. Vaccination Coverage</div>
          <div className="kpi-value" style={{ color: selectedDistrict.kpi.vaxStatus === 'positive' ? '#10b981' : '#dc2626' }}>{selectedDistrict.kpi.vax}%</div>
          <div className="kpi-subtext neutral">National Target: 90%</div>
        </div>
      </div>

      {/* 3. Interactive Leaflet GIS Map with User Live Geolocation */}
      <div className="chart-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="map-header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-dark)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="var(--primary)" /> Real-time Geospatial Disease Surveillance Map
            </h3>

            {locationStatus === 'detecting' && (
              <span className="gps-badge locating">
                <span className="gps-pulse-dot" /> Detecting GPS...
              </span>
            )}
            {locationStatus === 'active' && userLocation && (
              <span className="gps-badge active" title={`Accuracy: ±${userLocation.accuracy || 10}m`}>
                <span className="gps-pulse-dot" /> Live GPS: {userLocation.placeName || `${userLocation.lat.toFixed(3)}, ${userLocation.lng.toFixed(3)}`}
              </span>
            )}
            {locationStatus === 'error' && (
              <span className="gps-badge error" title={locationError}>
                <AlertTriangle size={13} /> GPS Inactive
              </span>
            )}
          </div>

          <div className="map-controls-row">
            {/* View Mode Switchers */}
            {userLocation && (
              <>
                <button
                  type="button"
                  className={`map-action-btn ${viewMode === 'user' ? 'active' : ''}`}
                  onClick={() => setViewMode('user')}
                  title="Zoom into your current GPS location"
                >
                  <Locate size={14} /> My Location
                </button>
                <button
                  type="button"
                  className={`map-action-btn ${viewMode === 'outbreak' ? 'active' : ''}`}
                  onClick={() => setViewMode('outbreak')}
                  title="Focus on selected district outbreak hotspot"
                >
                  <Flame size={14} /> Hotspot Center
                </button>
                <button
                  type="button"
                  className={`map-action-btn ${viewMode === 'both' ? 'active' : ''}`}
                  onClick={() => setViewMode('both')}
                  title="Fit both your location and outbreak cluster in view"
                >
                  <Layers size={14} /> Fit Both
                </button>
              </>
            )}

            <button
              type="button"
              className="map-action-btn"
              onClick={() => fetchUserLocation(true)}
              disabled={locationStatus === 'detecting'}
              title="Detect or refresh your GPS location"
            >
              <RefreshCw size={14} className={locationStatus === 'detecting' ? 'spin' : ''} />
              {locationStatus === 'detecting' ? 'Locating...' : 'Locate Me'}
            </button>

            {locationStatus === 'error' && (
              <button
                type="button"
                className="map-action-btn"
                onClick={() => setDemoLocation(selectedDistrict.center[0] + 0.04, selectedDistrict.center[1] + 0.04, `${selectedDistrict.label} Farm (Demo GPS)`)}
                title="Use demo user location near this district"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                <Crosshair size={14} /> Use Demo GPS
              </button>
            )}
          </div>
        </div>

        {/* Proximity Risk Notification */}
        {userLocation && currentDistanceKm !== null && riskInfo && (
          <div className="proximity-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <Navigation size={16} color="var(--primary)" />
              <span>
                <strong>Your Proximity:</strong> You are <strong>{currentDistanceKm} km</strong> from the <strong>{selectedDistrict.label}</strong> disease surveillance center.
              </span>
            </div>
            <span className={`proximity-tag ${riskInfo.tag}`}>
              {riskInfo.label} • {riskInfo.text}
            </span>
          </div>
        )}

        <TrendsMap
          selectedDistrict={selectedDistrict}
          selectedState={selectedState}
          stateDistricts={stateDistricts}
          userLocation={userLocation}
          viewMode={viewMode}
          currentDistanceKm={currentDistanceKm}
          timeRange={timeRange}
          onSelectDistrict={setSelectedDistrict}
        />
      </div>

      {/* 4. Charts Grid */}
      <div className="chart-grid">

        {/* Line / Area Chart */}
        <div className="chart-card">
          <div className="chart-title">Disease Incidence Trend ({timeRange})</div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <AreaChart data={dynamicCharts.incidence} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLsd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFmd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" style={{ fontSize: '0.75rem' }} />
                <YAxis style={{ fontSize: '0.75rem' }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                {(selectedDisease === 'all' || selectedDisease === 'lsd') && (
                  <Area type="monotone" dataKey="lsd" name="Lumpy Skin (LSD)" stroke="#ef4444" fillOpacity={1} fill="url(#colorLsd)" />
                )}
                {(selectedDisease === 'all' || selectedDisease === 'fmd') && (
                  <Area type="monotone" dataKey="fmd" name="Foot & Mouth (FMD)" stroke="#f97316" fillOpacity={1} fill="url(#colorFmd)" />
                )}
                {(selectedDisease === 'all' || selectedDisease === 'ppr') && (
                  <Area type="monotone" dataKey="ppr" name="PPR / Goat Plague" stroke="#8b5cf6" fill="transparent" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="chart-card">
          <div className="chart-title">Pathogen Distribution Ratio</div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={dynamicCharts.distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                  {dynamicCharts.distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart */}
        <div className="chart-card">
          <div className="chart-title">Sub-district Morbidity vs Mortality</div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={blockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" style={{ fontSize: '0.75rem' }} />
                <YAxis style={{ fontSize: '0.75rem' }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="cases" name="Infected Livestock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deaths" name="Mortality Cases" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="chart-card">
          <div className="chart-title">Livestock Species Vaccination Rate (%)</div>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={vaccinationData} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} style={{ fontSize: '0.75rem' }} />
                <YAxis dataKey="name" type="category" style={{ fontSize: '0.75rem' }} width={85} />
                <RechartsTooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="rate" name="Vaccinated %" fill="#10b981" barSize={20} radius={[0, 4, 4, 0]}>
                  {vaccinationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.rate > 80 ? '#10b981' : entry.rate > 60 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}