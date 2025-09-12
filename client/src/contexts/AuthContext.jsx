import { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rap_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // In a real app, you'd hit an endpoint to verify the token and get user data
          // For now, we'll decode locally or assume validity for basic data
          const storedUser = JSON.parse(localStorage.getItem('user'));
          setUser(storedUser);
        } catch (error) {
          console.error("Failed to load user from token", error);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting login for:', username);
      const res = await API.post('/auth/login', { username, password });
      console.log('✅ Login response:', res.data);
      
      const { token, ...userData } = res.data;
      localStorage.setItem('rap_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(token);
      setUser(userData);
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('🎉 Login successful, user set:', userData);
      return true;
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data?.message || error.message);
      console.error("Full error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('rap_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete API.defaults.headers.common['Authorization'];
  };

  const register = async (username, password, role) => {
    try {
      const res = await API.post('/auth/register', { username, password, role });
      // For registration, we might not auto-login, especially if approval is needed
      // If auto-login is desired, uncomment the following lines:
      // const { token, ...userData } = res.data;
      // localStorage.setItem('token', token);
      // localStorage.setItem('user', JSON.stringify(userData));
      // setToken(token);
      // setUser(userData);
      // API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return true;
    } catch (error) {
      console.error("Registration failed", error.response?.data?.message || error.message);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    register,
    isAdmin: user && user.role === 'admin' && user.isApproved,
    isEmployee: user && user.role === 'employee' && user.isApproved,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export const getLogout = () => useContext(AuthContext).logout;
