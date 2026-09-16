'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  department?: string | null;
  phone?: string | null;
  maxActiveBookings?: number | null;
}

interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchRole: (role: 'STUDENT' | 'ADMIN') => void;
  refreshUsers: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        if (!currentUser && data.length > 0) {
          // Default to first student or admin
          const student = data.find((u: User) => u.role === 'STUDENT') || data[0];
          setCurrentUser(student);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const switchRole = (role: 'STUDENT' | 'ADMIN') => {
    const target = users.find((u) => u.role === role);
    if (target) {
      setCurrentUser(target);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        switchRole,
        refreshUsers: fetchUsers,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
