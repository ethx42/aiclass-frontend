import { create } from 'zustand';
import { AiRecommendationResponse } from '@/src/types/api';

interface RecommendationsState {
  // Map of gradeId -> recommendation
  recommendations: Map<string, AiRecommendationResponse>;
  
  // Actions
  setRecommendation: (gradeId: string, recommendation: AiRecommendationResponse) => void;
  getRecommendation: (gradeId: string) => AiRecommendationResponse | undefined;
  clearRecommendations: () => void;
}

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  recommendations: new Map(),

  setRecommendation: (gradeId: string, recommendation: AiRecommendationResponse) => {
    set((state) => {
      const newMap = new Map(state.recommendations);
      newMap.set(gradeId, recommendation);
      return { recommendations: newMap };
    });
  },

  getRecommendation: (gradeId: string) => {
    return get().recommendations.get(gradeId);
  },

  clearRecommendations: () => {
    set({ recommendations: new Map() });
  },
}));

