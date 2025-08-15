import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import config from '../../config/config';
import { clearPaymentSession } from '../../utils/clearPaymentSession';

// Acción asincrónica para iniciar sesión
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ cedula, password }, { rejectWithValue }) => {
    try {
      // Usar la URL de la API desde la configuración
      const apiUrl = `${config[config.environment].API_EGOB_URL}/it/rest/autenticacion/login`;
      
      const response = await axios.post(apiUrl, {
        cedula,
        password
      });
      
      // La API devuelve directamente los datos del usuario al ser exitoso
      return response.data;
    } catch (error) {
      // Si hay un error, devolvemos el mensaje para manejarlo en el reducer
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ mensaje: 'Error de conexión. Inténtelo más tarde.' });
    }
  }
);

// Acción asincrónica para obtener la lista de formularios
export const fetchFormularios = createAsyncThunk(
  'auth/fetchFormularios',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const apiUrl = `${config[config.environment].API_EGOB_URL}/it/rest/formularios/ListaFormularios`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      }
      return rejectWithValue({ mensaje: 'Error al cargar los formularios.' });
    }
  }
);

// Slice para autenticación
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    loading: false,
    error: null,
    formularios: [],
    formularioLoading: false,
    formularioError: null
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.formularios = [];
      // Eliminar credenciales del almacenamiento local
      if (typeof window !== 'undefined') {
        clearPaymentSession();
        localStorage.removeItem('auth');
      }
    },
    clearErrors: (state) => {
      state.error = null;
      state.formularioError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login actions
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        // Guardar la información del usuario según la estructura de respuesta
        state.user = {
          id: action.payload.id,
          cedula: action.payload.cedula,
          nombre: action.payload.nombre,
          apellido: action.payload.apellido,
          email: action.payload.email,
          telefono: action.payload.telefono,
          celular: action.payload.celular,
          direccion: action.payload.direccion
        };
        
        /* 
        Nota: Según la respuesta de ejemplo, no se recibe un token explícito.
        Por ahora usamos un token simulado para demostración, pero en una implementación
        real se debe extraer el token de la respuesta o usar algún mecanismo de autenticación.
        */
        state.token = 'simulated-token'; // En producción, debes obtener el token real de la respuesta

        // Guardar credenciales en el almacenamiento local
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'auth',
            JSON.stringify({ user: state.user, token: state.token })
          );
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.mensaje || 'Error al iniciar sesión';
      })
      
      // Fetch formularios actions
      .addCase(fetchFormularios.pending, (state) => {
        state.formularioLoading = true;
        state.formularioError = null;
      })
      .addCase(fetchFormularios.fulfilled, (state, action) => {
        state.formularioLoading = false;
        state.formularios = action.payload;
      })
      .addCase(fetchFormularios.rejected, (state, action) => {
        state.formularioLoading = false;
        state.formularioError = action.payload?.mensaje || 'Error al cargar los formularios';
      });
  }
});

export const { logout, clearErrors } = authSlice.actions;
export default authSlice.reducer;
