import { getAuthHeaders } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
        throw new Error(error.error || error.detail || 'Error en la solicitud');
    }
    return response.json();
};

export const apiFetch = async (
    endpoint: string,
    options: RequestInit = {}
): Promise<any> => {
    const url = `${API_URL}${endpoint}`;

    const config: RequestInit = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers,
        },
    };

    const response = await fetch(url, config);
    return handleResponse(response);
};

export const obtenerSuscriptores = () => apiFetch('/suscriptores/');

export const crearSuscriptor = (data: { nombre: string; medidor_id: string; direccion?: string }) =>
    apiFetch('/suscriptores/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerDetalleSuscriptor = (id: number) => apiFetch(`/suscriptores/${id}/`);

export const actualizarSuscriptor = (id: number, data: Partial<{
    nombre: string;
    direccion: string;
    estado_servicio: string;
}>) => apiFetch(`/suscriptores/${id}/`, { method: 'PUT', body: JSON.stringify(data) });

export const registrarLectura = (data: { medidor_id: string; valor: number }) =>
    apiFetch('/lecturas/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerHistorialLecturas = (params?: { mes?: number; anio?: number; medidor_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.mes) queryParams.append('mes', params.mes.toString());
    if (params?.anio) queryParams.append('anio', params.anio.toString());
    if (params?.medidor_id) queryParams.append('medidor_id', params.medidor_id);
    const query = queryParams.toString();
    return apiFetch(`/lecturas/historial/${query ? `?${query}` : ''}`);
};

export const registrarPago = (data: {
    medidor_id: string;
    monto: number;
    tipo?: 'PAGO' | 'ABONO';
    metodo_pago?: string;
    comentario?: string;
    factura_id?: number;
}) => apiFetch('/pagos/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerHistorialPagos = (params?: { medidor_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.medidor_id) queryParams.append('medidor_id', params.medidor_id);
    const query = queryParams.toString();
    return apiFetch(`/pagos/historial/${query ? `?${query}` : ''}`);
};

export const obtenerFacturas = (params?: { estado?: string; medidor_id?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.estado) queryParams.append('estado', params.estado);
    if (params?.medidor_id) queryParams.append('medidor_id', params.medidor_id);
    const query = queryParams.toString();
    return apiFetch(`/facturas/${query ? `?${query}` : ''}`);
};

export const generarFacturas = (data: { mes: number; anio: number; tarifa?: number }) =>
    apiFetch('/facturas/generar/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerPeriodos = () => apiFetch('/periodos/');

export const crearPeriodo = (data: { mes: number; anio: number }) =>
    apiFetch('/periodos/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerDashboard = () => apiFetch('/dashboard/');

export const cortarServicio = (id: number) =>
    apiFetch(`/suscriptores/${id}/cortar/`, { method: 'POST' });

export const reconectarServicio = (id: number) =>
    apiFetch(`/suscriptores/${id}/reconectar/`, { method: 'POST' });