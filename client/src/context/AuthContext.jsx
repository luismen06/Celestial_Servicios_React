import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [cargando, setCargando] = useState(true);

    // Verificar sesión al montar (si hay token guardado)
    useEffect(() => {
        const verificar = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setCargando(false);
                return;
            }
            try {
                const data = await authService.verificarSesion();
                setUsuario(data.usuario);
                setIsAuthenticated(true);
            } catch (error) {
                // Token inválido o expirado
                localStorage.removeItem('token');
            } finally {
                setCargando(false);
            }
        };
        verificar();
    }, []);

    const login = async (username, password) => {
        const data = await authService.login(username, password);
        localStorage.setItem('token', data.token);
        setUsuario(data.usuario);
        setIsAuthenticated(true);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUsuario(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ usuario, isAuthenticated, cargando, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
