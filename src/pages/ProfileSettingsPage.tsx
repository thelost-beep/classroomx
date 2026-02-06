import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { compressImage } from '../utils/imageCompression';
import {
    User,
    Lock,
    Shield,
    Camera,
    AtSign,
    Phone,
    Calendar,
    MapPin,
    Briefcase,
    Save,
    LogOut,
    Eye,
    EyeOff,
    CheckCircle2
} from 'lucide-react';
import './ProfileSettingsPage.css';

const ProfileSettingsPage: React.FC = () => {
    const { user, profile, updateProfile, updatePassword, signOut } = useAuth();
    const { showNotification } = useNotification();
    const { theme, setTheme } = useTheme();

    // Form States
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [hometown, setHometown] = useState('');
    const [dreamJob, setDreamJob] = useState('');
    const [dob, setDob] = useState('');

    // Social & Privacy States
    const [privacy, setPrivacy] = useState<any>({
        show_email: true,
        show_phone: false,
        show_birthday: true,
        show_socials: true
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const [besties, setBesties] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'info' | 'socials' | 'account'>('info');

    const fetchSettings = async () => {
        if (!user) return;
        const { data, error } = await (supabase
            .from('user_settings') as any)
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (data && !error) {
            setTheme(data.theme as any || 'light');
            setNotificationsEnabled(data.notifications_enabled !== false);
            document.documentElement.setAttribute('data-theme', data.theme || 'light');
        }
    };

    const fetchUsers = async () => {
        const { data } = await (supabase.from('profiles') as any).select('id, name, avatar_url').neq('id', user?.id);
        setAllUsers(data || []);
    };

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setBio(profile.bio || '');
            setHometown(profile.hometown || '');
            setDreamJob(profile.dream_job || '');
            setDob(profile.dob || '');
            setPrivacy(profile.privacy_settings || {
                show_email: true,
                show_phone: false,
                show_birthday: true,
                show_socials: true
            });
            setBesties((profile as any).besties || []);
            fetchSettings();
        }
        fetchUsers();
    }, [profile]);

    const handleUpdateSettings = async (updates: any) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({ user_id: user.id, ...updates });
            if (error) throw error;
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await updateProfile({
                name,
                bio,
                hometown,
                dream_job: dreamJob,
                dob,
                privacy_settings: privacy,
                besties
            } as any);
            if (error) throw error;
            showNotification('Profile updated successfully! ✨', 'success');
        } catch (error: any) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setLoading(true);
        try {
            // Compress avatar before upload
            const compressedFile = await compressImage(file, 400, 0.7); // Small size for avatars

            const fileExt = compressedFile.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await (supabase.storage as any)
                .from('avatars')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = (supabase.storage as any)
                .from('avatars')
                .getPublicUrl(filePath);

            await updateProfile({ avatar_url: publicUrl });
            showNotification('Avatar updated! 📸', 'success');
        } catch (error: any) {
            showNotification(`Upload failed: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleBestie = (userId: string) => {
        setBesties(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId].slice(0, 5) // Max 5 besties
        );
    };

    const filteredUsers = allUsers.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="settings-page animate-fadeInUp">
            <div className="settings-header">
                <h1>Settings</h1>
                <p className="text-secondary">Personalize your ClassroomX experience.</p>
            </div>

            <div className="settings-container">
                <div className="settings-tabs">
                    <button className={`settings-tab-btn ${activeSection === 'info' ? 'active' : ''}`} onClick={() => setActiveSection('info')}>
                        <User size={18} /> Profile
                    </button>
                    <button className={`settings-tab-btn ${activeSection === 'socials' ? 'active' : ''}`} onClick={() => setActiveSection('socials')}>
                        <Shield size={18} /> Social & Privacy
                    </button>
                    <button className={`settings-tab-btn ${activeSection === 'account' ? 'active' : ''}`} onClick={() => setActiveSection('account')}>
                        <Lock size={18} /> Security
                    </button>
                </div>

                <div className="settings-content card">
                    {activeSection === 'info' && (
                        <div className="settings-section">
                            <div className="section-title">
                                <User size={20} className="text-primary" />
                                <h3>Basic Information</h3>
                            </div>

                            <div className="avatar-upload-section">
                                <div className="current-avatar">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" />
                                    ) : (
                                        <span>{profile?.name?.[0]?.toUpperCase()}</span>
                                    )}
                                    <label className="avatar-overlay">
                                        <Camera size={20} />
                                        <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
                                    </label>
                                </div>
                                <div className="avatar-controls">
                                    <h4 className="font-bold mb-xs">Profile Picture</h4>
                                    <p className="text-xs text-tertiary">Express yourself! A square image works best.</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="settings-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label><User size={14} /> Full Name</label>
                                        <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                    <div className="form-group">
                                        <label><AtSign size={14} /> Email Address</label>
                                        <input type="email" className="input" value={user?.email} disabled title="Email cannot be changed" />
                                    </div>
                                    <div className="form-group">
                                        <label><MapPin size={14} /> Hometown</label>
                                        <input type="text" className="input" value={hometown} onChange={e => setHometown(e.target.value)} placeholder="Where are you from?" />
                                    </div>
                                    <div className="form-group">
                                        <label><Briefcase size={14} /> Dream Job</label>
                                        <input type="text" className="input" value={dreamJob} onChange={e => setDreamJob(e.target.value)} placeholder="What's your goal?" />
                                    </div>
                                    <div className="form-group">
                                        <label><Calendar size={14} /> Date of Birth</label>
                                        <input type="date" className="input" value={dob} onChange={e => setDob(e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-group mt-md">
                                    <label>Bio</label>
                                    <textarea className="input textarea" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeSection === 'socials' && (
                        <div className="settings-section">
                            <div className="mb-xl">
                                <div className="section-title">
                                    <CheckCircle2 size={20} className="text-secondary" />
                                    <h3>Besties List (Max 5)</h3>
                                </div>
                                <p className="text-sm text-tertiary mb-md">Choose up to 5 classmates who will see your private posts and letters.</p>

                                <input
                                    type="text"
                                    className="input mb-md"
                                    placeholder="Search classmates..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <div className="flex flex-wrap gap-sm mb-lg">
                                    {searchTerm && filteredUsers.slice(0, 10).map(u => (
                                        <div key={u.id} className={`bestie-pill ${besties.includes(u.id) ? 'active' : ''}`} onClick={() => toggleBestie(u.id)}>
                                            {u.name} {besties.includes(u.id) ? '★' : '+'}
                                        </div>
                                    ))}
                                </div>

                                <div className="selected-besties-grid">
                                    {besties.map(bid => {
                                        const b = allUsers.find(u => u.id === bid);
                                        return b ? (
                                            <div key={bid} className="selected-bestie-item" onClick={() => toggleBestie(bid)}>
                                                <div className="avatar sm">
                                                    {b.avatar_url ? <img src={b.avatar_url} alt={b.name} /> : b.name[0]}
                                                </div>
                                                <span className="text-xs font-semibold">{b.name}</span>
                                            </div>
                                        ) : null;
                                    })}
                                    {besties.length === 0 && <p className="text-xs italic text-tertiary">No besties selected yet.</p>}
                                </div>
                            </div>

                            <div className="mt-xl pt-xl border-top">
                                <div className="section-title">
                                    <Shield size={20} className="text-primary" />
                                    <h3>Privacy & Display</h3>
                                </div>
                                <div className="privacy-toggles">
                                    <label className="toggle-item">
                                        <div className="toggle-label">
                                            <AtSign size={16} />
                                            <span>Show Email on Profile</span>
                                        </div>
                                        <input type="checkbox" checked={privacy.show_email} onChange={e => setPrivacy({ ...privacy, show_email: e.target.checked })} />
                                    </label>
                                    <label className="toggle-item">
                                        <div className="toggle-label">
                                            <Phone size={16} />
                                            <span>Show Phone on Profile</span>
                                        </div>
                                        <input type="checkbox" checked={privacy.show_phone} onChange={e => setPrivacy({ ...privacy, show_phone: e.target.checked })} />
                                    </label>
                                    <label className="toggle-item">
                                        <div className="toggle-label">
                                            <Calendar size={16} />
                                            <span>Show Birthday on Profile</span>
                                        </div>
                                        <input type="checkbox" checked={privacy.show_birthday} onChange={e => setPrivacy({ ...privacy, show_birthday: e.target.checked })} />
                                    </label>
                                </div>

                                <h3 className="mt-xl text-lg mb-md">App Preferences</h3>
                                <div className="privacy-toggles">
                                    <label className="toggle-item">
                                        <span>Dark Mode Appearance</span>
                                        <input
                                            type="checkbox"
                                            checked={theme === 'dark'}
                                            onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
                                        />
                                    </label>
                                    <label className="toggle-item">
                                        <span>Push Notifications</span>
                                        <input
                                            type="checkbox"
                                            checked={notificationsEnabled}
                                            onChange={e => {
                                                setNotificationsEnabled(e.target.checked);
                                                handleUpdateSettings({ notifications_enabled: e.target.checked });
                                            }}
                                        />
                                    </label>
                                </div>
                                <button onClick={handleUpdateProfile} className="btn btn-primary mt-lg" disabled={loading}>
                                    <Save size={18} /> Save Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {activeSection === 'account' && (
                        <div className="settings-section">
                            <div className="security-banner">
                                <Lock size={40} className="security-icon" />
                                <div className="security-text">
                                    <h3>Security Center</h3>
                                    <p>Keep your account safe by updating your password regularly.</p>
                                </div>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (newPassword !== confirmPassword) return showNotification('Passwords do not match', 'error');
                                setLoading(true);
                                const { error } = await updatePassword(newPassword);
                                setLoading(false);
                                if (!error) {
                                    showNotification('Password updated successfully! 🔐', 'success');
                                    setNewPassword('');
                                    setConfirmPassword('');
                                } else {
                                    showNotification(error.message, 'error');
                                }
                            }} className="security-form">
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPass ? "text" : "password"}
                                            className="input"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            placeholder="Min. 6 characters"
                                        />
                                        <button type="button" className="pass-toggle" onClick={() => setShowPass(!showPass)}>
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="input"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        placeholder="Repeat new password"
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>

                            <div className="danger-zone">
                                <h3>Danger Zone</h3>
                                <p>Once you logout, you'll need your credentials to get back in.</p>
                                <button onClick={() => signOut()} className="btn btn-secondary w-full text-error border-error-hover mt-md">
                                    <LogOut size={18} /> Logout from ClassroomX
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
