import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../pageLoader/PageLoader';

export const ProtectedRoute = ({ requireProfile = true }) => {
  const { session, profile, loading } = useAuth();

  // 1. Only block the screen if AuthContext is actively fetching data
  // AND we don't have a profile yet (initial load).
  // If we already have a profile, let the component's button loaders handle it!
  if (loading && !profile) {
    return <PageLoader />;
  }

  // 2. Send guests to the splash screen instead of auth
  if (!session) {
    return <Navigate to="/welcome" replace />;
  }

  // 3. Needs a profile but hasn't completed onboarding?
  if (requireProfile && !profile?.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  // 4. On the onboarding page, but already finished it?
  if (!requireProfile && profile?.onboarding_complete) {
    return <Navigate to="/" replace />;
  }

  // 5. Passed all checks, render the page
  return <Outlet />;
};
