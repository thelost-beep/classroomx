import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import './NotificationsPage.css';

const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data, error } = await (supabase
                .from('notifications') as any)
                .select(`
          *,
          actor:actor_id(name, avatar_url)
        `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);

            // Mark all as read
            if (data && data.some((n: any) => !n.is_read)) {
                await (supabase
                    .from('notifications') as any)
                    .update({ is_read: true })
                    .eq('user_id', user.id)
                    .eq('is_read', false);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchNotifications();
    }, [user]);

    const getNotificationText = (n: any) => {
        switch (n.type) {
            case 'like': return 'liked your post';
            case 'comment': return 'commented on your post';
            case 'tag': return 'tagged you in a post';
            default: return 'sent you a notification';
        }
    };

    return (
        <div className="notifications-page animate-fadeIn">
            <div className="notifications-header">
                <h1>Notifications</h1>
            </div>

            {loading ? (
                <div className="flex justify-center p-xl">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="notifications-list card mt-lg">
                    {notifications.length === 0 ? (
                        <p className="empty-msg">No notifications yet.</p>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className={`notification-item ${n.is_read ? 'read' : 'unread'}`}>
                                <div className="actor-avatar">
                                    {n.actor?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="notification-content">
                                    <p>
                                        <span className="font-semibold">{n.actor?.name}</span> {getNotificationText(n)}
                                    </p>
                                    <span className="text-xs text-tertiary">
                                        {new Date(n.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {!n.is_read && <div className="unread-dot"></div>}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
