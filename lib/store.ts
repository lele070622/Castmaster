import { create } from 'zustand'
import type { CatchRow, Coordinates, FishAnalysis, FishingSpot } from '@/lib/types/database'

export type ConditionsData = import('@/lib/marine').MarineConditions

export interface SpotCatchHistory {
  spotId: string
  catches: CatchRow[]
  loading: boolean
}

interface AppState {
  draftCoords: Coordinates | null
  logSpotOpen: boolean
  selectedSpot: FishingSpot | null
  conditions: ConditionsData | null
  conditionsLoading: boolean
  conditionsError: string | null
  spotHistory: SpotCatchHistory | null
  aiAnalysis: FishAnalysis | null
  aiResultOpen: boolean

  openLogSpot: (coords: Coordinates) => void
  closeLogSpot: () => void
  selectSpot: (spot: FishingSpot) => void
  closeSpotPanel: () => void
  setConditions: (data: ConditionsData | null) => void
  setConditionsLoading: (loading: boolean) => void
  setConditionsError: (error: string | null) => void
  setSpotHistory: (history: SpotCatchHistory | null) => void
  setAiAnalysis: (analysis: FishAnalysis | null) => void
  openAiResult: () => void
  closeAiResult: () => void
}

export const useAppStore = create<AppState>((set) => ({
  draftCoords: null,
  logSpotOpen: false,
  selectedSpot: null,
  conditions: null,
  conditionsLoading: false,
  conditionsError: null,
  spotHistory: null,
  aiAnalysis: null,
  aiResultOpen: false,

  openLogSpot: (coords) => set({ draftCoords: coords, logSpotOpen: true }),
  closeLogSpot: () => set({ logSpotOpen: false }),
  selectSpot: (spot) =>
    set({
      selectedSpot: spot,
      conditions: null,
      conditionsLoading: true,
      conditionsError: null,
      spotHistory: { spotId: spot.id, catches: [], loading: true }
    }),
  closeSpotPanel: () => set({ selectedSpot: null, conditions: null, spotHistory: null }),
  setConditions: (data) => set({ conditions: data, conditionsLoading: false }),
  setConditionsLoading: (loading) => set({ conditionsLoading: loading }),
  setConditionsError: (error) => set({ conditionsError: error, conditionsLoading: false }),
  setSpotHistory: (history) => set({ spotHistory: history }),
  setAiAnalysis: (analysis) => set({ aiAnalysis: analysis }),
  openAiResult: () => set({ aiResultOpen: true }),
  closeAiResult: () => set({ aiResultOpen: false })
}))
