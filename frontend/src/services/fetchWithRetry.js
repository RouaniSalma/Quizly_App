import api from './axiosInstance';

let isRefreshing = false;
let refreshPromise = null;

export const fetchWithRetry = async (url, options = {}) => {
  try {
    return await api.get(url, options);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = api.post('/api/token/refresh/', { refresh: localStorage.getItem('refresh_token') })
          .then(res => {
            localStorage.setItem('token', res.data.access);
            isRefreshing = false;
            return res.data.access;
          })
          .catch(err => {
            isRefreshing = false;
            throw err;
          });
      }
      await refreshPromise;
      // Relance la requête avec le nouveau token
      return api.get(url, options);
    }
    throw error;
  }
};