// Portfolio store with Zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PortfolioPosition, defaultPortfolio } from './mockData';

interface PortfolioStore {
  positions: PortfolioPosition[];
  addPosition: (pos: Omit<PortfolioPosition, 'id'>) => void;
  updatePosition: (id: string, updates: Partial<PortfolioPosition>) => void;
  removePosition: (id: string) => void;
  updatePrices: (prices: Record<string, number>) => void;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set) => ({
      positions: defaultPortfolio,
      addPosition: (pos) =>
        set((state) => ({
          positions: [
            ...state.positions,
            { ...pos, id: Date.now().toString() },
          ],
        })),
      updatePosition: (id, updates) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      removePosition: (id) =>
        set((state) => ({
          positions: state.positions.filter((p) => p.id !== id),
        })),
      updatePrices: (prices) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            prices[p.ticker] ? { ...p, currentPrice: prices[p.ticker] } : p
          ),
        })),
    }),
    { name: 'alpha-edge-portfolio' }
  )
);
