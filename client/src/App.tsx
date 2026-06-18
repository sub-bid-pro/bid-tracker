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
import { MonthlyBreakdown } from './pages/monthlyBreakdown/MonthlyBreakdown';
import { Subscribe } from './pages/subscribe/Subscribe';
import { GatedLayout } from './components/billingGate/GatedLayout';
import { Pricing } from './pages/info/Pricing';
import { Help } from './pages/info/Help';
import { FAQ } from './pages/info/FAQ';
import { Demos } from './pages/info/Demos';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Routes>
          {/* Public Routes (reachable in any state, incl. locked) */}
          <Route path="/welcome" element={<Splash />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/help" element={<Help />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/demos" element={<Demos />} />
          {/* Protected: Requires Login, but NOT a profile yet */}
          <Route element={<ProtectedRoute requireProfile={false} />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          {/* Protected: Requires Login AND a completed profile */}
          <Route element={<ProtectedRoute requireProfile={true} />}>
            {/* Reachable while locked: subscribe redirect + account settings */}
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/settings" element={<Settings />} />

            {/* Gated by billing state: locked screen when locked, banner during grace */}
            <Route element={<GatedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tracker" element={<BidTracker />} />
              <Route path="/annual-breakdown" element={<AnnualBreakdown />} />
              <Route path="/monthly/:year/:month" element={<MonthlyBreakdown />} />
              <Route path="/bids/:id/edit" element={<BidDetailEdit />} />
            </Route>
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
