import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './styles.scss';
import { ButtonLoader } from '../../components/buttonLoader/ButtonLoader';

export const Auth = () => {
  // 1. Pull session and profile from context to determine routing
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const isProcessing = localLoading || authLoading;

  // 2. Automatically route the user once the context is fully loaded
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
    setLocalLoading(true);

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
      setLocalLoading(false);
    } else if (!isLogin) {
      // For sign-ups, alert the user and stop the local loader
      alert('Check your email for confirmation!');
      setLocalLoading(false);
    }
    // 3. Notice we do NOTHING on a successful login.
    // localLoading remains true, keeping the button spinning.
    // AuthContext takes over, fetches the profile, and then the useEffect above handles the routing.
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
          <button type="submit" disabled={isProcessing} className={isProcessing ? 'loading' : ''}>
            {/* The text stays in the DOM to keep the height structure */}
            <span className="btn-text">{isLogin ? 'Enter' : 'Create Account'}</span>

            {/* The loader floats absolutely over the center */}
            {isProcessing && (
              <span className="loader-overlay">
                <ButtonLoader />
              </span>
            )}
          </button>
        </form>
        <p className="toggle-auth">
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}
          </span>
        </p>
      </div>
    </div>
  );
};
