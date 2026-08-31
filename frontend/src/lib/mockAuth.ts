export const isMockAuth = import.meta.env.VITE_AUTH_MODE === 'mock';
const apiUrl = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:4000';

async function request(path, body) {
  const response = await fetch(`${apiUrl}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to complete the request.');
  return data;
}

export const sendMockOtp = (phone) => request('/api/auth/send-otp', { phone });
export const verifyMockOtp = (phone, otp, role) => request('/api/auth/verify-otp', { phone, otp, role });
