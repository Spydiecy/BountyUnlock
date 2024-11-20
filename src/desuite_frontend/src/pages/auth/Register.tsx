import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateUsername = (username: string): boolean => {
    return username.length >= 3;
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      // Frontend validations
      if (!validateUsername(username)) {
        setError('Username must be at least 3 characters long');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsLoading(true);

      try {
        console.log('Attempting registration with:', { username, email }); // Debug log
        await register(username, email, password);
        navigate('/dashboard');
      } catch (err) {
        console.error('Registration error:', err); // Debug log
        let errorMessage = 'Registration failed';
        if (err instanceof Error) {
          console.log('Error message:', err.message); // Debug log
          errorMessage = err.message.includes("Invalid email format") 
            ? "Please enter a valid email address" 
            : err.message.replace('Rejected: ', '');
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
  };

  const validateEmail = (email: string): boolean => {
      // Simple but effective email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing again
    if (error.includes('email')) {
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="relative h-screen flex items-center justify-center px-4">
        {/* Gradient effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#6b21a8,transparent_70%)]" />
        
        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-black/40 p-8 rounded-2xl border border-purple-500/30 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                Create Account
              </h2>
              <p className="text-gray-400 mt-2">Join our community today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg bg-black/50 border ${
                    error.includes('Username') 
                      ? 'border-red-500' 
                      : 'border-purple-500/30'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500`}
                  placeholder="Choose a username"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-3 rounded-lg bg-black/50 border ${
                    error.includes('email') 
                      ? 'border-red-500' 
                      : 'border-purple-500/30'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500`}
                  placeholder="Enter your email"
                  required
                />
                {error.includes('email') && (
                  <p className="text-red-500 text-xs mt-1">
                    Please enter a valid email address
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg bg-black/50 border ${
                      error.includes('Password') 
                        ? 'border-red-500' 
                        : 'border-purple-500/30'
                    } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500`}
                    placeholder="Create a password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-400"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg bg-black/50 border ${
                    error.includes('match') 
                      ? 'border-red-500' 
                      : 'border-purple-500/30'
                  } text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500`}
                  placeholder="Confirm your password"
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 transition-all duration-300 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={18} />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              <p className="text-center text-gray-400 text-sm">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Login here
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};