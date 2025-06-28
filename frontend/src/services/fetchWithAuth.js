// src/services/fetchWithAuth.js

export function refreshToken() {
  const refresh = localStorage.getItem('refresh_token');
  return fetch('/api/token/refresh/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  })
    .then(res => {
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    })
    .then(data => {
      localStorage.setItem('token', data.access);
      return data.access;
    });
}

export function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    }
  }).then(res => {
    if (res.status === 401) {
      // Token expiré, tente de le rafraîchir
      return refreshToken().then(newToken => {
        // Rejoue la requête avec le nouveau token
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          }
        });
      });
    }
    return res;
  });
}