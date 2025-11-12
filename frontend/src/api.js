import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
export function setToken(token){
  api.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : undefined;
}
export default api;
