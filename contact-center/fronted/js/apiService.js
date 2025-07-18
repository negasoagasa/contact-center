const API_BASE_URL = 'http://localhost:5000/api';

async function fetchWithAuth(url, options = {}) {
  const token = sessionStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}

export const authService = {
  login: async (username, password) => {
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('currentUser', JSON.stringify(data.user));
    return data.user;
  },
  
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
  }
};

export const userService = {
  getUsers: async () => {
    return fetchWithAuth('/users');
  },
  
  createUser: async (userData) => {
    return fetchWithAuth('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  updateUser: async (id, userData) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  
  deleteUser: async (id) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

export const callService = {
  logCall: async (callData) => {
    return fetchWithAuth('/calls', {
      method: 'POST',
      body: JSON.stringify(callData)
    });
  },
  
  getDashboardStats: async () => {
    return fetchWithAuth('/calls/dashboard');
  },
  
  getDepartmentCalls: async (department) => {
    return fetchWithAuth(`/calls/department/${department}`);
  },
  
  getAgentCalls: async (agentId) => {
    return fetchWithAuth(`/calls/agent/${agentId}`);
  },
  
  respondToCall: async (callId, responseData) => {
    return fetchWithAuth(`/calls/${callId}/respond`, {
      method: 'PUT',
      body: JSON.stringify(responseData)
    });
  }
};

export const reportService = {
  generateReport: async (period, date) => {
    return fetchWithAuth(`/reports?period=${period}&date=${date}`);
  }
};