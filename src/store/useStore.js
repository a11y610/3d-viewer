import { create } from 'zustand';

export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  history: [],
  addLog: (log) => set((state) => ({ history: [log, ...state.history] })),
  setHistory: (history) => set({ history }),

  annotations: [],
  addAnnotation: (annotation) => set((state) => ({ annotations: [...state.annotations, annotation] })),
  removeAnnotation: (id) => set((state) => ({ annotations: state.annotations.filter((a) => a.id !== id) })),
  clearAnnotations: () => set({ annotations: [] }),
}));
