'use client';

import { useMemo, useState } from 'react';
import AdminHeader from '../../../components/AdminHeader';
import MatrixBackground from '../../../components/MatrixBackground';
import ProtectedRoute from '../../../components/ProtectedRoute';

type Role = 'admin' | 'user';

type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  registeredAt: string; // ISO
  status: 'active' | 'suspended';
};

// Generate mock data
const mockUsers: User[] = Array.from({ length: 137 }).map((_, i) => {
  const isAdmin = i % 11 === 0;
  const status = i % 9 === 0 ? 'suspended' : 'active';
  const date = new Date();
  date.setDate(date.getDate() - i);
  return {
    id: String(i + 1),
    username: `user${i + 1}`,
    name: isAdmin ? `Admin ${i + 1}` : `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: isAdmin ? 'admin' : 'user',
    registeredAt: date.toISOString(),
    status,
  };
});

const headers = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'registeredAt', label: 'Registered' },
  { key: 'status', label: 'Status' },
];

type SortKey = 'username' | 'name' | 'email' | 'registeredAt';

type Filters = {
  query: string;
  role: 'all' | Role;
  status: 'all' | 'active' | 'suspended';
  dateFrom?: string;
  dateTo?: string;
};

export default function ManageUsersPage() {
  const [filters, setFilters] = useState<Filters>({ query: '', role: 'all', status: 'all' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'registeredAt', dir: 'desc' });

  const filtered = useMemo(() => {
    let list = [...mockUsers];

    // Search query filter (username, name, email)
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      list = list.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    if (filters.role !== 'all') list = list.filter(u => u.role === filters.role);
    if (filters.status !== 'all') list = list.filter(u => u.status === filters.status);

    if (filters.dateFrom) {
      list = list.filter(u => new Date(u.registeredAt) >= new Date(filters.dateFrom!));
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter(u => new Date(u.registeredAt) <= to);
    }

    // Sort
    list.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const get = (u: User): string | number => {
        switch (sort.key) {
          case 'username': return u.username.toLowerCase();
          case 'name': return u.name.toLowerCase();
          case 'email': return u.email.toLowerCase();
          case 'registeredAt': return new Date(u.registeredAt).getTime();
        }
      };
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });

    return list;
  }, [filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  const toggleSort = (key: SortKey) => {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({ role: 'user', status: 'active' });

  const addUser = () => {
    if (!newUser.username || !newUser.email || !newUser.name) return;
    mockUsers.unshift({
      id: String(mockUsers.length + 1),
      username: newUser.username!,
      name: newUser.name!,
      email: newUser.email!,
      role: (newUser.role as Role) || 'user',
      registeredAt: new Date().toISOString(),
      status: (newUser.status as 'active' | 'suspended') || 'active',
    });
    setShowCreate(false);
    setNewUser({ role: 'user', status: 'active' });
  };

  const toggleStatus = (id: string) => {
    const u = mockUsers.find(u => u.id === id);
    if (u) u.status = u.status === 'active' ? 'suspended' : 'active';
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <MatrixBackground />
        <AdminHeader />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          {/* Filters */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 w-full">
            <input
              placeholder="Search username, name or email"
              value={filters.query}
              onChange={(e) => { setPage(1); setFilters({ ...filters, query: e.target.value }); }}
              className="col-span-2 lg:col-span-2 bg-gray-900/80 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400 placeholder-gray-500"
            />
            <select
              value={filters.role}
              onChange={(e) => { setPage(1); setFilters({ ...filters, role: e.target.value as Filters['role'] }); }}
              className="bg-gray-900/80 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value as Filters['status'] }); }}
              className="bg-gray-900/80 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => { setPage(1); setFilters({ ...filters, dateFrom: e.target.value }); }}
              className="bg-gray-900/80 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => { setPage(1); setFilters({ ...filters, dateTo: e.target.value }); }}
              className="bg-gray-900/80 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value)); }}
              className="bg-gray-900/80 border border-green-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-green-400"
            >
              {[10, 20, 50].map(n => (<option key={n} value={n}>{n}/page</option>))}
            </select>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              + New User
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-gray-900/60 backdrop-blur-sm border border-green-500/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-900/80 text-green-300">
                  {headers.map(h => (
                    <th key={h.key} className="px-4 py-3 text-left whitespace-nowrap">
                      <button
                        className={`flex items-center gap-1 ${['username','email','name','registeredAt'].includes(h.key) ? 'hover:text-green-200' : ''}`}
                        onClick={() => ['username','email','name','registeredAt'].includes(h.key) && toggleSort(h.key as SortKey)}
                      >
                        {h.label}
                        {(['username','email','name','registeredAt'] as SortKey[]).includes(h.key as SortKey) && (
                          <span className="text-xs opacity-70">
                            {sort.key === h.key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(u => (
                  <tr key={u.id} className="border-t border-green-500/10 hover:bg-gray-800/40">
                    <td className="px-4 py-3 font-mono text-green-300">{u.username}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3 text-gray-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(u.registeredAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${u.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleStatus(u.id)}
                          className={`px-3 py-1 rounded text-xs border ${u.status === 'active' ? 'border-red-500/40 text-red-300 hover:bg-red-500/10' : 'border-green-500/40 text-green-300 hover:bg-green-500/10'}`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button className="px-3 py-1 rounded text-xs border border-gray-500/40 text-gray-300 hover:bg-gray-700/40">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paged.length === 0 && (
                  <tr>
                    <td className="px-4 py-10 text-center text-gray-400" colSpan={headers.length + 1}>
                      No users found for current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-green-500/20 bg-gray-900/70">
            <div className="text-xs text-gray-400">
              Showing <span className="text-green-300">{start + 1}</span> - <span className="text-green-300">{Math.min(filtered.length, start + pageSize)}</span>
              {' '}of <span className="text-green-300">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-green-500/30 text-green-300 disabled:opacity-40 hover:bg-gray-800/60"
              >⏮</button>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border border-green-500/30 text-green-300 disabled:opacity-40 hover:bg-gray-800/60"
              >Prev</button>
              <span className="text-sm text-gray-300">Page {currentPage} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-green-500/30 text-green-300 disabled:opacity-40 hover:bg-gray-800/60"
              >Next</button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border border-green-500/30 text-green-300 disabled:opacity-40 hover:bg-gray-800/60"
              >⏭</button>
            </div>
          </div>
        </div>
      </div>

      {/* Create user modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70">
          <div className="w-full max-w-lg bg-gray-900 border border-green-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4">Create New User</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input placeholder="Username" className="bg-gray-800 border border-green-500/30 rounded px-3 py-2 text-sm" onChange={(e)=>setNewUser({...newUser, username:e.target.value})} />
              <input placeholder="Full Name" className="bg-gray-800 border border-green-500/30 rounded px-3 py-2 text-sm" onChange={(e)=>setNewUser({...newUser, name:e.target.value})} />
              <input placeholder="Email" type="email" className="bg-gray-800 border border-green-500/30 rounded px-3 py-2 text-sm" onChange={(e)=>setNewUser({...newUser, email:e.target.value})} />
              <select className="bg-gray-800 border border-green-500/30 rounded px-3 py-2 text-sm" defaultValue={newUser.role} onChange={(e)=>setNewUser({...newUser, role: e.target.value as Role})}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <select className="bg-gray-800 border border-green-500/30 rounded px-3 py-2 text-sm" defaultValue={newUser.status} onChange={(e)=>setNewUser({...newUser, status: e.target.value as 'active'|'suspended'})}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={()=>setShowCreate(false)} className="px-4 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={addUser} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white">Create</button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
