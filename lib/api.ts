const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        if (isJson && data && typeof data === 'object' && 'error' in data) {
          return { error: (data as { error?: string }).error || 'Request failed' };
        }
        return { error: typeof data === 'string' && data ? data : 'Request failed' };
      }

      return { data: data as T };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    tenantId: string;
  }) => {
    return apiClient.post('/auth/register', data);
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post<{
      accessToken: string;
      user: {
        id: number;
        name: string;
        email: string;
        role: string;
        tenantId: string;
      };
    }>('/auth/login', { email, password });

    if (response.data?.accessToken) {
      apiClient.setToken(response.data.accessToken);
    }

    return response;
  },

  logout: () => {
    apiClient.setToken(null);
  },

  getMe: async () => {
    return apiClient.get<{
      id: number;
      name: string;
      email: string;
      role: string;
      tenantId: string;
    }>('/users/me');
  },
};

// Resources API
export const resourcesApi = {
  getResources: async (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return apiClient.get(`/resources${query}`);
  },
  createResource: async (data: { name: string; type: string; capacity: number }) => {
    return apiClient.post('/resources', data);
  },
  createBooking: async (data: { resourceId: number; startTime: string; endTime: string }) => {
    return apiClient.post('/bookings', data);
  },
  getMyBookings: async () => {
    return apiClient.get('/bookings/my');
  },
};

// Marketplace API
export const marketplaceApi = {
  getProducts: async () => {
    return apiClient.get('/marketplace/products');
  },
  createProduct: async (data: { name: string; price: number; stock: number }) => {
    return apiClient.post('/marketplace/products', data);
  },
  addToCart: async (data: { productId: number; quantity: number }) => {
    return apiClient.post('/marketplace/cart/items', data);
  },
  checkout: async () => {
    return apiClient.post('/marketplace/checkout');
  },
};

// E-Learning API
export const elearningApi = {
  getExams: async () => {
    return apiClient.get('/elearning/exams');
  },
  createExam: async (data: {
    title: string;
    startTime: string;
    duration: number;
    questions: Array<{ text: string; options: string[]; correctOption: number }>;
  }) => {
    return apiClient.post('/elearning/exams', data);
  },
  startExam: async (examId: number) => {
    return apiClient.post(`/elearning/exams/${examId}/start`);
  },
  submitExam: async (examId: number, answers: Record<string, number>) => {
    return apiClient.post(`/elearning/exams/${examId}/submit`, { answers });
  },
};

// Notifications API
export const notificationsApi = {
  getNotifications: async () => {
    return apiClient.get('/notifications/notifications');
  },
  markAsRead: async (notificationId: number) => {
    return apiClient.put(`/notifications/notifications/${notificationId}/read`);
  },
};

// IoT API
export const iotApi = {
  getSensorLatest: async (sensorId: string) => {
    return apiClient.get(`/iot/sensors/${sensorId}/latest`);
  },
  getSensorHistory: async (sensorId: string, limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return apiClient.get(`/iot/sensors/${sensorId}/history${query}`);
  },
};

// Shuttle API
export const shuttleApi = {
  getShuttleLocation: async (shuttleId: string) => {
    return apiClient.get(`/shuttle/shuttle/${shuttleId}/location`);
  },
  getAllShuttles: async () => {
    return apiClient.get('/shuttle/shuttles');
  },
};

// Admin API
export const adminApi = {
  getUsers: async (role?: string) => {
    const query = role ? `?role=${role}` : '';
    return apiClient.get(`/users${query}`);
  },
  createUser: async (data: { name: string; email: string; password: string; role: string; tenantId: string }) => {
    return apiClient.post('/admin/users', data);
  },
  updateUser: async (id: number, data: any) => {
    return apiClient.put(`/admin/users/${id}`, data);
  },
  deleteUser: async (id: number) => {
    return apiClient.delete(`/admin/users/${id}`);
  },
};

// Courses API
export const coursesApi = {
  getCourses: async (professorId?: number, studentId?: number) => {
    const params = new URLSearchParams();
    if (professorId) params.append('professorId', professorId.toString());
    if (studentId) params.append('studentId', studentId.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/courses${query}`);
  },
  getMyCourses: async () => {
    return apiClient.get('/courses/my');
  },
  getCourse: async (id: number) => {
    return apiClient.get(`/courses/${id}`);
  },
  createCourse: async (data: { code: string; name: string; professorId?: number; credits: number; semester: string }) => {
    return apiClient.post('/courses', data);
  },
  updateCourse: async (id: number, data: { code?: string; name?: string; professorId?: number; credits?: number; semester?: string }) => {
    return apiClient.put(`/courses/${id}`, data);
  },
  deleteCourse: async (id: number) => {
    return apiClient.delete(`/courses/${id}`);
  },
  enrollInCourse: async (courseId: number) => {
    return apiClient.post(`/courses/${courseId}/enroll`);
  },
};


