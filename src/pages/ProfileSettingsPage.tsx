import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import './ProfileSettingsPage.css';

const ProfileSettingsPage: React.FC = () => {
    const { user, profile, updateProfile, updatePassword, signOut } = useAuth();
    const { showNotification } = useNotification();

    // Form States
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [birthday, setBirthday] = useState('');
    const [hobbies, setHobbies] = useState('');
    const [dreamJob, setDreamJob] = useState('');
    const [quote, setQuote] = useState('');
    const [hometown, setHometown] = useState('');
    const [instagram, setInstagram] = useState('');
    const [twitter, setTwitter] = useState('');
    const [linkedin, setLinkedin] = useState('');

    // Social & Privacy States
    const [privacy, setPrivacy] = useState({
        show_email: true,
        show_phone: false,
        show_birthday: true,
        show_socials: true
    });
    const [besties, setBesties] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<'info' | 'socials' | 'account'>('info');

    useEffect(() => {
        if (profile) {
            setName(profile.name || '');
            setBio(profile.bio || '');
            setPhone(profile.phone || '');
            setBirthday(profile.birthday || '');
            setHobbies(profile.hobbies || '');
            setDreamJob(profile.dream_job || '');
            setQuote(profile.quote || '');
            setHometown(profile.hometown || '');
            setInstagram(profile.instagram_handle || '');
            setTwitter(profile.twitter_handle || '');
            setLinkedin(profile.linkedin_handle || '');
            setPrivacy(profile.privacy_settings || {
                show_email: true,
                show_phone: false,
                show_birthday: true,
                show_socials: true
            });
            setBesties(profile.besties || []);
        }
        fetchUsers();
    }, [profile]);

    const fetchUsers = async () => {
        const { data } = await (supabase.from('profiles') as any).select('id, name, avatar_url').neq('id', user?.id);
        setAllUsers(data || []);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await updateProfile({
                name, bio, phone,
                birthday: birthday || null,
                hobbies,
                dream_job: dreamJob, quote, hometown,
                instagram_handle: instagram,
                twitter_handle: twitter,
                linkedin_handle: linkedin,
                privacy_settings: privacy,
                besties
            });
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
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await (supabase.storage as any)
                .from('avatars')
                .upload(filePath, file);

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
                <p className="text-secondary">Update your profile and account settings.</p>
            </div>

            <div className="settings-container">
                <div className="settings-tabs">
                    <button className={`settings-tab-btn ${activeSection === 'info' ? 'active' : ''}`} onClick={() => setActiveSection('info')}>Profile</button>
                    <button className={`settings-tab-btn ${activeSection === 'socials' ? 'active' : ''}`} onClick={() => setActiveSection('socials')}>Social & Privacy</button>
                    <button className={`settings-tab-btn ${activeSection === 'account' ? 'active' : ''}`} onClick={() => setActiveSection('account')}>Security</button>
                </div>

                <div className="settings-content card">
                    {activeSection === 'info' && (
                        <div className="settings-section">
                            <h3>Basic Information</h3>
                            <div className="avatar-upload-section">
                                <div className="current-avatar">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" />
                                    ) : (
                                        <span>{profile?.name?.[0]?.toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="avatar-controls">
                                    <label className="btn btn-secondary btn-sm">
                                        Upload Photo
                                        <input type="file" hidden accept="image/*" onChange={handleAvatarUpload} disabled={loading} />
                                    </label>
                                    <p className="text-xs text-tertiary mt-sm">JPG or PNG. Max 2MB.</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Bio</label>
                                    <textarea className="input textarea" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Hometown</label>
                                        <input type="text" className="input" value={hometown} onChange={e => setHometown(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Dream Job</label>
                                        <input type="text" className="input" value={dreamJob} onChange={e => setDreamJob(e.target.value)} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary mt-md" disabled={loading}>Save Profile</button>
                            </form>
                        </div>
                    )}

                    {activeSection === 'socials' && (
                        <div className="settings-section">
                            <div className="mb-xl">
                                <h3>Besties List (Max 5)</h3>
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

                                <div className="selected-besties">
                                    <p className="text-xs font-bold text-tertiary mb-sm uppercase">Selected:</p>
                                    <div className="flex gap-md">
                                        {besties.map(bid => {
                                            const b = allUsers.find(u => u.id === bid);
                                            return b ? (
                                                <div key={bid} className="text-center">
                                                    <div className="current-avatar mb-xs" style={{ width: 40, height: 40, fontSize: '1rem' }}>
                                                        {b.avatar_url ? <img src={b.avatar_url} /> : b.name[0]}
                                                    </div>
                                                    <span className="text-xs">{b.name.split(' ')[0]}</span>
                                                </div>
                                            ) : null;
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-xl pt-xl border-top">
                                <h3>Privacy Settings</h3>
                                <div className="privacy-toggles">
                                    <label className="toggle-item">
                                        <span>Show Email</span>
                                        <input type="checkbox" checked={privacy.show_email} onChange={e => setPrivacy({ ...privacy, show_email: e.target.checked })} />
                                    </label>
                                    <label className="toggle-item">
                                        <span>Show Phone</span>
                                        <input type="checkbox" checked={privacy.show_phone} onChange={e => setPrivacy({ ...privacy, show_phone: e.target.checked })} />
                                    </label>
                                    <label className="toggle-item">
                                        <span>Show Birthday</span>
                                        <input type="checkbox" checked={privacy.show_birthday} onChange={e => setPrivacy({ ...privacy, show_birthday: e.target.checked })} />
                                    </label>
                                </div>
                                <button onClick={handleUpdateProfile} className="btn btn-primary mt-lg" disabled={loading}>Save Settings</button>
                            </div>
                        </div>
                    )}

                    {activeSection === 'account' && (
                        <div className="settings-section">
                            <h3>Security</h3>
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
                            }}>
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input type="password" className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input type="password" className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>Update Password</button>
                            </form>

                            <div className="mt-xl pt-xl border-top">
                                <button onClick={() => signOut()} className="btn btn-secondary w-full">Logout</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSettingsPage;
