import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PostWithDetails } from '../types/database';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './PostRenderer.css';

const PostRenderer: React.FC<{ post: PostWithDetails; onUpdate: () => void }> = ({ post, onUpdate }) => {
    const [commentText, setCommentText] = useState('');
    const { user } = useAuth();

    const handleLike = async () => {
        if (!user) return;
        try {
            if (post.is_liked) {
                await (supabase.from('likes') as any).delete().eq('post_id', post.id).eq('user_id', user.id);
            } else {
                await (supabase.from('likes') as any).insert({ post_id: post.id, user_id: user.id });
            }
            onUpdate();
        } catch (error) { console.error('Error liking:', error); }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !commentText.trim()) return;
        try {
            await (supabase.from('comments') as any).insert({ post_id: post.id, user_id: user.id, content: commentText.trim() });
            setCommentText('');
            onUpdate();
        } catch (error) { console.error('Error commenting:', error); }
    };

    return (
        <div className="post-renderer card animate-slideUp">
            <div className="post-header">
                <div className="post-author-info">
                    <div className="avatar">{(post.profiles as any)?.name?.[0]?.toUpperCase() || 'U'}</div>
                    <div className="author-meta">
                        <span className="author-name">{(post.profiles as any)?.name}</span>
                        <span className="post-date">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                {post.mood && <span className="post-mood-badge">{post.mood}</span>}
            </div>
            <div className="post-content"><p>{post.content}</p></div>
            {post.media && (post.media as any[]).length > 0 && (
                <div className="post-media-grid">
                    {(post.media as any[]).map((m: any) => (
                        <div key={m.id} className="media-item">
                            {m.file_type === 'image' ? <img src={m.file_url} alt="" /> : <video src={m.file_url} controls />}
                        </div>
                    ))}
                </div>
            )}
            <div className="post-actions">
                <button className={`action-btn ${post.is_liked ? 'active' : ''}`} onClick={handleLike}>
                    {post.is_liked ? '❤️' : '🤍'} {post.like_count || 0}
                </button>
                <Link to={`/post/${post.id}`} className="action-btn">💬 {post.comment_count || 0}</Link>
            </div>
            <div className="post-comments-preview">
                {(post.comments as any[])?.slice(0, 2).map((c: any) => (
                    <div key={c.id} className="comment-preview-item">
                        <span className="comment-author">{(c.profiles as any)?.name}:</span>
                        <span className="comment-text">{c.content}</span>
                    </div>
                ))}
            </div>
            <form onSubmit={handleComment} className="quick-comment-form">
                <input type="text" placeholder="Comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                <button type="submit" disabled={!commentText.trim()}>Post</button>
            </form>
        </div>
    );
};
export default PostRenderer;
