import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface UserStore {
  currentUser: User;
  users: User[];
  setCurrentUser: (userId: string) => void;
}

// Mock users
const mockUsers: User[] = [
  { id: 'userA', name: 'Alice', email: 'alice@example.com' },
  { id: 'userB', name: 'Bob', email: 'bob@example.com' },
  { id: 'userC', name: 'Charlie', email: 'charlie@example.com' },
];

export const useUserStore = create<UserStore>((set) => ({
  currentUser: mockUsers[0], // Default to userA
  users: mockUsers,
  setCurrentUser: (userId: string) =>
    set((state) => {
      const user = state.users.find((u) => u.id === userId);
      if (user) {
        return { currentUser: user };
      }
      return state;
    }),
}));
