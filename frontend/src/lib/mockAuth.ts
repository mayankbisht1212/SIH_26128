import { isSupabaseConfigured } from './supabase';

export const isMockAuth = import.meta.env.VITE_AUTH_MODE === 'mock' || !isSupabaseConfigured;
const apiUrl = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:4000';

export async function sendMockOtp(phone: string) {
  try {
    const response = await fetch(`${apiUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend auth server offline, using local mock OTP:', err);
  }
  
  // Browser fallback mock response
  return {
    success: true,
    devOtp: '123456',
    message: 'OTP sent to mobile number.'
  };
}

export async function verifyMockOtp(phone: string, otp: string, role?: string) {
  try {
    const response = await fetch(`${apiUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, role })
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend auth server offline, verifying locally:', err);
  }

  const roleName = role || 'Farmer';
  const mockUser = {
    id: `user-${Date.now()}`,
    phone: phone || '+919876543210',
    role: roleName,
    user_metadata: {
      full_name: roleName === 'Farmer' ? 'Ramesh Yadav' : roleName === 'Field Veterinarian' ? 'Dr. Anil Sharma' : 'District Officer',
      role: roleName
    }
  };

  return {
    success: true,
    user: mockUser,
    session: {
      user: mockUser,
      access_token: `mock-jwt-token-${Date.now()}`
    }
  };
}
