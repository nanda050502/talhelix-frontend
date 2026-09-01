import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BackendUser, BackendUserRole } from '../types/backend';
import { UserProfile } from '../types';

interface AuthState {
  token: string | null;
  user: BackendUser | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  userProfile: UserProfile;
  setAuth: (token: string, user: BackendUser, tenantId: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<BackendUser>) => void;
}

const defaultUserProfile: UserProfile = {
  name: 'Guest User',
  email: '',
  role: 'Student',
  userType: 'student',
  avatarInitials: 'GU',
  isAuthenticated: false,
};

function mapBackendUserToProfile(u: BackendUser | null): UserProfile {
  if (!u) return defaultUserProfile;

  const roleName =
    u.role === 'super_admin'
      ? 'Super Admin'
      : u.role === 'admin' || u.role === 'university_admin'
      ? 'Admin'
      : 'Student';

  const userType = u.role === 'student' ? 'student' : 'admin';

  const initials = u.name
    ? u.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  return {
    name: u.name,
    email: u.email,
    role: roleName,
    userType: userType,
    avatarInitials: initials,
    department: u.department,
    rollNumber: u.roll_number,
    isAuthenticated: true,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      tenantId: null,
      isAuthenticated: false,
      userProfile: defaultUserProfile,

      setAuth: (token, user, tenantId) => {
        localStorage.setItem('talhelix_token', token);
        localStorage.setItem('talhelix_user', JSON.stringify(user));
        set({
          token,
          user,
          tenantId,
          isAuthenticated: true,
          userProfile: mapBackendUserToProfile(user),
        });
      },

      logout: () => {
        localStorage.removeItem('talhelix_token');
        sessionStorage.removeItem('talhelix_token');
        localStorage.removeItem('talhelix_user');
        set({
          token: null,
          user: null,
          tenantId: null,
          isAuthenticated: false,
          userProfile: defaultUserProfile,
        });
      },

      updateUser: (partial) => {
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, ...partial };
          localStorage.setItem('talhelix_user', JSON.stringify(updated));
          return {
            user: updated,
            userProfile: mapBackendUserToProfile(updated),
          };
        });
      },
    }),
    {
      name: 'talhelix-auth-storage',
    }
  )
);
