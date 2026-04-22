import { Routes, Route } from 'react-router-dom';
import { Auth } from './pages/auth/Auth';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Settings } from './pages/settings/Settings';
import { Onboarding } from './pages/onboarding/Onboarding';
import { ProtectedRoute } from './components/protectedRoute/ProtectedRoute';
import { Account } from './pages/account/Account';
import Navbar from './components/navbar/Navbar';
import { BidDetailEdit } from './pages/bidDetailEdit/BidDetailEdit';

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <Routes>
          {/* Public Route */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected: Requires Login, but NOT a profile yet */}
          <Route element={<ProtectedRoute requireProfile={false} />}>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>

          {/* Protected: Requires Login AND a completed profile */}
          <Route element={<ProtectedRoute requireProfile={true} />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/bids/:id/edit" element={<BidDetailEdit />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
