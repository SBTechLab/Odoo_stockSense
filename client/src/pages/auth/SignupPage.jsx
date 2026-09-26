import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ROUTES } from '../../constants/routes.js';
import { User, Mail, Lock, UserCheck, Eye, EyeOff, Check, XCircle } from 'lucide-react';
import clsx from 'clsx';

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'Full name is required').max(100),
    loginId: z
      .string()
      .trim()
      .min(6, 'Login ID must be at least 6 characters')
      .max(12, 'Login ID must be at most 12 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Login ID may only contain letters, numbers, hyphens, and underscores'),
    email: z.string().trim().email('Invalid email address'),
    password: z
      .string()
      .min(9, 'Password must be longer than 8 characters')
      .refine((v) => /[a-z]/.test(v), 'Password must contain at least one lowercase letter')
      .refine((v) => /[A-Z]/.test(v), 'Password must contain at least one uppercase letter')
      .refine((v) => SPECIAL_CHAR_REGEX.test(v), 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please re-enter your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Re-entered password must match',
    path: ['confirmPassword'],
  });

export function SignupPage() {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password') || '';

  const passwordChecks = [
    { label: 'Longer than 8 characters', met: passwordValue.length > 8 },
    { label: 'At least one lowercase letter', met: /[a-z]/.test(passwordValue) },
    { label: 'At least one uppercase letter', met: /[A-Z]/.test(passwordValue) },
    { label: 'At least one special character', met: SPECIAL_CHAR_REGEX.test(passwordValue) },
  ];

  const onSubmit = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      await registerAuth({
        name: data.name,
        loginId: data.loginId,
        email: data.email,
        password: data.password,
      });
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      setServerError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Create Account
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Join StockSense to manage warehouses and operations.
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 animate-in fade-in-50">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Full Name" error={errors.name?.message} required>
          <Input
            {...register('name')}
            placeholder="e.g. Smit Bhalani"
            icon={<User className="w-4 h-4" />}
            autoFocus
          />
        </FormField>

        <FormField
          label="Login ID"
          error={errors.loginId?.message}
          hint="6–12 characters (letters, numbers, hyphens)"
          required
        >
          <Input
            {...register('loginId')}
            placeholder="e.g. smit01"
            icon={<UserCheck className="w-4 h-4" />}
          />
        </FormField>

        <FormField label="Email" error={errors.email?.message} required>
          <Input
            {...register('email')}
            type="email"
            placeholder="name@company.com"
            icon={<Mail className="w-4 h-4" />}
          />
        </FormField>

        <FormField
          label="Password"
          error={errors.password?.message}
          required
        >
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            iconRight={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </FormField>

        {/* Live 4-Point Requirement Checklist */}
        <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2">
          <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Password Requirements
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {passwordChecks.map((chk, i) => (
              <div
                key={i}
                className={clsx(
                  'flex items-center gap-2 transition-colors',
                  chk.met
                    ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'text-zinc-400 dark:text-zinc-500'
                )}
              >
                {chk.met ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                  </span>
                )}
                <span className="text-[11px] leading-tight">{chk.label}</span>
              </div>
            ))}
          </div>
        </div>

        <FormField label="Confirm Password" error={errors.confirmPassword?.message} required>
          <Input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            iconRight={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </FormField>

        <Button type="submit" variant="primary" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-semibold text-teal-600 dark:text-teal-400 hover:underline"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
