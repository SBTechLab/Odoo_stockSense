import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { updateProfileApi, updatePasswordApi } from '../../api/auth.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ROLE_COLORS, ROLE_LABELS } from '../../constants/roles.js';
import { formatDateTime } from '../../utils/format.js';
import { toast } from 'sonner';
import { User, Mail, Lock, Shield, Clock } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address'),
});

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9]/;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(9, 'New password must be longer than 8 characters')
      .refine((v) => /[a-z]/.test(v), 'Password must contain at least one lowercase letter')
      .refine((v) => /[A-Z]/.test(v), 'Password must contain at least one uppercase letter')
      .refine((v) => SPECIAL_CHAR_REGEX.test(v), 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords must match',
    path: ['confirmPassword'],
  });

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  // Password Form
  const {
    register: registerPwd,
    handleSubmit: handleSubmitPwd,
    reset: resetPwdForm,
    formState: { errors: pwdErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data) => {
    setProfileLoading(true);
    try {
      await updateProfileApi(data);
      await refreshUser();
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const onUpdatePassword = async (data) => {
    setPasswordLoading(true);
    try {
      await updatePasswordApi({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPwdForm();
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal account credentials and security preferences."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'My Profile' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Account Overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardBody className="flex flex-col items-center text-center p-6">
              <div className="w-20 h-20 rounded-full bg-teal-600 text-white font-bold text-2xl flex items-center justify-center uppercase shadow-md mb-4">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{user?.name}</h3>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">
                @{user?.loginId}
              </p>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[user?.role]}`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 w-full space-y-3 text-xs text-left">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Last Login:
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatDateTime(user?.lastLoginAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Member Since:
                  </span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {formatDateTime(user?.createdAt)}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Edit Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Card */}
          <Card>
            <CardHeader
              title="Personal Information"
              subtitle="Update your display name and email address."
            />
            <CardBody>
              <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4">
                <FormField label="Full Name" error={profileErrors.name?.message} required>
                  <Input {...registerProfile('name')} icon={<User className="w-4 h-4" />} />
                </FormField>

                <FormField label="Email Address" error={profileErrors.email?.message} required>
                  <Input
                    {...registerProfile('email')}
                    type="email"
                    icon={<Mail className="w-4 h-4" />}
                  />
                </FormField>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" loading={profileLoading}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader
              title="Change Password"
              subtitle="Ensure your account is using a long, random password."
            />
            <CardBody>
              <form onSubmit={handleSubmitPwd(onUpdatePassword)} className="space-y-4">
                <FormField
                  label="Current Password"
                  error={pwdErrors.currentPassword?.message}
                  required
                >
                  <Input
                    {...registerPwd('currentPassword')}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4" />}
                  />
                </FormField>

                <FormField
                  label="New Password"
                  error={pwdErrors.newPassword?.message}
                  hint="> 8 chars, 1 uppercase, 1 lowercase, 1 special character"
                  required
                >
                  <Input
                    {...registerPwd('newPassword')}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4" />}
                  />
                </FormField>

                <FormField
                  label="Confirm New Password"
                  error={pwdErrors.confirmPassword?.message}
                  required
                >
                  <Input
                    {...registerPwd('confirmPassword')}
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4" />}
                  />
                </FormField>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" loading={passwordLoading}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
