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

export const crearSuscriptor = (data: {
    nombre: string;
    medidor_id: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    documento?: string;
    codigo_usuario?: string;
    subsidio?: number;
}) => apiFetch('/suscriptores/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerDetalleSuscriptor = (id: number) => apiFetch(`/suscriptores/${id}/`);

export const actualizarSuscriptor = (id: number, data: Partial<{
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    documento: string;
    codigo_usuario: string;
    subsidio: number;
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

export const obtenerHistorialPagos = (params?: { medidor_id?: string; mes?: number; anio?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.medidor_id) queryParams.append('medidor_id', params.medidor_id);
    if (params?.mes) queryParams.append('mes', params.mes.toString());
    if (params?.anio) queryParams.append('anio', params.anio.toString());
    const query = queryParams.toString();
    return apiFetch(`/pagos/historial/${query ? `?${query}` : ''}`);
};

export const obtenerFacturas = (params?: { estado?: string; medidor_id?: string; mes?: number; anio?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.estado) queryParams.append('estado', params.estado);
    if (params?.medidor_id) queryParams.append('medidor_id', params.medidor_id);
    if (params?.mes) queryParams.append('mes', params.mes.toString());
    if (params?.anio) queryParams.append('anio', params.anio.toString());
    const query = queryParams.toString();
    return apiFetch(`/facturas/${query ? `?${query}` : ''}`);
};

export const generarFacturas = (data: { periodo_id?: number } = {}) =>
    apiFetch('/facturas/generar/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerPeriodos = () => apiFetch('/periodos/');

export const crearPeriodo = (data: { mes: number; anio: number }) =>
    apiFetch('/periodos/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerPeriodoActual = () => apiFetch('/periodos/actual/');

export const obtenerPlanillaCobro = (params?: { periodo_id?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.periodo_id) queryParams.append('periodo_id', params.periodo_id.toString());
    const query = queryParams.toString();
    return apiFetch(`/planilla-cobro/${query ? `?${query}` : ''}`);
};

export const pagoRapido = (data: { factura_id: number; monto: number; metodo_pago?: string; tipo?: string }) =>
    apiFetch('/pagos/rapido/', { method: 'POST', body: JSON.stringify(data) });

export const obtenerDashboard = () => apiFetch('/dashboard/');

export const cortarServicio = (id: number) =>
    apiFetch(`/suscriptores/${id}/cortar/`, { method: 'POST' });

export const reconectarServicio = (id: number) =>
    apiFetch(`/suscriptores/${id}/reconectar/`, { method: 'POST' });

export const descargarPDFFactura = (id: number) => {
    const url = `${API_URL}/facturas/${id}/pdf/`;
    const headers = getAuthHeaders();
    return fetch(url, { headers }).then(async (response) => {
        if (!response.ok) throw new Error('Error al descargar PDF');
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `factura_${id}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
    });
};

export const descargarLotePDF = async (periodoId: number) => {
    const url = `${API_URL}/facturas/lote-pdf/`;
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
    };
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ periodo_id: periodoId }),
    });
    if (!response.ok) throw new Error('Error al descargar lote PDF');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `facturas_periodo_${periodoId}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
};

export const obtenerConfiguracion = () => apiFetch('/configuracion/');

export const actualizarConfiguracion = (data: Record<string, unknown>) =>
    apiFetch('/configuracion/', { method: 'PUT', body: JSON.stringify(data) });

export const enviarFacturaEmail = (id: number) =>
    apiFetch(`/facturas/${id}/enviar-email/`, { method: 'POST' });

export const descargarReciboPago = (id: number) => {
    const url = `${API_URL}/pagos/${id}/recibo-pdf/`;
    const headers = getAuthHeaders();
    return fetch(url, { headers }).then(async (response) => {
        if (!response.ok) throw new Error('Error al descargar recibo');
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `recibo_${id}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
    });
};