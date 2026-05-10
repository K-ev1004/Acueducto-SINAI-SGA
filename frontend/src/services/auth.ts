const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface LoginResponse {
    access: string;
    refresh: string;
    role: string;
    username: string;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Credenciales inválidas' }));
        throw new Error(error.detail || 'Credenciales inválidas');
    }

    const data: LoginResponse = await response.json();

    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user_role', data.role);
    localStorage.setItem('username', data.username);

    return data;
};

export const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem('access_token');
};

export const getRefreshToken = (): string | null => {
    return localStorage.getItem('refresh_token');
};

export const getUserRole = (): string | null => {
    return localStorage.getItem('user_role');
};

export const getUsername = (): string | null => {
    return localStorage.getItem('username');
};

export const isAuthenticated = (): boolean => {
    return !!getAuthToken();
};

export const getAuthHeaders = (): HeadersInit => {
    const token = getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const isSuperAdmin = (): boolean => {
    return getUserRole() === 'SuperAdmin';
};

export const isAdmin = (): boolean => {
    return getUserRole() === 'Administrador' || isSuperAdmin();
};

export const isLecturista = (): boolean => {
    const role = getUserRole();
    return role === 'Lecturista' || isAdmin();
};

export const refreshAccessToken = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        logout();
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/login/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken })
        });

        if (!response.ok) {
            logout();
            return false;
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access);

        if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
        }

        return true;
    } catch {
        logout();
        return false;
    }
};