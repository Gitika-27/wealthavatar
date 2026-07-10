import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';

export const AppContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  
  // Security Configurations
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(
    localStorage.getItem('isBiometricEnrolled') === 'true'
  );
  const [isBiometricAuthenticated, setIsBiometricAuthenticated] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(
    localStorage.getItem('isBalanceHidden') === 'true'
  );
  const [isAppLocked, setIsAppLocked] = useState(!!token);
  const [sessionTimeoutDuration] = useState(300); // 5 minutes in seconds

  // Navigation and caches
  const [activeScreen, setActiveScreen] = useState('Onboarding');
  const [dashboardData, setDashboardData] = useState(null);
  const [spendingData, setSpendingData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [goalsData, setGoalsData] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [marketNews, setMarketNews] = useState(null);
  const [dailyTip, setDailyTip] = useState('');
  const [nudges, setNudges] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const inactivityTimerRef = useRef(null);

  // Helper to append Auth Headers
  const getHeaders = useCallback(() => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  // Handle Logouts
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setIsBiometricAuthenticated(false);
    setIsAppLocked(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setActiveScreen('AvatarHome');
  }, []);

  // API Error handler helper (captures 403 Session Timeout)
  const handleApiCall = useCallback(async (apiFn) => {
    try {
      const response = await apiFn();
      if (response.status === 401 || response.status === 403) {
        let errData = {};
        try { errData = await response.json(); } catch (_) {}
        const isExpired =
          errData.error === 'Session expired' ||
          errData.error?.toLowerCase().includes('expired') ||
          errData.error?.toLowerCase().includes('invalid token') ||
          response.status === 401;
        if (isExpired) {
          console.warn('Token expired or invalid — logging out.');
          logout();
          return null;
        }
      }
      return response;
    } catch (err) {
      console.error('API Connection Error:', err.message);
      return null;
    }
  }, [logout]);

  // Auth Operations
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (isBiometricEnrolled) {
        setIsAppLocked(true);
        setIsBiometricAuthenticated(false);
      } else {
        setIsAppLocked(false);
        setIsBiometricAuthenticated(true);
      }

      if (data.user.riskProfile === 'Moderate' && !localStorage.getItem('onboarded_completed')) {
        setActiveScreen('Onboarding');
      } else {
        setActiveScreen('Dashboard');
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, income) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, monthlyIncome: income })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Onboarding submissions
  const submitOnboarding = async (answers) => {
    setLoading(true);
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/user/onboard`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ answers })
        })
      );
      if (!res) return false;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const updatedUser = { ...user, riskProfile: data.riskProfile };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('onboarded_completed', 'true');
      
      setActiveScreen('Dashboard');
      return true;
    } catch (err) {
      console.error('Onboarding submit error:', err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Fetch Dashboard details
  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/dashboard`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders, handleApiCall]);

  // Fetch Spending details
  const fetchSpending = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/spending`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setSpendingData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders, handleApiCall]);

  // Fetch Portfolio details
  const fetchPortfolio = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/portfolio`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setPortfolioData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders, handleApiCall]);

  // Fetch Goals list
  const fetchGoals = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/goals`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setGoalsData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, getHeaders, handleApiCall]);

  // Add goal
  const addGoal = async (name, type, target, date, monthlyContribution) => {
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/goals`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ name, type, targetAmount: target, targetDate: date, monthlyContribution })
        })
      );
      if (res && res.ok) {
        await fetchGoals();
        await fetchDashboard();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Delete goal
  const deleteGoal = async (id) => {
    try {
      const res = await handleApiCall(() =>
        fetch(`${API_BASE_URL}/goals/${id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
      );
      if (res && res.ok) {
        setGoalsData(prev => prev.filter(g => g.id !== id));
        await fetchDashboard();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Add SIP allocation
  const configureSip = async (amount, assetName) => {
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/portfolio/sip`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ amount, assetName })
        })
      );
      if (res && res.ok) {
        await fetchPortfolio();
        await fetchDashboard();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Fetch alerts/morning tip
  const fetchNudges = useCallback(async () => {
    if (!token) return;
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/nudges`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setDailyTip(data.dailyTip);
        setNudges(data.nudges);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, getHeaders, handleApiCall]);

  // Fetch personalized market updates
  const fetchMarketNews = useCallback(async () => {
    if (!token) return;
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/market/news`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setMarketNews(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, getHeaders, handleApiCall]);

  // Chat queries history (legacy — keep for backward compat)
  const fetchChatHistory = useCallback(async () => {
    if (!token) return;
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/chat/history`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, getHeaders, handleApiCall]);

  // Fetch all chat sessions for current user
  const fetchChatSessions = useCallback(async () => {
    if (!token) return;
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/chat/sessions`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setChatSessions(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, getHeaders, handleApiCall]);

  // Fetch messages of a specific session
  const fetchSessionMessages = useCallback(async (sessionId) => {
    if (!token || !sessionId) return;
    if (sessionId === 'new') {
      setChatHistory([]);
      return;
    }
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, { headers: getHeaders() })
      );
      if (res && res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, getHeaders, handleApiCall]);

  // Create new empty chat session
  const createChatSession = async () => {
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/chat/sessions`, {
          method: 'POST',
          headers: getHeaders()
        })
      );
      if (res && res.ok) {
        const data = await res.json();
        await fetchChatSessions();
        return data.id;
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // Delete a chat session
  const deleteChatSession = async (sessionId) => {
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
      );
      if (res && res.ok) {
        await fetchChatSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Send message to Cashius in a session
  const sendChatMessage = async (msg, sessionId) => {
    const userMsg = { sender: 'user', message: msg, createdAt: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    
    try {
      const res = await handleApiCall(() => 
        fetch(`${API_BASE_URL}/chat`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ message: msg, sessionId })
        })
      );
      
      if (res && res.ok) {
        const data = await res.json();
        const advisorMsg = { sender: 'advisor', message: data.response, createdAt: new Date().toISOString() };
        setChatHistory(prev => [...prev, advisorMsg]);
        // Reload sessions to refresh auto-generated titles
        await fetchChatSessions();
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Toggle privacy hide balance options
  const toggleBalancePrivacy = () => {
    const nextVal = !isBalanceHidden;
    setIsBalanceHidden(nextVal);
    localStorage.setItem('isBalanceHidden', nextVal ? 'true' : 'false');
  };

  // Toggle biometric settings
  const toggleBiometricEnrollment = () => {
    const nextVal = !isBiometricEnrolled;
    setIsBiometricEnrolled(nextVal);
    localStorage.setItem('isBiometricEnrolled', nextVal ? 'true' : 'false');
    if (!nextVal) {
      setIsBiometricAuthenticated(true);
    }
  };

  // Client Session Timeout resetting
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.log('Inactivity timeout triggered after 5 minutes.');
      setIsBiometricAuthenticated(false);
      setIsAppLocked(true);
    }, sessionTimeoutDuration * 1000);
  }, [isAuthenticated, sessionTimeoutDuration]);

  // Hook activity listeners
  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
      events.forEach(e => window.addEventListener(e, resetInactivityTimer));
      
      return () => {
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      };
    }
  }, [isAuthenticated, resetInactivityTimer]);

  // Initial routing
  useEffect(() => {
    if (isAuthenticated) {
      if (isBiometricEnrolled) {
        setIsAppLocked(true);
        setIsBiometricAuthenticated(false);
      } else {
        setIsAppLocked(false);
        setIsBiometricAuthenticated(true);
      }
      setActiveScreen(localStorage.getItem('onboarded_completed') === 'true' ? 'Dashboard' : 'Onboarding');
    } else {
      setActiveScreen('AvatarHome');
    }
  }, [isAuthenticated, isBiometricEnrolled]);

  return (
    <AppContext.Provider value={{
      token,
      user,
      isAuthenticated,
      isBiometricEnrolled,
      isBiometricAuthenticated,
      isBalanceHidden,
      isAppLocked,
      activeScreen,
      loading,
      dashboardData,
      spendingData,
      portfolioData,
      goalsData,
      chatHistory,
      setChatHistory,
      chatSessions,
      activeSessionId,
      setActiveSessionId,
      marketNews,
      dailyTip,
      nudges,
      sessionTimeoutDuration,
      setToken,
      setUser,
      setIsBiometricAuthenticated,
      setIsAppLocked,
      setActiveScreen,
      login,
      register,
      logout,
      submitOnboarding,
      fetchDashboard,
      fetchSpending,
      fetchPortfolio,
      fetchGoals,
      addGoal,
      deleteGoal,
      configureSip,
      fetchNudges,
      fetchMarketNews,
      fetchChatHistory,
      sendChatMessage,
      fetchChatSessions,
      fetchSessionMessages,
      createChatSession,
      deleteChatSession,
      toggleBalancePrivacy,
      toggleBiometricEnrollment,
      resetInactivityTimer
    }}>
      {children}
    </AppContext.Provider>
  );
};
