import { Routes, Route } from 'react-router-dom';
import { Auth } from './pages/auth/Auth';
import { Dashboard } from './pages/dashboard/Dashboard';
import { BidTracker } from './pages/bidTracker/BidTracker';
import { Settings } from './pages/settings/Settings';
import { Onboarding } from './pages/onboarding/Onboarding';
import { ProtectedRoute } from './components/protectedRoute/ProtectedRoute';
import Navbar from './components/navbar/Navbar';
import { BidDetailEdit } from './pages/bidDetailEdit/BidDetailEdit';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Routes>
          <Route path="/auth" element={<Auth />} />

          <Route element={<ProtectedRoute requireProfile={false} />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          <Route element={<ProtectedRoute requireProfile={true} />}>
            {/* Make the new Dashboard the default home page */}
            <Route path="/" element={<Dashboard />} />

            {/* Route the old dashboard to /tracker */}
            <Route path="/tracker" element={<BidTracker />} />
            <Route path="/bids/:id/edit" element={<BidDetailEdit />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
