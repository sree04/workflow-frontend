import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';

// Define the type for the login response to match backend
interface LoginResponse {
  userId: number; // Matches idrb_user_master from backend
  roles: string[];
}

interface LoginPageProps {
  onLogin: (userId: number, roles: string[]) => void;
  onClose: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      console.log('Sending login request with:', { username, password });
      const response = await axios.post<LoginResponse>('http://localhost:5000/auth/login', { username, password });
      console.log('Login response:', response.data);
      const { userId, roles } = response.data;
      console.log('Passing to onLogin:', { userId, roles }); // Debug log
      onLogin(userId, roles);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Login error:', {
        message: error.message,
        response: error.response ? error.response.data : 'No response data',
        status: error.response ? error.response.status : 'No status',
        config: error.config ? error.config.data : 'No config data',
      });
      setError(`Login failed: ${error.response?.data?.message || error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-800 bg-opacity-70 fixed inset-0 z-50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md border-2 border-purple-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-800">Login</h2>
          <button
            onClick={onClose}
            className="text-purple-500 hover:text-purple-700 focus:outline-none transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-purple-700">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 p-2 bg-purple-50"
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-purple-700">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-purple-200 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50 p-2 bg-purple-50"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:scale-105'
            }`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="text-center mt-4">
            <a href="#" className="text-sm text-purple-600 hover:text-purple-800 hover:underline">
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;