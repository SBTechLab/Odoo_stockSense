import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router';
import { forgotPasswordApi, verifyOtpApi, resetPasswordApi } from '../../api/auth.js';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ROUTES } from '../../constants/routes.js';
import { Mail, Lock, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const passwordSchema = z
  .object({
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

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);

  const otpInputRefs = useRef([]);

  // Resend cooldown timer for Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Step 1: Send OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setServerError('Please enter your email address');
      return;
    }
    setServerError('');
    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setStep(2);
      setResendCooldown(60);
      toast.success('If an account matches, a 6-digit OTP has been issued.');
    } catch (err) {
      setServerError(err.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle OTP input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setServerError('Please enter all 6 digits of the OTP');
      return;
    }
    setServerError('');
    setLoading(true);
    try {
      const res = await verifyOtpApi(email, otpCode);
      setResetToken(res.data.resetToken);
      setStep(3);
      toast.success('OTP verified successfully');
    } catch (err) {
      setServerError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setServerError('');
    setLoading(true);
    try {
      await forgotPasswordApi(email);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      toast.success('A new 6-digit OTP has been issued');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setServerError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: New Password form
  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    formState: { errors: pwdErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const handleResetPassword = async (data) => {
    setServerError('');
    setLoading(true);
    try {
      await resetPasswordApi(resetToken, data.password);
      toast.success('Password updated successfully! Please log in.');
      navigate(ROUTES.LOGIN);
    } catch (err) {
      setServerError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Enter 6-Digit OTP'}
          {step === 3 && 'Set New Password'}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          {step === 1 && 'Enter your email to receive a password reset code.'}
          {step === 2 && `Enter the OTP sent for ${email}. (Check server console if SMTP is unconfigured)`}
          {step === 3 && 'Choose a strong new password meeting all security rules.'}
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-700 dark:text-rose-300 animate-in fade-in-50">
          {serverError}
        </div>
      )}

      {/* STEP 1: Email Form */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <FormField label="Registered Email Address" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@stocksense.local"
              icon={<Mail className="w-4 h-4" />}
              autoFocus
            />
          </FormField>

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Send Reset Code
          </Button>
        </form>
      )}

      {/* STEP 2: 6-Box OTP Form */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="flex justify-center gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpInputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="w-11 h-12 text-center text-lg font-mono font-bold rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-zinc-900 dark:text-zinc-100"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Didn&apos;t get the code?</span>
            <button
              type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={handleResendOtp}
              className="font-medium text-teal-600 dark:text-teal-400 hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStep(1);
                setServerError('');
              }}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            <Button type="submit" variant="primary" loading={loading} className="flex-1">
              Verify Code
            </Button>
          </div>
        </form>
      )}

      {/* STEP 3: Reset Password Form */}
      {step === 3 && (
        <form onSubmit={handleSubmitPwd(handleResetPassword)} className="space-y-4">
          <FormField
            label="New Password"
            error={pwdErrors.password?.message}
            hint="> 8 chars, 1 uppercase, 1 lowercase, 1 special character"
            required
          >
            <Input
              {...registerPwd('password')}
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              autoFocus
            />
          </FormField>

          <FormField label="Confirm New Password" error={pwdErrors.confirmPassword?.message} required>
            <Input
              {...registerPwd('confirmPassword')}
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
            />
          </FormField>

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Save New Password
          </Button>
        </form>
      )}

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Remember your password?{' '}
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
