import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

// Custom error interface
interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Create a custom Axios instance
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: '/api',
  });

  // Response interceptor for error handling
  instance.interceptors.response.use(
    // Automatically extract the response data
    async (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const apiError: ApiError = {
        message: 'An unexpected error occurred',
      };

      if (error.response && error.response.data) {
        const responseData = error.response.data as Record<string, any>;
        apiError.message = responseData.message || apiError.message;
        apiError.code = responseData.code;
        apiError.details = responseData.details;
      } else if (error.message) {
        apiError.message = error.message;
      }

      return Promise.reject(apiError);
    },
  );

  return instance;
};

const api = createAxiosInstance();

export default api;
