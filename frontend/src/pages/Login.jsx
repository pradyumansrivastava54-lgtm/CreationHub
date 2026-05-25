import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

// Inline zero-dependency classname merger utility
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Customized Premium Input element
function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        "file:text-foreground placeholder:text-slate-500 selection:bg-indigo-600 selection:text-white dark:bg-slate-900/30 border-slate-800 flex h-10 w-full min-w-0 rounded-xl border bg-transparent px-4 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-xs file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-white/20 focus-visible:ring-white/10 focus-visible:ring-4 focus-visible:bg-white/[0.08]",
        "aria-invalid:ring-rose-500/20 dark:aria-invalid:ring-rose-500/40 aria-invalid:border-rose-500",
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
  const [rememberMe, setRememberMe] = useState(false);

  const from = location.state?.from?.pathname || '/';

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

  // For 3D card parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex items-center justify-center font-sans">
      
      {/* ── Background Purple Gradient ─────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-purple-900/25 to-black" />
      
      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-soft-light pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Top radial glow */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-purple-500/15 blur-[90px] pointer-events-none" />
      <motion.div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-purple-400/15 blur-[70px] pointer-events-none"
        animate={{ 
          opacity: [0.1, 0.25, 0.1],
          scale: [0.97, 1.03, 0.97]
        }}
        transition={{ 
          duration: 9, 
          repeat: Infinity,
          repeatType: "mirror"
        }}
      />
      
      {/* Bottom glowing aura */}
      <motion.div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-purple-600/10 blur-[80px] pointer-events-none"
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          scale: [0.95, 1.05, 0.95]
        }}
        transition={{ 
          duration: 7, 
          repeat: Infinity,
          repeatType: "mirror",
          delay: 0.5
        }}
      />

      {/* Glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-[110px] animate-pulse opacity-30 pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-white/[0.02] rounded-full blur-[110px] animate-pulse delay-1000 opacity-30 pointer-events-none" />

      {/* ── 3D Parallax Container Card ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
        className="w-full max-w-sm relative z-10 px-4"
        style={{ perspective: 1500 }}
      >
        <motion.div
          className="relative"
          style={{ rotateX, rotateY }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 12 }}
        >
          <div className="relative group">
            {/* Card glow effect */}
            <motion.div 
              className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
              animate={{
                boxShadow: [
                  "0 0 12px 2px rgba(255,255,255,0.02)",
                  "0 0 18px 5px rgba(255,255,255,0.04)",
                  "0 0 12px 2px rgba(255,255,255,0.02)"
                ],
                opacity: [0.15, 0.35, 0.15]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut", 
                repeatType: "mirror" 
              }}
            />

            {/* Traveling border light beam effect */}
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
              {/* Top light beam */}
              <motion.div 
                className="absolute top-0 left-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
                animate={{ 
                  left: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ 
                  left: { duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 },
                  opacity: { duration: 1.4, repeat: Infinity, repeatType: "mirror" },
                }}
              />
              
              {/* Right light beam */}
              <motion.div 
                className="absolute top-0 right-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white to-transparent opacity-60"
                animate={{ 
                  top: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ 
                  top: { duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8, delay: 0.7 },
                  opacity: { duration: 1.4, repeat: Infinity, repeatType: "mirror", delay: 0.7 },
                }}
              />
              
              {/* Bottom light beam */}
              <motion.div 
                className="absolute bottom-0 right-0 h-[2px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-60"
                animate={{ 
                  right: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ 
                  right: { duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8, delay: 1.4 },
                  opacity: { duration: 1.4, repeat: Infinity, repeatType: "mirror", delay: 1.4 },
                }}
              />
              
              {/* Left light beam */}
              <motion.div 
                className="absolute bottom-0 left-0 h-[50%] w-[2px] bg-gradient-to-b from-transparent via-white to-transparent opacity-60"
                animate={{ 
                  bottom: ["-50%", "100%"],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ 
                  bottom: { duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8, delay: 2.1 },
                  opacity: { duration: 1.4, repeat: Infinity, repeatType: "mirror", delay: 2.1 },
                }}
              />
            </div>

            {/* Frosted glass card background */}
            <div className="relative bg-slate-950/65 backdrop-blur-2xl rounded-2xl p-7 border border-white/[0.04] shadow-2xl overflow-hidden">
              
              {/* Inner geometric grids */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                style={{
                  backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                  backgroundSize: '32px 32px'
                }}
              />

              {/* Logo & Header */}
              <div className="text-center space-y-1 mb-6">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.7 }}
                  className="mx-auto w-11 h-11 rounded-full border border-white/[0.08] flex items-center justify-center relative overflow-hidden bg-white/[0.02]"
                >
                  <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">C</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-40" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70"
                >
                  Welcome Back
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-white/40 text-xs"
                >
                  Sign in to continue to CreationHub
                </motion.p>
              </div>

              {/* Error Banner */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 p-3.5 bg-rose-950/20 border border-rose-900/40 rounded-xl flex items-start gap-2.5 shadow-inner"
                >
                  <p className="text-rose-400 text-xs font-semibold leading-normal">{error}</p>
                </motion.div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  
                  {/* Username / Email Field */}
                  <motion.div 
                    className={`relative ${focusedInput === "username" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.01 }}
                    whileHover={{ scale: 1.005 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-xl">
                      <Mail className={`absolute left-3.5 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "username" ? 'text-white' : 'text-white/45'
                      }`} />
                      
                      <Input
                        type="text"
                        name="username"
                        required
                        placeholder="Username or Email"
                        value={formData.username}
                        onChange={handleChange}
                        onFocus={() => setFocusedInput("username")}
                        onBlur={() => setFocusedInput(null)}
                        className="pl-10.5 bg-white/[0.03] border-transparent focus:border-white/10 text-white placeholder:text-white/20 h-11 focus:bg-white/[0.07]"
                      />

                      {/* Dynamic highlight pill backdrop */}
                      {focusedInput === "username" && (
                        <motion.div 
                          layoutId="input-highlight"
                          className="absolute inset-0 bg-white/[0.02] -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        />
                      )}
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div 
                    className={`relative ${focusedInput === "password" ? 'z-10' : ''}`}
                    whileFocus={{ scale: 1.01 }}
                    whileHover={{ scale: 1.005 }}
                    transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  >
                    <div className="relative flex items-center overflow-hidden rounded-xl">
                      <Lock className={`absolute left-3.5 w-4 h-4 transition-all duration-300 ${
                        focusedInput === "password" ? 'text-white' : 'text-white/45'
                      }`} />
                      
                      <Input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        className="pl-10.5 pr-10 bg-white/[0.03] border-transparent focus:border-white/10 text-white placeholder:text-white/20 h-11 focus:bg-white/[0.07]"
                      />
                      
                      {/* Password Eye Toggle */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 cursor-pointer text-white/40 hover:text-white transition-colors duration-300"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {focusedInput === "password" && (
                        <motion.div 
                          layoutId="input-highlight"
                          className="absolute inset-0 bg-white/[0.02] -z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        />
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex items-center">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={() => setRememberMe(!rememberMe)}
                        className="appearance-none h-4.5 w-4.5 rounded-lg border border-white/10 bg-white/[0.03] checked:bg-white checked:border-white focus:outline-none transition-all duration-200 cursor-pointer"
                      />
                      {rememberMe && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center text-slate-950 pointer-events-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </motion.div>
                      )}
                    </div>
                    <label htmlFor="remember-me" className="text-xs text-white/40 hover:text-white/60 transition-colors duration-200 cursor-pointer select-none">
                      Remember me
                    </label>
                  </div>
                  
                  <Link to="/forgot-password" className="text-xs text-white/40 hover:text-white transition-colors duration-200 select-none">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Action Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group/button mt-4 cursor-pointer"
                >
                  {/* Button soft glow */}
                  <div className="absolute inset-0 bg-white/10 rounded-xl blur opacity-0 group-hover/button:opacity-50 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative overflow-hidden bg-white text-black font-semibold h-11 rounded-xl transition-all duration-300 flex items-center justify-center shadow-md">
                    {/* Beam progress slider */}
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-black/5 to-white/0 -z-10"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
                      style={{ opacity: isLoading ? 0.3 : 0 }}
                    />
                    
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1.5 text-sm"
                        >
                          Sign In
                          <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-1 transition-transform duration-300" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Aesthetic Inline Divider */}
                <div className="relative my-4 flex items-center pointer-events-none">
                  <div className="flex-grow border-t border-white/[0.04]" />
                  <span className="mx-3 text-[10px] text-white/30 uppercase font-bold tracking-widest">or</span>
                  <div className="flex-grow border-t border-white/[0.04]" />
                </div>

                {/* Google Sign In Option */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                  className="w-full relative group/google cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/[0.02] rounded-xl blur opacity-0 group-hover/google:opacity-50 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="relative overflow-hidden bg-white/[0.02] text-white font-medium h-11 rounded-xl border border-white/[0.06] hover:border-white/10 transition-all duration-300 flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-white/70 group-hover/google:text-white transition-colors duration-300">G</span>
                    <span className="text-white/70 group-hover/google:text-white transition-colors text-xs font-medium">
                      Sign in with Google
                    </span>
                  </div>
                </motion.button>

                {/* Redirection Link to Register */}
                <p className="text-center text-xs text-white/40 mt-5 pt-1 border-t border-white/[0.02]">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="relative inline-block group/signup font-semibold text-white/80 hover:text-white transition-colors"
                  >
                    <span>Sign up</span>
                    <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-white group-hover/signup:w-full transition-all duration-300" />
                  </Link>
                </p>

              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
