import { Routes, Route, Navigate } from 'react-router';
import ModuloLecturista from './components/ModuloLecturista';
import ModuloAdministrador from './components/ModuloAdministrador';
import Login from './components/Login';
import { isAuthenticated, getUserRole } from '../services/auth';

// Componente para proteger rutas según el rol
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles: string[] }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = getUserRole();
  if (role && !allowedRoles.includes(role)) {
    // Si no tiene el rol, mandarlo a su módulo correcto
    if (role === 'Lecturista') return <Navigate to="/lecturista" replace />;
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route 
        path="/lecturista" 
        element={
          <ProtectedRoute allowedRoles={['Lecturista']}>
            <ModuloLecturista />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['Administrador', 'SuperAdmin']}>
            <ModuloAdministrador />
          </ProtectedRoute>
        } 
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}