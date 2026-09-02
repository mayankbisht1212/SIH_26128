export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: string;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          role?: string;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      animals: {
        Row: {
          id: string;
          owner_id: string;
          tag_id: string;
          species: string;
          health_status: 'healthy' | 'sick';
          last_vaccinated_on: string | null;
          vaccine_name: string | null;
          next_vaccination_on: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          tag_id: string;
          species: string;
          health_status?: 'healthy' | 'sick';
          last_vaccinated_on?: string | null;
          vaccine_name?: string | null;
          next_vaccination_on?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          tag_id?: string;
          species?: string;
          health_status?: 'healthy' | 'sick';
          last_vaccinated_on?: string | null;
          vaccine_name?: string | null;
          next_vaccination_on?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          animal_id: string | null;
          species: string | null;
          symptoms_text: string | null;
          selected_symptoms: string[];
          mortality_count: number;
          village: string | null;
          block: string | null;
          district: string | null;
          latitude: number | null;
          longitude: number | null;
          assessment: string | null;
          ml_disease: string | null;
          ml_confidence: number | null;
          image_path: string | null;
          audio_path: string | null;
          status: 'pending' | 'reviewed' | 'resolved';
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          animal_id?: string | null;
          species?: string | null;
          symptoms_text?: string | null;
          selected_symptoms?: string[];
          mortality_count?: number;
          village?: string | null;
          block?: string | null;
          district?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          assessment?: string | null;
          ml_disease?: string | null;
          ml_confidence?: number | null;
          image_path?: string | null;
          audio_path?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved';
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          animal_id?: string | null;
          species?: string | null;
          symptoms_text?: string | null;
          selected_symptoms?: string[];
          mortality_count?: number;
          village?: string | null;
          block?: string | null;
          district?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          assessment?: string | null;
          ml_disease?: string | null;
          ml_confidence?: number | null;
          image_path?: string | null;
          audio_path?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved';
          created_at?: string;
        };
      };
    };
  };
}
