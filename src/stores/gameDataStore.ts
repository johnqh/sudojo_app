import { create } from 'zustand';
import type { Level, Technique } from '@sudobility/sudojo_types';
import type { NetworkClient } from '@sudobility/types';

interface GameDataState {
  // Levels
  levels: Level[];
  levelsLoading: boolean;
  levelsError: Error | null;
  levelsFetched: boolean;

  // Techniques
  techniques: Technique[];
  techniquesLoading: boolean;
  techniquesError: Error | null;
  techniquesFetched: boolean;

  // Actions
  fetchLevels: (
    networkClient: NetworkClient,
    baseUrl: string,
    token: string
  ) => Promise<void>;
  fetchTechniques: (
    networkClient: NetworkClient,
    baseUrl: string,
    token: string
  ) => Promise<void>;

  // Selectors
  getLevelById: (uuid: string) => Level | undefined;
  getTechniqueById: (uuid: string) => Technique | undefined;
}

export const useGameDataStore = create<GameDataState>((set, get) => ({
  // Initial state
  levels: [],
  levelsLoading: false,
  levelsError: null,
  levelsFetched: false,

  techniques: [],
  techniquesLoading: false,
  techniquesError: null,
  techniquesFetched: false,

  // Fetch levels (only if not already fetched)
  fetchLevels: async (networkClient, baseUrl, token) => {
    const state = get();
    if (state.levelsFetched || state.levelsLoading) {
      return;
    }

    set({ levelsLoading: true, levelsError: null });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await networkClient.get<{ data: Level[] }>(
        `${baseUrl}/api/v1/levels`,
        { headers }
      );

      if (response.ok && response.data?.data) {
        set({
          levels: response.data.data,
          levelsLoading: false,
          levelsFetched: true,
        });
      } else {
        throw new Error('Failed to fetch levels');
      }
    } catch (error) {
      set({
        levelsError: error instanceof Error ? error : new Error('Unknown error'),
        levelsLoading: false,
      });
    }
  },

  // Fetch techniques (only if not already fetched)
  fetchTechniques: async (networkClient, baseUrl, token) => {
    const state = get();
    if (state.techniquesFetched || state.techniquesLoading) {
      return;
    }

    set({ techniquesLoading: true, techniquesError: null });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await networkClient.get<{ data: Technique[] }>(
        `${baseUrl}/api/v1/techniques`,
        { headers }
      );

      if (response.ok && response.data?.data) {
        set({
          techniques: response.data.data,
          techniquesLoading: false,
          techniquesFetched: true,
        });
      } else {
        throw new Error('Failed to fetch techniques');
      }
    } catch (error) {
      set({
        techniquesError: error instanceof Error ? error : new Error('Unknown error'),
        techniquesLoading: false,
      });
    }
  },

  // Get level by ID
  getLevelById: (uuid) => {
    return get().levels.find((level) => level.uuid === uuid);
  },

  // Get technique by ID
  getTechniqueById: (uuid) => {
    return get().techniques.find((technique) => technique.uuid === uuid);
  },
}));
