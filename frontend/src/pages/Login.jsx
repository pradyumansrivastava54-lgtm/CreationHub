import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "file:text-foreground placeholder:text-zinc-400 selection:bg-zinc-950 selection:text-white border-zinc-200 flex h-11 w-full min-w-0 rounded-xl border bg-white/80 px-4 py-2.5 text-sm shadow-xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:border-zinc-900 focus-visible:ring-zinc-950/5 focus-visible:ring-4 focus-visible:bg-white",
        className
      )}
      {...props}
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const from = (typeof location.state?.from === 'object' ? location.state?.from?.pathname : location.state?.from) || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await API.post('/api/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      const { token, id, username, email, role } = response.data;
      login({ id, username, email, role }, token);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        if (data.validationErrors) {
          const messages = Object.values(data.validationErrors).join('. ');
          setError(messages);
        } else {
          setError(data.message || 'Invalid username or password');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#FAF6F0] relative overflow-hidden flex items-center justify-center font-sans">
      
      {/* ── Background Glow Spots ─────────────────────── */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-[#6366f1]/5 blur-[120px] pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#6366f1]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-zinc-950/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* ── Main Container ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-zinc-200/50 shadow-xl shadow-zinc-950/[0.04] overflow-hidden">
          
          {/* Logo & Header */}
          <div className="text-center space-y-2 mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="mx-auto w-12 h-12 rounded-2xl border border-zinc-200 flex items-center justify-center bg-white shadow-xs"
            >
              <span className="text-xl font-black text-zinc-950 font-serif">C</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black text-zinc-900 font-serif uppercase tracking-wider"
            >
              Sign In
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-zinc-500 text-xs font-medium"
            >
              Access your premium lifestyle account at CreationHub
            </motion.p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5"
            >
              <p className="text-red-600 text-xs font-semibold leading-normal">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              
              {/* Username / Email Field */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">Username / Email</label>
                <div className="relative flex items-center">
                  <Mail className={`absolute left-3.5 w-4.5 h-4.5 transition-all duration-300 ${
                    focusedInput === "username" ? 'text-zinc-900' : 'text-zinc-400'
                  }`} />
                  
                  <Input
                    type="text"
                    name="username"
                    required
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("username")}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-11 focus:bg-white text-zinc-900"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="relative">
                <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Password</label>
                </div>
                <div className="relative flex items-center">
                  <Lock className={`absolute left-3.5 w-4.5 h-4.5 transition-all duration-300 ${
                    focusedInput === "password" ? 'text-zinc-900' : 'text-zinc-400'
                  }`} />
                  
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedInput("password")}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-11 pr-10 focus:bg-white text-zinc-900"
                  />
                  
                  {/* Toggle view password */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 cursor-pointer text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    {showPassword ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 cursor-pointer"
            >
              <div className="bg-zinc-900 text-white font-bold h-12 rounded-xl transition-all hover:bg-zinc-800 flex items-center justify-center shadow-md">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center"
                    >
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </motion.div>
                  ) : (
                    <motion.span
                      key="button-text"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-bold"
                    >
                      Sign In
                      <ArrowRight className="w-4 h-4" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            {/* Redirect link to Register */}
            <p className="text-center text-xs text-zinc-500 mt-6 pt-4 border-t border-zinc-100 font-medium">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="relative inline-block font-bold text-zinc-900 hover:text-zinc-800 transition-colors"
              >
                Sign Up
              </Link>
            </p>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
