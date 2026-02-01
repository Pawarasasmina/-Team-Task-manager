import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      
      // Ensure user has id field (backend sends it as id already)
      const userData = {
        ...response.user,
        id: response.user.id || response.user.id
      };
      
      login(response.token, userData);

      // Redirect based on role
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 w-full max-w-md animate-[slideUp_0.5s_ease] border border-white/20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-primary text-4xl font-bold mb-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">Task Manager</h2>
          <p className="text-gray-600 text-sm font-medium">Sign in to manage your tasks</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6 text-sm shadow-lg animate-[fadeIn_0.3s_ease] flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-800 mb-3 font-bold text-sm flex items-center gap-2">
              <span className="text-lg">📧</span>
              <span>Email Address</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="email"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(102,126,234,0.1)] hover:border-gray-300"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-800 mb-3 font-bold text-sm flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <span>Password</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-sm transition-all outline-none focus:border-primary focus:shadow-[0_0_0_4px_rgba(102,126,234,0.1)] hover:border-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl font-bold text-base transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
