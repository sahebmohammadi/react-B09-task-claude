import { createBrowserRouter, redirect } from 'react-router';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { OverviewPage } from '@/features/dashboard/OverviewPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Phase 0 route tree (PRD §9.1). Route middleware and real pages come in later phases.
export const router = createBrowserRouter([
  { path: '/', loader: () => redirect('/dashboard') },
  { path: '/auth', element: <PlaceholderPage title="Sign in" /> },
  { path: '/account-status', element: <PlaceholderPage title="Account status" /> },
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'projects', element: <PlaceholderPage title="Projects" /> },
      { path: 'projects/new', element: <PlaceholderPage title="New project" /> },
      { path: 'projects/:id', element: <PlaceholderPage title="Project details" /> },
      { path: 'projects/:id/edit', element: <PlaceholderPage title="Edit project" /> },
      { path: 'proposals', element: <PlaceholderPage title="My proposals" /> },
      { path: 'users', element: <PlaceholderPage title="Users" /> },
    ],
  },
  { path: '*', element: <PlaceholderPage title="Page not found" /> },
]);
