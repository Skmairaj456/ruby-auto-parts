import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('rap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

export const setAuthInterceptor = (logoutFn, navigateFn) => {
  API.interceptors.response.use(
    response => response,
    async error => {
      if (error.response && error.response.status === 401) {
        logoutFn();
        navigateFn('/login'); // Redirect to login page
      }
      return Promise.reject(error);
    }
  );
};

// Sales API functions
export const recordSale = async (saleData) => {
  return API.post('/sales', saleData);
};

export const getSales = async (date = null) => {
  let url = '/sales';
  if (date) {
    url += `?date=${date}`;
  }
  return API.get(url);
};

export const getSaleById = async (id) => {
  return API.get(`/sales/${id}`);
};

// Print API functions
export const printSingleLabel = async (id) => {
  return API.post(`/onhold/${id}/print-single`);
};

export const printQuantityLabels = async (id) => {
  return API.post(`/onhold/${id}/print-quantity`);
};
