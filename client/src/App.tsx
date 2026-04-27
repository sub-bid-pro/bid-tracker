import { Routes, Route } from 'react-router-dom';
import { Auth } from './pages/auth/Auth';
import { Splash } from './pages/splash/Splash';
import { Dashboard } from './pages/dashboard/Dashboard';
import { BidTracker } from './pages/bidTracker/BidTracker';
import { Settings } from './pages/settings/Settings';
import { Onboarding } from './pages/onboarding/Onboarding';
import { ProtectedRoute } from './components/protectedRoute/ProtectedRoute';
import Navbar from './components/navbar/Navbar';
import { BidDetailEdit } from './pages/bidDetailEdit/BidDetailEdit';
import { AnnualBreakdown } from './pages/annualBreakdown/AnnualBreakdown';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/welcome" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          {/* Protected: Requires Login, but NOT a profile yet */}
          <Route element={<ProtectedRoute requireProfile={false} />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          {/* Protected: Requires Login AND a completed profile */}
          <Route element={<ProtectedRoute requireProfile={true} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tracker" element={<BidTracker />} />
            <Route path="/annual-breakdown" element={<AnnualBreakdown />} />
            <Route path="/bids/:id/edit" element={<BidDetailEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
