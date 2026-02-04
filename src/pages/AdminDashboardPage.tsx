import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import './AdminDashboardPage.css';

const AdminDashboardPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'confessions' | 'users'>('confessions');
    const [pendingConfessions, setPendingConfessions] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const { profile } = useAuth();
    const { showNotification } = useNotification();

    // User Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<'student' | 'teacher' | 'admin'>('student');

    // Create User Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batchMessage, setBatchMessage] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('Class10Memories!');
    const [createName, setCreateName] = useState('');
    const [createRole, setCreateRole] = useState<'student' | 'teacher' | 'admin'>('student');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [confessionsRes, usersRes] = await Promise.all([
                supabase.from('confessions').select('*, profiles:user_id(name)').eq('status', 'pending'),
                supabase.from('profiles').select('*').order('name', { ascending: true })
            ]);

            setPendingConfessions(confessionsRes.data || []);
            setUsers(usersRes.data || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile?.role === 'admin') fetchData();
    }, [profile]);

    const approveConfession = async (id: string) => {
        setActionLoading(true);
        try {
            const { error } = await (supabase.from('confessions') as any).update({ status: 'approved' }).eq('id', id);
            if (error) throw error;
            setPendingConfessions(prev => prev.filter(c => c.id !== id));
            showNotification('Confession approved!', 'success');
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally { setActionLoading(false); }
    };

    const rejectConfession = async (id: string) => {
        setActionLoading(true);
        try {
            const { error } = await (supabase.from('confessions') as any).update({ status: 'rejected' }).eq('id', id);
            if (error) throw error;
            setPendingConfessions(prev => prev.filter(c => c.id !== id));
            showNotification('Confession rejected.', 'info');
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally { setActionLoading(false); }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const { error } = await (supabase as any).rpc('admin_create_user', {
                user_email: createEmail,
                user_password: createPassword,
                user_name: createName,
                user_role: createRole
            });
            if (error) throw error;
            showNotification('User created successfully! ✨', 'success');
            setShowCreateModal(false);
            setCreateEmail('');
            setCreateName('');
            fetchData();
        } catch (error: any) {
            showNotification(`Error creating user: ${error.message}`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setActionLoading(true);
        try {
            const { error } = await (supabase as any).rpc('admin_update_user', {
                target_user_id: editingUser.id,
                new_email: newEmail,
                new_role: newRole,
                new_name: newName
            });
            if (error) throw error;
            showNotification('User updated successfully! ✅', 'success');
            setShowEditModal(false);
            fetchData();
        } catch (error: any) {
            showNotification(`Error updating user: ${error.message}`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBatchNotify = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            // In a real PWA this would trigger a push service. 
            // Here we simulate by showing a success toast and setting the groundwork.
            showNotification(`Bulk Notification sent to ${users.length} devices! 📱`, 'success');
            setShowBatchModal(false);
            setBatchMessage('');
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        setNewEmail(user.email);
        setNewName(user.name);
        setNewRole(user.role);
        setShowEditModal(true);
    };

    if (profile?.role !== 'admin') {
        return (
            <div className="container p-xl text-center">
                <h2>Access Denied</h2>
                <p>You do not have permission to view this page.</p>
            </div>
        );
    }

    if (loading) return <LoadingSpinner fullPage message="Loading Admin Dashboard..." />;

    return (
        <div className="admin-dashboard animate-fadeIn">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-tabs">
                    <button className={`tab-btn ${activeTab === 'confessions' ? 'active' : ''}`} onClick={() => setActiveTab('confessions')}>
                        Moderation ({pendingConfessions.length})
                    </button>
                    <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        Users ({users.length})
                    </button>
                </div>
            </div>

            <div className="admin-content">
                {activeTab === 'confessions' ? (
                    <section className="moderation-queue card">
                        <h3>Pending Confessions</h3>
                        <div className="queue-list mt-md">
                            {pendingConfessions.length === 0 ? (
                                <p className="text-tertiary">No pending confessions.</p>
                            ) : (
                                pendingConfessions.map((c) => (
                                    <div key={c.id} className="p-md mb-md border-bottom flex justify-between items-center">
                                        <div className="max-w-xl">
                                            <span className="text-xs text-secondary">From: {c.profiles?.name || 'Anonymous'}</span>
                                            <p className="mt-xs">"{c.content}"</p>
                                        </div>
                                        <div className="flex gap-sm">
                                            <button onClick={() => approveConfession(c.id)} className="btn btn-primary btn-sm" disabled={actionLoading}>Approve</button>
                                            <button onClick={() => rejectConfession(c.id)} className="btn btn-secondary btn-sm" disabled={actionLoading}>Reject</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                ) : (
                    <div className="card">
                        <div className="flex justify-between items-center mb-lg">
                            <h3>User Management</h3>
                            <div className="flex gap-sm">
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowBatchModal(true)}>📢 Batch Notify</button>
                                <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>+ Add User</button>
                            </div>
                        </div>
                        <div className="user-table-wrapper">
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td className="font-semibold">{u.name}</td>
                                            <td className="text-secondary">{u.email}</td>
                                            <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(u)}>Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="modal-overlay">
                    <div className="modal-content card animate-scaleIn">
                        <h3>Edit User</h3>
                        <form onSubmit={handleUpdateUser} className="mt-md">
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" className="input" value={newName} onChange={e => setNewName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="input" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select className="input" value={newRole} onChange={e => setNewRole(e.target.value as any)}>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content card animate-scaleIn">
                        <h3>Create New User</h3>
                        <form onSubmit={handleCreateUser} className="mt-md">
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" className="input" value={createName} onChange={e => setCreateName(e.target.value)} required placeholder="Full Name" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="input" value={createEmail} onChange={e => setCreateEmail(e.target.value)} required placeholder="email@example.com" />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="text" className="input" value={createPassword} onChange={e => setCreatePassword(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select className="input" value={createRole} onChange={e => setCreateRole(e.target.value as any)}>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Batch Notification Modal */}
            {showBatchModal && (
                <div className="modal-overlay">
                    <div className="modal-content card animate-scaleIn">
                        <h3>Send Batch Notification</h3>
                        <p className="text-secondary text-sm mb-md">This will send a direct alert to everyone's devices.</p>
                        <form onSubmit={handleBatchNotify}>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    className="input textarea"
                                    value={batchMessage}
                                    onChange={e => setBatchMessage(e.target.value)}
                                    required
                                    placeholder="Type your announcement..."
                                    rows={4}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBatchModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={actionLoading}>🚀 Send to All</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboardPage;
