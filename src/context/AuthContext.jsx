import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await loginUser({ email, password });

            // Backend returns: { status: 'ok', data: { user, token } }
            const payload = response?.data ?? response;
            const { token, user } = payload?.data ? payload.data : payload;

            setToken(token);
            setUser(user);

            localStorage.setItem('authToken', token);
            localStorage.setItem('authUser', JSON.stringify(user));

            // Also set the legacy auth flag for compatibility
            localStorage.setItem('fleetMonitorAuth', 'true');

            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('fleetMonitorAuth');
    };

    const value = {
        user,
        token,
        isAuthenticated: !!token,
        role: user?.role,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
