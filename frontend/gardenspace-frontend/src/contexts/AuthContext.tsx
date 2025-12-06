import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authHelpers, getUserRoles } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // 🔄 Sync Supabase user with Spring Boot backend
  const syncUserWithBackend = async (user: User) => {
    try {
      await fetch("http://localhost:8081/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.user_metadata.full_name || user.email,
          avatarUrl: user.user_metadata.avatar_url || ""
        })
      });
    } catch (error) {
      console.error("Failed to sync user with backend:", error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = authHelpers.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        syncUserWithBackend(session.user);

        setTimeout(() => {
          getUserRoles(session.user.id).then(({ roles }) => {
            setIsAdmin(roles.includes('admin'));
          });
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    // THEN check for existing session
    authHelpers.getCurrentUser().then(({ user, session }) => {
      setSession(session);
      setUser(user);

      if (user) {
        syncUserWithBackend(user);

        getUserRoles(user.id).then(({ roles }) => {
          setIsAdmin(roles.includes('admin'));
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await authHelpers.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
