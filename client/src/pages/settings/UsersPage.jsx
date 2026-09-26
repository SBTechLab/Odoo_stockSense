import { useState } from 'react';
import { listUsersApi, updateUserApi } from '../../api/users.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../components/ui/ErrorState.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { FormField } from '../../components/ui/FormField.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { SearchInput } from '../../components/ui/SearchInput.jsx';
import { ROLE_COLORS, ROLE_LABELS } from '../../constants/roles.js';
import { formatDateTime } from '../../utils/format.js';
import { Shield, ShieldAlert, UserCheck, UserX, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('STAFF');
  const [toggleTarget, setToggleTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    data: users = [],
    loading,
    error,
    refetch,
  } = useFetch(
    () =>
      listUsersApi({
        search,
        role: roleFilter || undefined,
      }),
    [search, roleFilter]
  );

  const handleOpenEditRole = (u) => {
    if (u.id === currentUser?.id) {
      toast.error('You cannot change your own administrative role.');
      return;
    }
    setEditingUser(u);
    setSelectedRole(u.role);
  };

  const handleSaveRole = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      await updateUserApi(editingUser.id, { role: selectedRole });
      toast.success(`Role for ${editingUser.name} updated to ${selectedRole}`);
      setEditingUser(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    setActionLoading(true);
    try {
      const nextStatus = !toggleTarget.isActive;
      await updateUserApi(toggleTarget.id, { isActive: nextStatus });
      toast.success(
        `User ${toggleTarget.name} has been ${nextStatus ? 'activated' : 'deactivated'}`
      );
      setToggleTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User Name',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs uppercase shrink-0">
            {u.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <span>{u.name}</span>
              {u.id === currentUser?.id && (
                <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold px-1.5 py-0.2 rounded">
                  YOU
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-zinc-500">@{u.loginId}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="text-xs text-zinc-600 dark:text-zinc-300">{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      className: 'w-36',
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[u.role]}`}
        >
          <Shield className="w-3 h-3" />
          {ROLE_LABELS[u.role] || u.role}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      className: 'w-28',
      render: (u) => (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${
            u.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}
          />
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (u) => (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatDateTime(u.lastLoginAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      render: (u) => {
        const isSelf = u.id === currentUser?.id;
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              disabled={isSelf}
              onClick={() => handleOpenEditRole(u)}
              title={isSelf ? 'Cannot edit own role' : 'Change role'}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isSelf}
              onClick={() => setToggleTarget(u)}
              title={
                isSelf
                  ? 'Cannot deactivate yourself'
                  : u.isActive
                  ? 'Deactivate user'
                  : 'Activate user'
              }
              className={`p-1.5 rounded-lg text-zinc-500 disabled:opacity-30 disabled:pointer-events-none ${
                u.isActive
                  ? 'hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  : 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
              }`}
            >
              {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage team members, roles, and administrative permissions."
        breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Settings' }, { label: 'Users' }]}
      />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search users by name, email, or login ID..."
          className="w-80"
        />

        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Administrator</option>
          <option value="MANAGER">Inventory Manager</option>
          <option value="STAFF">Warehouse Staff</option>
        </Select>
      </div>

      {error ? (
        <ErrorState
          title="Failed to load users"
          message={error.message || 'Could not retrieve user records.'}
          onRetry={refetch}
        />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          emptyState={
            <EmptyState
              icon={<Shield className="w-8 h-8 text-zinc-400" />}
              title="No users found"
              description={
                search || roleFilter
                  ? 'No users match your search criteria. Try a different query.'
                  : 'No users registered in the system.'
              }
            />
          }
        />
      )}

      {/* Edit Role Modal */}
      <Modal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={`Change Role: ${editingUser?.name}`}
        description="Select new access level for this user."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRole} loading={actionLoading}>
              Save Role
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Assigned Role">
            <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
              <option value="STAFF">Warehouse Staff (Operations, Counts)</option>
              <option value="MANAGER">Inventory Manager (All ops & catalog)</option>
              <option value="ADMIN">Administrator (Full System Access)</option>
            </Select>
          </FormField>
        </div>
      </Modal>

      {/* Toggle Active Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        onConfirm={handleToggleActive}
        loading={actionLoading}
        isDanger={toggleTarget?.isActive}
        title={toggleTarget?.isActive ? 'Deactivate User Account' : 'Reactivate User Account'}
        message={
          toggleTarget?.isActive
            ? `Are you sure you want to deactivate "${toggleTarget?.name}"? They will be immediately blocked from signing in.`
            : `Are you sure you want to reactivate "${toggleTarget?.name}"? Their access will be restored immediately.`
        }
        confirmText={toggleTarget?.isActive ? 'Deactivate' : 'Activate'}
      />
    </div>
  );
}
