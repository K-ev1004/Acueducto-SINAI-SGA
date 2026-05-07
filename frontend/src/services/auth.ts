const API_URL = 'http://127.0.0.1:8000/api';

export const login = async (username: string, password: string) => {
    try {
        const response = await fetch(`${API_URL}/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            throw new Error('Credenciales inválidas');
        }
        
        const data = await response.json();
        
        // Guardar token y rol en localStorage
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_role', data.role);
        localStorage.setItem('username', data.username);
        
        return data;
    } catch (error) {
        console.error("Error en login:", error);
        throw error;
    }
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
};

export const getAuthToken = () => {
    return localStorage.getItem('access_token');
};

export const getUserRole = () => {
    return localStorage.getItem('user_role');
};

export const isAuthenticated = () => {
    return !!getAuthToken();
};

export const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};
