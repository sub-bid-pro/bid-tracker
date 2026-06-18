import { Outlet } from 'react-router-dom';
import { BillingGate } from './BillingGate';

/** Layout route that applies the billing wall/banner around protected pages. */
export const GatedLayout = () => (
  <BillingGate>
    <Outlet />
  </BillingGate>
);
