import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// Returns whether the current user is an authorized preparer (or admin).
// Used to gate the Suite nav link/tab so only preparers see it.
export function useIsPreparer() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: preparers = [] } = useQuery({
    queryKey: ['myPreparerRecord', user?.email],
    queryFn: () => base44.entities.Preparer.filter({ email: user.email }),
    enabled: !!user && !isAdmin,
  });
  const isPreparer = isAuthenticated && (isAdmin || preparers.length > 0);
  return { isPreparer, isAdmin, user, isAuthenticated };
}