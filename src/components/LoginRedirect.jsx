import { Navigate, useLocation } from 'react-router-dom';

// Sends a logged-out visitor to /login and brings them back to the EXACT page
// they asked for afterwards, e.g. /admin?submission=abc from an email link.
export default function LoginRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate to={`/login?returnTo=${encodeURIComponent(pathname + search + hash)}`} replace />;
}
