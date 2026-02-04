import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import './MemoryVaultPage.css';

const MemoryVaultPage: React.FC = () => {
    const [mediaItems, setMediaItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const { data, error } = await (supabase
                    .from('media') as any)
                    .select('*, posts(user_id, profiles:user_id(name), created_at)')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setMediaItems(data || []);
            } catch (error) {
                console.error('Error fetching vault:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMedia();
    }, []);

    return (
        <div className="memory-vault-page animate-fadeIn">
            <div className="vault-header">
                <h1>Memory Vault</h1>
                <p className="text-secondary">A timeless archive of our class journey</p>
            </div>

            <div className="vault-filters">
                <button
                    className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`filter-chip ${filter === 'photos' ? 'active' : ''}`}
                    onClick={() => setFilter('photos')}
                >
                    Photos
                </button>
                <button
                    className={`filter-chip ${filter === 'videos' ? 'active' : ''}`}
                    onClick={() => setFilter('videos')}
                >
                    Videos
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-xl">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="media-grid">
                    {mediaItems.length === 0 ? (
                        <div className="empty-state">
                            <p>The vault is empty. Post some memories to see them here!</p>
                        </div>
                    ) : (
                        mediaItems
                            .filter(item => {
                                if (filter === 'photos') return item.file_type === 'image';
                                if (filter === 'videos') return item.file_type === 'video';
                                return true;
                            })
                            .map((item) => (
                                <div key={item.id} className="vault-item card">
                                    {item.file_type === 'image' ? (
                                        <img src={item.file_url} alt="Memory" loading="lazy" />
                                    ) : (
                                        <video src={item.file_url} />
                                    )}
                                    <div className="item-overlay">
                                        <span className="item-author">{item.posts?.profiles?.name}</span>
                                        <span className="item-date">
                                            {new Date(item.created_at).getFullYear()}
                                        </span>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MemoryVaultPage;
