import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { PostWithDetails } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import PostRenderer from '../components/PostRenderer';
import LoadingSpinner from '../components/LoadingSpinner';
import './PostDetailPage.css';

const PostDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<PostWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchPost = async () => {
        if (!id) return;

        try {
            const { data, error } = await (supabase
                .from('posts') as any)
                .select(`
          *,
          profiles:user_id (*),
          media (*),
          likes (*, profiles:user_id (*)),
          comments (*, profiles:user_id (*)),
          tags (*, profiles:tagged_user_id (*))
        `)
                .eq('id', id)
                .single();

            if (error) throw error;

            const postWithDetails: PostWithDetails = {
                ...data,
                like_count: data.likes?.length || 0,
                comment_count: data.comments?.length || 0,
                is_liked: data.likes?.some((like: any) => like.user_id === user?.id) || false,
            };

            setPost(postWithDetails);
        } catch (error) {
            console.error('Error fetching post:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();

        if (!id) return;

        const channel = supabase
            .channel(`post-detail-${id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'likes',
                filter: `post_id=eq.${id}`
            }, () => fetchPost())
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'comments',
                filter: `post_id=eq.${id}`
            }, () => fetchPost())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id, user?.id]);

    if (loading) {
        return <LoadingSpinner fullPage message="Getting post details..." />;
    }

    if (!post) {
        return (
            <div className="container text-center p-xl">
                <h2>Post not found</h2>
                <button onClick={() => navigate(-1)} className="btn btn-secondary mt-md">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="post-detail-page animate-fadeIn">
            <div className="detail-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    ← Back
                </button>
                <h1>Post Details</h1>
            </div>

            <div className="detail-content">
                <PostRenderer post={post} onUpdate={fetchPost} />

                <div className="detail-extras">
                    <section className="likes-section card mt-lg">
                        <h3>Likes ({post.like_count || 0})</h3>
                        <div className="likes-list">
                            {(!post.likes || (post.likes as any[]).length === 0) ? (
                                <p className="text-tertiary">No likes yet.</p>
                            ) : (
                                (post.likes as any[]).map((like: any) => (
                                    <div key={like.id} className="like-user">
                                        <div className="avatar-sm">
                                            {like.profiles?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span>{like.profiles?.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="comments-full-section card mt-lg">
                        <h3>All Comments ({post.comment_count || 0})</h3>
                        <div className="comments-full-list">
                            {(!post.comments || (post.comments as any[]).length === 0) ? (
                                <p className="text-tertiary">No comments yet.</p>
                            ) : (
                                (post.comments as any[]).map((comment: any) => (
                                    <div key={comment.id} className="comment-full-item">
                                        <div className="comment-user-header">
                                            <div className="avatar-sm">
                                                {comment.profiles?.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="comment-user-meta">
                                                <span className="font-semibold">{comment.profiles?.name}</span>
                                                <span className="text-xs text-tertiary">
                                                    {new Date(comment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="comment-body">{comment.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PostDetailPage;
