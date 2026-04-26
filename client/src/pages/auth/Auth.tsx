import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './styles.scss';
import { ButtonLoader } from '../../components/buttonLoader/ButtonLoader';
import { useToast } from '../../contexts/ToastContext';

export const Auth = () => {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- NEW: Read the URL parameter to determine the initial view ---
  const [isLogin, setIsLogin] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') !== 'signup';
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const { showToast } = useToast();

  const isProcessing = localLoading || authLoading;

  // Catch expired links from Supabase
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.includes('error=')) {
      showToast('This magic link has expired or is invalid. Please log in or sign up again.');
      // Clean up the URL so it doesn't get stuck in a loop
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [location]);

  // Route automatically if successfully authenticated
  useEffect(() => {
    if (session && !authLoading) {
      if (profile?.onboarding_complete) {
        navigate('/', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [session, authLoading, profile, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      showToast('Passwords do not match!');
      return;
    }

    setLocalLoading(true);

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      // Handle the specific Edge Cases
      if (error.message.includes('already registered')) {
        showToast('This email is already registered! Please log in instead.');
        setIsLogin(true); // Flip them to the login screen
        setPassword('');
        setConfirmPassword('');
      } else if (error.message.includes('Email not confirmed')) {
        showToast('Please confirm your email address before logging in. Check your inbox!');
      } else {
        showToast(error.message); // Fallback for wrong passwords, etc.
      }
      setLocalLoading(false);
    } else if (!isLogin) {
      showToast('Check your email for confirmation!');
      setLocalLoading(false);
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
        <form className="auth-form" onSubmit={handleAuth}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {!isLogin && (
            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}
          <button type="submit" disabled={isProcessing} className={isProcessing ? 'loading' : ''}>
            <span className="btn-text">{isLogin ? 'Enter' : 'Create Account'}</span>
            {isProcessing && (
              <span className="loader-overlay">
                <ButtonLoader />
              </span>
            )}
          </button>
        </form>
        <p className="toggle-auth">
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setPassword('');
              setConfirmPassword('');
            }}
          >
            {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
          </span>
        </p>
      </div>
    </div>
  );
};
