import { create } from 'zustand';

interface UiState {
    headerHeight: number;
    setHeaderHeight: (height: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
    headerHeight: 0,
    setHeaderHeight: (height) => set({ headerHeight: height }),
}));
