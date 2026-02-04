import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import type { Profile } from '../types/database';
import './CreatePostPage.css';

const CreatePostPage: React.FC = () => {
    const [content, setContent] = useState('');
    const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'mixed'>('text');
    const [mood, setMood] = useState('');
    const [visibility, setVisibility] = useState<'class' | 'selected' | 'private'>('class');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [classmates, setClassmates] = useState<Profile[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const { user } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClassmates = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .neq('id', user?.id);

                if (error) throw error;
                setClassmates(data || []);
            } catch (error) {
                console.error('Error fetching classmates:', error);
            }
        };

        fetchClassmates();
    }, [user?.id]);

    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 5) {
            showNotification('Maximum 5 files allowed', 'error');
            return;
        }
        setMediaFiles(files);

        // Create previews
        const previews = files.map(file => URL.createObjectURL(file));
        setMediaPreviews(previews);

        // Determine post type
        if (files.length > 0) {
            const hasImage = files.some(f => f.type.startsWith('image/'));
            const hasVideo = files.some(f => f.type.startsWith('video/'));
            if (hasImage && hasVideo) setPostType('mixed');
            else if (hasVideo) setPostType('video');
            else if (hasImage) setPostType('image');
        } else {
            setPostType('text');
        }
    };

    const uploadMedia = async (postId: string) => {
        const uploadedMedia = [];
        for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${postId}-${i}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('post-media')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                throw new Error(`Failed to upload file ${i + 1}: ${uploadError.message}`);
            }

            const { data: { publicUrl } } = supabase.storage
                .from('post-media')
                .getPublicUrl(filePath);

            uploadedMedia.push({
                file_url: publicUrl,
                file_type: file.type.startsWith('image/') ? 'image' : 'video',
                order_index: i,
            });
        }
        return uploadedMedia;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !content.trim()) return;

        setLoading(true);

        try {
            // 1. Create post
            const { data: post, error: postError } = await (supabase
                .from('posts') as any)
                .insert({
                    user_id: user.id,
                    content: content.trim(),
                    post_type: postType,
                    visibility,
                    mood: mood || null,
                })
                .select()
                .single();

            if (postError) {
                console.error('Post DB Error:', postError);
                throw new Error(`DB Error: ${postError.message}`);
            }

            // 2. Upload media
            if (mediaFiles.length > 0) {
                const uploadedMedia = await uploadMedia(post.id);
                const { error: mediaError } = await (supabase
                    .from('media') as any)
                    .insert(uploadedMedia.map(m => ({
                        post_id: post.id,
                        ...m,
                    })));

                if (mediaError) throw mediaError;
            }

            // 3. Save tags
            if (selectedTags.length > 0) {
                await (supabase
                    .from('tags') as any)
                    .insert(selectedTags.map(taggedUserId => ({
                        post_id: post.id,
                        tagged_user_id: taggedUserId,
                    })));
            }

            showNotification('Memory shared successfully! ✨', 'success');
            navigate('/');
        } catch (error: any) {
            console.error('Final Creation Error:', error);
            showNotification(`Failed to post: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleTag = (userId: string) => {
        setSelectedTags(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    return (
        <div className="create-post-page animate-fadeIn">
            <div className="create-post-header">
                <h2>Share a Memory</h2>
                <p className="text-secondary">Capture the moment with Class 10</p>
            </div>

            <form onSubmit={handleSubmit} className="create-post-form card">
                <div className="form-group">
                    <label>Caption</label>
                    <textarea
                        className="input textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's happening? #Class10Memories"
                        required
                        rows={4}
                    />
                </div>

                <div className="form-group">
                    <label>Photos / Videos</label>
                    <div className="media-upload-zone">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={handleMediaChange}
                            id="file-upload"
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="file-upload" className="upload-btn">
                            <span>📸 Attach Media (Max 5)</span>
                        </label>
                        <span className="file-count">{mediaFiles.length} files selected</span>
                    </div>

                    {mediaPreviews.length > 0 && (
                        <div className="previews-grid">
                            {mediaPreviews.map((preview, index) => (
                                <div key={index} className="preview-box">
                                    {mediaFiles[index].type.startsWith('image/') ? (
                                        <img src={preview} alt="" />
                                    ) : (
                                        <div className="video-placeholder">🎥 Video</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Mood</label>
                        <select className="input" value={mood} onChange={(e) => setMood(e.target.value)}>
                            <option value="">None</option>
                            <option value="happy">😊 Happy</option>
                            <option value="nostalgic">🥺 Nostalgic</option>
                            <option value="excited">🎉 Excited</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Visibility</label>
                        <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value as any)}>
                            <option value="class">Everyone in Class</option>
                            <option value="selected">Close Friends Only</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Tag Classmates</label>
                    <div className="tags-selector">
                        {classmates.map(m => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleTag(m.id)}
                                className={`tag-chip ${selectedTags.includes(m.id) ? 'active' : ''}`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-actions pt-lg">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? 'Posting Memory...' : 'Share Memory ✨'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePostPage;
