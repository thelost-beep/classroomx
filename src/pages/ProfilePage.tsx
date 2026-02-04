import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Profile, PostWithDetails } from '../types/database';
import PostRenderer from '../components/PostRenderer';
import LoadingSpinner from '../components/LoadingSpinner';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [posts, setPosts] = useState<PostWithDetails[]>([]);
    const [bestiesData, setBestiesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchProfileData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const { data: profileData, error: profileError } = await (supabase
                .from('profiles') as any)
                .select('*')
                .eq('id', id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch Besties if any
            if (profileData.besties && profileData.besties.length > 0) {
                try {
                    const { data: bData, error: bError } = await (supabase.from('profiles') as any)
                        .select('id, name, avatar_url')
                        .in('id', profileData.besties);
                    if (!bError) setBestiesData(bData || []);
                } catch (err) {
                    console.error('Error fetching besties:', err);
                }
            }

            const { data: postsData, error: postsError } = await (supabase
                .from('posts') as any)
                .select(`
                    *,
                    profiles:user_id (*),
                    media (*),
                    likes (*),
                    comments (*, profiles:user_id (*)),
                    tags (*, profiles:tagged_user_id (*))
                `)
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            const postsWithCounts = (postsData || []).map((post: any) => ({
                ...post,
                like_count: post.likes?.length || 0,
                comment_count: post.comments?.length || 0,
                is_liked: post.likes?.some((like: any) => like.user_id === user?.id) || false,
            }));

            setPosts(postsWithCounts);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchProfileData();
    }, [id, user?.id]);

    if (loading) return <LoadingSpinner fullPage message="Accessing the vault..." />;

    if (!profile) return (
        <div className="container text-center p-xl">
            <h2>User not found</h2>
            <button onClick={() => navigate(-1)} className="btn btn-secondary mt-md">Go Back</button>
        </div>
    );

    const isOwnProfile = user?.id === profile.id;
    const priv = profile.privacy_settings || { show_email: true, show_phone: false, show_birthday: true, show_socials: true };

    return (
        <div className="profile-page animate-fadeIn">
            <div className="profile-hero card">
                <div className="profile-cover"></div>
                <div className="profile-main">
                    <div className="profile-avatar-large">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.name} />
                        ) : (
                            <span>{profile.name[0].toUpperCase()}</span>
                        )}
                    </div>
                    <div className="profile-details-main">
                        <div className="profile-name-row">
                            <h1>{profile.name}</h1>
                            <div className="profile-actions">
                                {!isOwnProfile && (
                                    <button
                                        onClick={() => showNotification(`Sent a "Hi" to ${profile.name}! 👋`, 'success')}
                                        className="btn btn-primary btn-sm"
                                    >
                                        👋 Send Hi
                                    </button>
                                )}
                                {isOwnProfile && (
                                    <Link to="/settings" className="btn btn-secondary btn-sm edit-profile-btn">
                                        ⚙️ Edit
                                    </Link>
                                )}
                            </div>
                        </div>
                        <span className={`role-badge ${profile.role}`}>{profile.role}</span>
                        {profile.quote && <p className="profile-quote">"{profile.quote}"</p>}
                    </div>
                </div>
            </div>

            <div className="profile-content-grid">
                <div className="profile-info-column">
                    <div className="stats-box card">
                        <div className="stat">
                            <span className="stat-value">{posts.length}</span>
                            <span className="stat-label">Memories</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">
                                {posts.reduce((acc, p) => acc + (p.like_count || 0), 0)}
                            </span>
                            <span className="stat-label">Likes</span>
                        </div>
                    </div>

                    {bestiesData.length > 0 && (
                        <div className="besties-box card mt-lg">
                            <h3>Best Friends</h3>
                            <div className="besties-list-horizontal">
                                {bestiesData.map(b => (
                                    <Link key={b.id} to={`/profile/${b.id}`} className="bestie-link" title={b.name}>
                                        <div className="bestie-avatar">
                                            {b.avatar_url ? <img src={b.avatar_url} /> : b.name[0]}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="details-box card mt-lg">
                        <h3>About</h3>
                        <div className="detail-list">
                            {profile.bio && <div className="detail-item"><p className="bio-text">{profile.bio}</p></div>}
                            {(isOwnProfile || priv.show_birthday) && profile.birthday && <div className="detail-item"><span>🎂 Birthday:</span> {new Date(profile.birthday).toLocaleDateString()}</div>}
                            {profile.hometown && <div className="detail-item"><span>📍 From:</span> {profile.hometown}</div>}
                            {profile.dream_job && <div className="detail-item"><span>🚀 Goal:</span> {profile.dream_job}</div>}
                            {(isOwnProfile || priv.show_email) && <div className="detail-item"><span>📧 Email:</span> {profile.email}</div>}
                            {(isOwnProfile || priv.show_phone) && profile.phone && <div className="detail-item"><span>📞 Phone:</span> {profile.phone}</div>}
                        </div>
                    </div>

                    {(isOwnProfile || priv.show_socials) && (profile.instagram_handle || profile.twitter_handle || profile.linkedin_handle) && (
                        <div className="socials-box card mt-lg">
                            <h3>Socials</h3>
                            <div className="social-links">
                                {profile.instagram_handle && <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="social-link inst">Instagram</a>}
                                {profile.twitter_handle && <a href={`https://twitter.com/${profile.twitter_handle.replace('@', '')}`} target="_blank" rel="noreferrer" className="social-link twit">Twitter</a>}
                                {profile.linkedin_handle && <a href={`https://linkedin.com/in/${profile.linkedin_handle}`} target="_blank" rel="noreferrer" className="social-link linkd">LinkedIn</a>}
                            </div>
                        </div>
                    )}
                </div>

                <div className="profile-feed-column">
                    <h2 className="section-title">Timeline</h2>
                    <div className="profile-feed">
                        {posts.length === 0 ? (
                            <div className="empty-state card">
                                <p className="text-tertiary">No memories shared yet.</p>
                            </div>
                        ) : (
                            posts.map(post => (
                                <PostRenderer key={post.id} post={post} onUpdate={fetchProfileData} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
