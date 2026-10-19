import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  // Sends the httpOnly refresh-token cookie with every request.
  withCredentials: true,
});
