import { useState } from 'react';
import { useNavigate } from 'react-router';
import { login } from '../../services/auth';
import { Droplet, Lock, User, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(username, password);
      
      // Redirect based on role
      if (data.role === 'Lecturista') {
        navigate('/lecturista');
      } else {
        navigate('/admin'); // Admin and SuperAdmin go to the same dashboard for now
      }
    } catch (err) {
      setError('Usuario o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sinai-bg flex items-center justify-center relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sinai-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10 px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 p-8 sm:p-10">
          
          <div className="flex flex-col items-center mb-8">
            <div className="bg-sinai-section p-4 rounded-2xl mb-4 text-sinai-primary shadow-sm">
              <Droplet size={36} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold text-sinai-text tracking-tight">Sinai SGA</h1>
            <p className="text-gray-500 mt-2 font-medium">Sistema de Gestión de Acueducto</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-sinai-alert border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sinai-text focus:outline-none focus:ring-2 focus:ring-sinai-primary/30 focus:border-sinai-primary transition-all"
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-sinai-text focus:outline-none focus:ring-2 focus:ring-sinai-primary/30 focus:border-sinai-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-sinai-primary hover:bg-blue-600 text-white font-semibold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>
          
        </div>
        
        <p className="text-center text-gray-400 text-sm mt-8 font-medium">
          &copy; {new Date().getFullYear()} Sinai SGA. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
