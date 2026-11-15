'use client';
// app/(admin)/admin/users/page.tsx — standalone version of user management
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users-page', search, roleFilter],
    queryFn: () => adminApi.users({ search, role: roleFilter, per_page: 25 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.updateUserStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users-page'] }); toast.success('Updated'); },
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.updateUserRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users-page'] }); toast.success('Role updated'); },
  });

  return (
    <div>
      <h1 className="text-2xl font-display font-bold mb-6">User Management</h1>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(data?.data ?? []).map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select value={user.role} onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value })}
                    className="text-xs px-2 py-1 rounded-lg border border-border bg-background capitalize">
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-red-100 text-red-700 dark:bg-red-950'
                  }`}>{user.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => updateStatus.mutate({ id: user.id, status: user.status === 'active' ? 'suspended' : 'active' })}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                      user.status === 'active' ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                    }`}>
                    {user.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && (data?.data ?? []).length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No users found</div>
        )}
      </div>
    </div>
  );
}
