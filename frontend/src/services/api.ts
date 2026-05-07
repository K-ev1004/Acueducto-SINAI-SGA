import { getAuthHeaders } from './auth';

const API_URL = 'http://127.0.0.1:8000/api';

export const obtenerSuscriptores = async () => {
    try {
        const response = await fetch(`${API_URL}/suscriptores/`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        if (!response.ok) throw new Error('Error al obtener datos');
        return await response.json();
    } catch (error) {
        console.error("Error conectando con el Cerebro:", error);
        return [];
    }
};

export const crearSuscriptor = async (nombre: string, medidor_id: string) => {
    try {
        const response = await fetch(`${API_URL}/suscriptores/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ nombre, medidor_id })
        });
        if (!response.ok) throw new Error('Error al crear suscriptor');
        return await response.json();
    } catch (error) {
        console.error("Error conectando con el Cerebro:", error);
        return null;
    }
};

export const obtenerLecturas = async () => {
    try {
        const response = await fetch(`${API_URL}/lecturas/`, {
            headers: {
                ...getAuthHeaders()
            }
        });
        if (!response.ok) throw new Error('Error al obtener lecturas');
        return await response.json();
    } catch (error) {
        console.error("Error obteniendo lecturas:", error);
        return [];
    }
};

export const registrarPago = async (medidor_id: string, monto: number) => {
    try {
        const response = await fetch(`${API_URL}/pagos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ medidor_id, monto })
        });
        if (!response.ok) throw new Error('Error al registrar pago');
        return await response.json();
    } catch (error) {
        console.error("Error registrando pago:", error);
        return null;
    }
};

export const enviarLecturaAutomatica = async (medidor_id: string, valor: number) => {
    try {
        const response = await fetch(`${API_URL}/lectura-automatica/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // El ESP32 no usa JWT por ahora, pero lo dejamos listo
            },
            body: JSON.stringify({ medidor_id, valor })
        });
        if (!response.ok) throw new Error('Error al enviar lectura');
        return await response.json();
    } catch (error) {
        console.error("Error enviando lectura al Cerebro:", error);
        return null;
    }
};
