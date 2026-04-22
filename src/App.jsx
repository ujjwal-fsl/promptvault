import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Loader from '@/components/Loader';

import React, { Suspense, useEffect } from 'react';

const Landing = React.lazy(() => import('./pages/Landing'));
const Admin = React.lazy(() => import('./pages/Admin'));
const SharedVault = React.lazy(() => import('./pages/SharedVault'));
const Auth = React.lazy(() => import('./pages/Auth'));
const CompleteProfile = React.lazy(() => import('./pages/CompleteProfile'));
const Profile = React.lazy(() => import('./pages/Profile'));
const PublicVault = React.lazy(() => import('./pages/PublicVault'));
const Verified = React.lazy(() => import('./pages/Verified'));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 font-mono text-center">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-4">Application Error</h1>
          <p className="text-muted-foreground text-sm max-w-lg mb-8 uppercase tracking-widest">
            The application experienced a fatal rendering error. This often occurs when component state conflicts with the expected data schema.
          </p>
          <div className="flex gap-4">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 border border-border hover:bg-foreground hover:text-background transition-colors text-xs tracking-widest uppercase"
            >
              TRY AGAIN
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-border hover:bg-foreground hover:text-background transition-colors text-xs tracking-widest uppercase opacity-60"
            >
              RELOAD APPLICATION
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Safe navigation guard — avoid calling navigate during render
  useEffect(() => {
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError, navigateToLogin]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingAuth || isLoadingPublicSettings) {
    return <Loader />;
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return <Loader />;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/vault/:vaultId" element={<SharedVault />} />
        <Route path="/public/:username" element={<PublicVault />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/verified" element={<Verified />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {
  console.log("APP RENDERED");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthProvider>
            <AuthenticatedApp />
            <Toaster />
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App