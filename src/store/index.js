import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

// Cargar estado persistido de localStorage si existe
const persistedAuth =
  typeof window !== 'undefined' ? localStorage.getItem('auth') : null;
const authData = persistedAuth ? JSON.parse(persistedAuth) : null;

const preloadedState = authData
  ? {
      auth: {
        ...authData,
        loading: false,
        error: null,
        formularios: [],
        formularioLoading: false,
        formularioError: null
      }
    }
  : undefined;

const store = configureStore({
  reducer: {
    auth: authReducer
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
