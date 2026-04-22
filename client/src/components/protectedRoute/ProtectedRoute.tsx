// bid-tracker/client/src/components/protectedRoute/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../pageLoader/PageLoader';

export const ProtectedRoute = ({ requireProfile = true }) => {
  const { session, profile, loading } = useAuth();

  // This prevents the screen from flashing during background token refreshes.
  if ((loading && !profile) || (session && !profile)) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // LOGIC FOR ONBOARDING (requireProfile={true})
  if (requireProfile && !profile?.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  // LOGIC FOR DASHBOARD/SETTINGS PAGE (requireProfile={false})
  if (!requireProfile && profile?.onboarding_complete) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
