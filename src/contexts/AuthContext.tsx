import { createContext, useContext, useEffect, useState } from 'react';
import { authService, dataService } from '../services';
import type { User, Session } from '../services/types';
import type { UserProfile } from '../lib/database.types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  canEdit: () => boolean;
  isActive: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data } = await dataService.queryOne<UserProfile>('user_profiles', {
        filter: { id: userId }
      });
      setUserProfile(data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    authService.getSession().then(async (session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const unsubscribe = authService.onAuthStateChange(async (session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn(email, password);

    if (error) {
      return { error };
    }

    const currentSession = await authService.getSession();
    if (currentSession?.user?.id) {
      const { data: profile } = await dataService.queryOne<UserProfile>('user_profiles', {
        filter: { id: currentSession.user.id }
      });

      if (!profile) {
        await authService.signOut();
        return { error: { message: '用户资料不存在，请联系管理员' } };
      }

      if (profile.status === 'pending') {
        await authService.signOut();
        return { error: { message: '您的账号正在审核中，请等待管理员审批后再登录' } };
      }

      if (profile.status === 'locked') {
        await authService.signOut();
        return { error: { message: '您的账号已被锁定，请联系管理员' } };
      }

      if (profile.status === 'deleted') {
        await authService.signOut();
        return { error: { message: '您的账号已被删除，请联系管理员' } };
      }

      setUserProfile(profile);
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await authService.signUp(email, password);
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  const hasRole = (roles: string[]) => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  const isAdmin = () => {
    return (userProfile?.role === 'admin' || userProfile?.role === 'super_admin') && userProfile?.status === 'active';
  };

  const canEdit = () => {
    if (!userProfile || userProfile.status !== 'active') return false;
    return userProfile.role === 'admin' || userProfile.role === 'super_admin' || userProfile.role === 'read_write';
  };

  const isActive = () => {
    return userProfile?.status === 'active';
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin,
    canEdit,
    isActive,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
