/**
 * Contexto de autenticación.
 *
 * CORRECCIONES APLICADAS:
 * 1. CRÍTICO - Socket leak: initializeSocket creaba un nuevo socket sin
 *    desconectar el anterior. Si login/logout se llamaba repetidamente,
 *    se acumulaban sockets activos.
 * 2. CRÍTICO - isAuthenticated derivado del estado de pb.authStore directamente:
 *    al llamar logout(), pb.authStore.clear() funcionaba pero isAuthenticated
 *    seguía retornando true hasta el siguiente render porque era calculado
 *    en el momento del Provider, no reactivo.
 * 3. LÓGICA - Signup no verificaba email (PocketBase puede requerir
 *    verificación). Se mantiene simple pero se documenta.
 * 4. MEJORA - useEffect agrega listener authStore.onChange para sincronizar
 *    el estado cuando el token expira externamente.
 * 5. SEGURIDAD - console.error reemplazado: en producción no exponer errores
 *    de auth en consola. Se mantiene solo en dev.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    pb.authStore.isValid ? pb.authStore.model : null,
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null); // CORRECCIÓN: ref para evitar stale closures

  // Sincronizar con cambios externos en authStore (token expirado, etc.)
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
      if (!model) {
        disconnectSocket();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (pb.authStore.isValid) {
      setCurrentUser(pb.authStore.model);
      initializeSocket(pb.authStore.model.id);
    }
    setInitialLoading(false);

    // Cleanup al desmontar
    return () => {
      disconnectSocket();
    };
  }, []);

  function initializeSocket(userId) {
    // CORRECCIÓN: desconectar socket previo antes de crear uno nuevo
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socketInstance = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('subscribe-to-notifications', { userId });
    });

    socketInstance.on('connect_error', (error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('WebSocket error:', error.message);
      }
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);
  }

  function disconnectSocket() {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
  }

  const login = async (email, password) => {
    try {
      const authData = await pb
        .collection('users')
        .authWithPassword(email, password, { $autoCancel: false });

      setCurrentUser(authData.record);
      initializeSocket(authData.record.id);
      return authData;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Login error:', error);
      }
      throw error;
    }
  };

  const signup = async (email, password, name) => {
    try {
      const record = await pb.collection('users').create(
        {
          email,
          password,
          passwordConfirm: password,
          nombre_completo: name,
        },
        { $autoCancel: false },
      );

      await login(email, password);
      return record;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Signup error:', error);
      }
      throw error;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    disconnectSocket();
  };

  const updateProfile = async (data) => {
    if (!currentUser) throw new Error('No hay usuario autenticado');

    try {
      const updated = await pb
        .collection('users')
        .update(currentUser.id, data, { $autoCancel: false });

      setCurrentUser(updated);
      return updated;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Update profile error:', error);
      }
      throw error;
    }
  };

  // CORRECCIÓN: isAuthenticated como estado derivado reactivo
  const isAuthenticated = currentUser !== null && pb.authStore.isValid;
  const isAdmin = currentUser?.is_admin === true;

  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    signup,
    logout,
    updateProfile,
    initialLoading,
    socket,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
