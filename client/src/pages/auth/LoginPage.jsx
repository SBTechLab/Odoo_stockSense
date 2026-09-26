import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ROUTES } from '../../constants/routes.js';
import { Lock, User } from 'lucide-react';

const loginSchema = z.object({
  loginId: z.string().trim().min(1, 'Login ID or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      await login(data);
      const redirect = searchParams.get('redirect') || ROUTES.DASHBOARD;
      navigate(redirect);
    } catch (err) {
      setServerError(err.message || 'Invalid Login Id or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Sign In
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Enter your login ID or registered email to access StockSense.
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 animate-in fade-in-50">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Login ID or Email" error={errors.loginId?.message} required>
          <Input
            {...register('loginId')}
            placeholder="e.g. admin01 or admin@stocksense.local"
            icon={<User className="w-4 h-4" />}
            autoFocus
          />
        </FormField>

        <FormField label="Password" error={errors.password?.message} required>
          <Input
            {...register('password')}
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
          />
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.SIGNUP}
          className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
