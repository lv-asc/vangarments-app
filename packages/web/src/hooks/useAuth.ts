// This hook is deprecated in favor of the AuthContext
// Use useAuth from @/contexts/AuthContext instead

import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export const useAuth = useAuthContext;