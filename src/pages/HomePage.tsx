import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import PostRenderer from '../components/PostRenderer';
import LoadingSpinner from '../components/LoadingSpinner';
import './HomePage.css';

const HomePage: React.FC = () => {
    const [feedItems, setFeedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchUnifiedFeed = async () => {
        try {
            // Fetch posts
            const { data: postsRes, error: postsError } = await (supabase
                .from('posts') as any)
                .select(`
                    *,
                    profiles:user_id (*),
                    media (*),
                    likes (*),
                    comments (*, profiles:user_id (*)),
                    tags (*, profiles:tagged_user_id (*))
                `);

            if (postsError) throw postsError;

            // Fetch approved confessions
            const { data: confessionsRes, error: confessionsError } = await (supabase
                .from('confessions') as any)
                .select('*, profiles:user_id (*)')
                .eq('status', 'approved');

            if (confessionsError) throw confessionsError;

            const now = new Date();

            // Process Posts
            const posts = (postsRes || []).map((p: any) => {
                const likesCount = p.likes?.length || 0;
                const commsCount = p.comments?.length || 0;
                const ageHours = (now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60);
                // Trending Algorithm: Engagement / Age
                const score = (likesCount + commsCount * 2 + 1) / Math.pow(ageHours + 2, 1.2);

                return {
                    ...p,
                    item_type: 'post',
                    score,
                    like_count: likesCount,
                    comment_count: commsCount,
                    is_liked: p.likes?.some((like: any) => like.user_id === user?.id) || false
                };
            });

            // Process Confessions
            const confessions = (confessionsRes || []).map((c: any) => {
                const ageHours = (now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60);
                const score = 2 / Math.pow(ageHours + 2, 1.2); // Base score for confessions

                return {
                    ...c,
                    item_type: 'confession',
                    score,
                    profiles: c.is_anonymous ? null : c.profiles // Anonymize if needed
                };
            });

            const unified = [...posts, ...confessions].sort((a, b) => b.score - a.score);
            setFeedItems(unified);
        } catch (error) {
            console.error('Error fetching unified feed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchUnifiedFeed();

        // Realtime updates for both tables
        const channel = supabase.channel('unified-feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchUnifiedFeed())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, () => fetchUnifiedFeed())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user?.id]);

    if (loading) return <LoadingSpinner fullPage message="Brewing your class feed..." />;

    return (
        <div className="home-page animate-fadeInUp">
            <div className="home-header">
                <h2>Home Feed</h2>
                <p className="text-secondary">The latest from your batch</p>
            </div>

            <div className="feed-container">
                {feedItems.length === 0 ? (
                    <div className="empty-state card animate-fadeInUp">
                        <h3>No posts yet</h3>
                        <p className="text-secondary">Be the first to share a memory!</p>
                        <button className="btn btn-primary mt-md" onClick={() => window.location.href = '/create-post'}>
                            Create Post
                        </button>
                    </div>
                ) : (
                    feedItems.map(item => (
                        item.item_type === 'post' ? (
                            <PostRenderer key={`post-${item.id}`} post={item} onUpdate={fetchUnifiedFeed} />
                        ) : (
                            <div key={`confession-${item.id}`} className="confession-card post-card card animate-slideUp">
                                <div className="post-header">
                                    <div className="post-author-info">
                                        <div className="author-avatar secret">🤐</div>
                                        <div className="author-details">
                                            <span className="author-name">Anonymous Secret</span>
                                            <span className="post-date">{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <span className="confession-tag">Secret</span>
                                </div>
                                <div className="post-content">
                                    <p className="confession-text-large">"{item.content}"</p>
                                </div>
                            </div>
                        )
                    ))
                )}
            </div>
        </div>
    );
};

export default HomePage;
