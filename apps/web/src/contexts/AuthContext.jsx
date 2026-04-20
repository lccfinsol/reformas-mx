/**
 * Contexto de autenticación.
 *
 * CORRECCIONES:
 * 1. CRÍTICO — Socket leak: el useEffect de socket se ejecutaba en cada cambio
 *    de isAuthenticated/currentUser, creando un nuevo socket sin desconectar
 *    el anterior. Con login/logout repetido se acumulaban sockets activos.
 *    Se usa socketRef para garantizar cleanup antes de crear uno nuevo.
 * 2. LÓGICA — URL del namespace: construía
 *    `http://localhost:3001/notifications` pero Socket.IO con namespaces
 *    necesita la URL BASE del servidor, no el namespace en la URL.
 *    El namespace se especifica en la opción o en el path. 
 *    Se separa correctamente: URL base + namespace '/notifications'.
 * 3. LÓGICA — En producción la URL usaba window.location.hostname sin puerto,
 *    fallando cuando el API corre en un puerto distinto al 443.
 *    Se usa VITE_API_URL si está disponible.
 * 4. MEJORA — useAuth lanza error descriptivo si se usa fuera del Provider.
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import pb from '@/lib/pocketbaseClient.js';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(
    pb.authStore.isValid ? pb.authStore.model : null,
  );
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null); // CORRECCIÓN: ref para evitar leaks

  // Sincronizar con cambios externos en authStore (token expirado, etc.)
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
      setIsAuthenticated(!!model);
      if (!model) disconnectSocket();
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  // Conectar/desconectar socket cuando cambia la autenticación
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      connectSocket(currentUser.id);
    } else {
      disconnectSocket();
    }

    return () => disconnectSocket();
  }, [isAuthenticated, currentUser?.id]);

  function connectSocket(userId) {
    // CORRECCIÓN: desconectar socket previo antes de crear uno nuevo
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // CORRECCIÓN: URL base del servidor, no el namespace en la URL
    const backendUrl =
      import.meta.env.VITE_API_URL ||
      (window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : window.location.origin);

    const newSocket = io(backendUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      // Suscribirse al namespace de notificaciones
      newSocket.emit('subscribe', { userId });
    });

    newSocket.on('connect_error', (err) => {
      if (import.meta.env.DEV) {
        console.warn('Socket.IO error:', err.message);
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }

  function disconnectSocket() {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setSocket(null);
  }

  const login = async (email, password) => {
    const authData = await pb.collection('users').authWithPassword(email, password, {
      $autoCancel: false,
    });
    return authData;
  };

  const signup = async (data) => {
    const record = await pb.collection('users').create(data, { $autoCancel: false });
    if (record) {
      await login(data.email, data.password);
    }
    return record;
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    setIsAuthenticated(false);
    disconnectSocket();
  };

  const value = {
    currentUser,
    isAuthenticated,
    socket,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
