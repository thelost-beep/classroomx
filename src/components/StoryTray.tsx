import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import StoryUploadModal from './StoryUploadModal';
import StoryViewer from './StoryViewer';
import { Plus, ChevronRight } from 'lucide-react';
import './StoryTray.css';

interface StoryWithProfile {
    id: string;
    media_url: string;
    media_type: 'image' | 'video';
    content: string | null;
    user_id: string;
    created_at: string;
    profiles: {
        name: string;
        avatar_url: string | null;
    };
}

const StoryTray: React.FC = () => {
    const [stories, setStories] = useState<StoryWithProfile[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [viewingIndex, setViewingIndex] = useState<number | null>(null);
    const { user } = useAuth();

    const fetchStories = async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            const { data, error } = await supabase
                .from('stories')
                .select(`
                    *,
                    profiles:user_id (name, avatar_url)
                `)
                .gt('created_at', twentyFourHoursAgo)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const uniqueUserStories: StoryWithProfile[] = [];
            const userIds = new Set();

            (data || []).forEach((story: any) => {
                if (!userIds.has(story.user_id)) {
                    userIds.add(story.user_id);
                    uniqueUserStories.push(story);
                }
            });

            setStories(uniqueUserStories);
        } catch (error) {
            console.error('Error fetching stories:', error);
        }
    };

    useEffect(() => {
        fetchStories();

        const channel = supabase.channel('stories-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => fetchStories())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <div className="story-tray-container">
            <div className="story-tray">
                {/* Add Story Button */}
                <div className="story-item own-story" onClick={() => setIsUploadModalOpen(true)}>
                    <div className="story-circle-add">
                        <Plus size={20} />
                    </div>
                    <span>Your Story</span>
                </div>

                {/* Classmate Stories */}
                {stories.map((story, index) => (
                    <div key={story.id} className="story-item" onClick={() => setViewingIndex(index)}>
                        <div className="story-circle">
                            {story.profiles?.avatar_url ? (
                                <img src={story.profiles.avatar_url} alt={story.profiles.name} />
                            ) : (
                                <div className="avatar-placeholder">
                                    {story.profiles?.name?.[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <span>{story.user_id === user?.id ? 'Your Story' : story.profiles?.name.split(' ')[0]}</span>
                    </div>
                ))}
            </div>
            {stories.length > 5 && (
                <button className="tray-scroll-btn">
                    <ChevronRight size={16} />
                </button>
            )}

            <StoryUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={fetchStories}
            />

            <StoryViewer
                stories={stories}
                initialIndex={viewingIndex || 0}
                isOpen={viewingIndex !== null}
                onClose={() => setViewingIndex(null)}
            />
        </div>
    );
};

export default StoryTray;
