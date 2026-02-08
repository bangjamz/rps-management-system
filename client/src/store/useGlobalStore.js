import { create } from 'zustand';
import axios from '../lib/axios';

const useGlobalStore = create((set, get) => ({
    settings: null,
    isLoading: false,
    error: null,

    // Fetch settings from API
    fetchSettings: async () => {
        set({ isLoading: true });
        try {
            const response = await axios.get('/settings');
            const data = response.data;

            // Apply theme colors immediately
            if (data.color_palette) {
                get().applyTheme(data.color_palette);
            }

            set({ settings: data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch global settings:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    // Apply CSS variables
    applyTheme: (palette) => {
        const root = document.documentElement;
        if (!palette) return;

        if (palette.primary) root.style.setProperty('--color-primary', palette.primary);
        if (palette.secondary) root.style.setProperty('--color-secondary', palette.secondary);
        if (palette.accent) root.style.setProperty('--color-accent', palette.accent);

        // You might need to generate shades if your tailwind config uses them
        // For now, we assume simple overrides or mapped vars
    },

    // Optimistic update
    updateSettingsLocally: (newSettings) => {
        set(state => {
            const updated = { ...state.settings, ...newSettings };
            if (newSettings.color_palette) {
                get().applyTheme(newSettings.color_palette);
            }
            return { settings: updated };
        });
    }
}));

export default useGlobalStore;
