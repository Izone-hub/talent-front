import { writable } from 'svelte/store';
import { authApi } from '../api/auth';

function createAuthStore() {
    // Create a Writable store that allows both updating and reading by subscription.
    // set replace the whole state
    // update updates part of the state
    // subscribe allows components to listen to changes in the store
    const { subscribe, set, update } = writable({
        isAuthenticated: false,
        user: null,
        loading: true,
        error: null
    });

    return {
        subscribe,

        init: async () => {
            update(state => ({ ...state, loading: true }));
            try {
                const result = await authApi.checkAuth();
                console.log("Auth init checkAuth result:", result);
                set({
                    isAuthenticated: result.authenticated,
                    user: result.user,
                    loading: false,
                    error: null
                });
            } catch (error) {
                set({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: error.message
                });
            }
        },

        loginWithGithub: () => {
            authApi.githubLogin();
        },

        // New method to handle the login data from your JSON response
        handleLoginSuccess: (data) => {
            if (data.token) {
                localStorage.setItem('auth_token', data.token);
                set({
                    isAuthenticated: true,
                    user: data.user,
                    loading: false,
                    error: null
                });
                return true;
            }
            return false;
        },

        logout: async () => {
            localStorage.removeItem('auth_token');
            set({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });
            window.location.href = '/';
        },
        clearError: () => update(state => ({ ...state, error: null }))
    };
}

export const auth = createAuthStore();