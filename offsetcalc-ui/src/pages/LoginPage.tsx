import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao entrar');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0eef5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm border border-gray-200">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-black font-display text-accent-600">
            Offset<span className="text-teal-500">Calc</span>
          </div>
          <p className="text-gray-500 text-sm mt-1 font-mono">Sistema de Orçamento Gráfico</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-sm focus:border-accent-600 focus:ring-2 focus:ring-accent-600/10 outline-none"
              placeholder="admin@mohr.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-sm focus:border-accent-600 focus:ring-2 focus:ring-accent-600/10 outline-none"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 font-mono">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent-600 text-white font-bold font-display uppercase tracking-wider text-sm py-3 rounded-lg shadow-md shadow-accent-600/30 hover:bg-accent-700 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
