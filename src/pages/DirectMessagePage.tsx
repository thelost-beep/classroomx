import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { Send, Image as ImageIcon, ChevronLeft, Info, MoreVertical, Smile } from 'lucide-react';
import type { MessageWithSender } from '../types/database';
import './DirectMessagePage.css';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const DirectMessagePage: React.FC = () => {
    const { id: rawChatId } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<MessageWithSender[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [chatId, setChatId] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
    const [typingUsers] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!rawChatId || !user) return;

        const resolveChatAndFetch = async () => {
            try {
                let currentId = rawChatId;

                if (rawChatId === 'class-group') {
                    const { data: classChat } = await supabase
                        .from('chats')
                        .select('id')
                        .eq('name', 'Class Group')
                        .maybeSingle();

                    if (classChat) {
                        currentId = (classChat as any).id;
                    } else {
                        const { data: newClassChat } = await (supabase.from('chats') as any)
                            .insert({ name: 'Class Group', type: 'group' })
                            .select()
                            .single();
                        currentId = newClassChat.id;
                    }
                }

                setChatId(currentId);

                // Fetch Chat Details
                const { data: chatData, error: cError } = await (supabase
                    .from('chats') as any)
                    .select('*, chat_participants(user_id, profiles(id, name, avatar_url))')
                    .eq('id', currentId)
                    .single();

                if (!cError) {
                    const chat = chatData as any;
                    // Ensure current user is in participants
                    if (!chat.chat_participants.some((p: any) => p.user_id === user.id)) {
                        await (supabase.from('chat_participants') as any).insert({ chat_id: currentId, user_id: user.id });
                    }

                    if (chat.type === '1to1') {
                        const otherP = chat.chat_participants.find((p: any) => p.user_id !== user.id);
                        setChatInfo({
                            name: otherP?.profiles.name || 'Unknown',
                            avatar_url: otherP?.profiles.avatar_url,
                            type: '1to1'
                        });
                    } else {
                        setChatInfo({ name: chat.name || 'Group Chat', type: 'group' });
                    }
                }

                // Fetch Messages
                const { data: msgs, error: mError } = await (supabase
                    .from('messages') as any)
                    .select(`
                        *,
                        sender: profiles(name, avatar_url),
                        message_reactions(id, emoji, user_id),
                        shared_posts(id, post_id, posts(id, content, user_id, profiles(name, avatar_url)))
                    `)
                    .eq('chat_id', currentId)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: true });

                if (!mError) {
                    setMessages((msgs || []) as MessageWithSender[]);
                    setLoading(false);
                    setTimeout(scrollToBottom, 200);
                }

                // Real-time: Messages
                const messageChannel = supabase
                    .channel(`chat_${currentId}`)
                    .on('postgres_changes', {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `chat_id=eq.${currentId}`
                    }, async (payload) => {
                        const { data: senderData } = await supabase
                            .from('profiles')
                            .select('name, avatar_url')
                            .eq('id', payload.new.sender_id)
                            .single();

                        const { data: sharedPost } = await (supabase.from('shared_posts') as any)
                            .select('id, post_id, posts(id, content, user_id, profiles(name, avatar_url))')
                            .eq('message_id', payload.new.id)
                            .maybeSingle();

                        const newMsg = {
                            ...(payload.new as any),
                            sender: senderData,
                            reactions: [],
                            shared_post: sharedPost
                        } as unknown as MessageWithSender;

                        setMessages(prev => {
                            if (prev.some(m => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                        setTimeout(scrollToBottom, 100);
                    })
                    .subscribe();

                return () => {
                    supabase.removeChannel(messageChannel);
                };
            } catch (err) {
                console.error('Chat resolution error:', err);
                setLoading(false);
            }
        };

        resolveChatAndFetch();
    }, [rawChatId, user]);

    const handleTyping = async () => {
        if (!chatId || !user) return;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        await (supabase.from('typing_indicators') as any)
            .upsert({ chat_id: chatId, user_id: user.id, updated_at: new Date().toISOString() });

        typingTimeoutRef.current = setTimeout(async () => {
            await supabase.from('typing_indicators')
                .delete()
                .eq('chat_id', chatId)
                .eq('user_id', user.id);
        }, 3000);
    };

    const handleSendMessage = async (e?: React.FormEvent, mediaUrl?: string) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() && !mediaUrl) return;
        if (!chatId || !user) return;

        const content = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await (supabase.from('messages') as any)
                .insert([{
                    chat_id: chatId,
                    sender_id: user.id,
                    content: content || (mediaUrl ? '📷 Image' : ''),
                    media_url: mediaUrl || null,
                    message_type: mediaUrl ? 'image' : 'text'
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error sending message:', error);
            setNewMessage(content);
            alert('Failed to send message');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !chatId) return;

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `chat/${chatId}/${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('post-media')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('post-media')
                .getPublicUrl(filePath);

            await handleSendMessage(undefined, publicUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleReaction = async (messageId: string, emoji: string) => {
        if (!user) return;
        try {
            const { error } = await (supabase.from('message_reactions') as any)
                .insert({ message_id: messageId, user_id: user.id, emoji });

            if (error) throw error;
            setShowReactionPicker(null);

            setMessages(prev => prev.map(m => {
                if (m.id === messageId) {
                    return {
                        ...m,
                        reactions: [...(m.reactions || []), { id: Math.random().toString(), message_id: messageId, user_id: user.id, emoji, created_at: new Date().toISOString() }]
                    };
                }
                return m;
            }));
        } catch (error) {
            console.error('Error adding reaction:', error);
        }
    };

    if (loading) return <LoadingSpinner fullPage message="Connecting to chat..." />;

    return (
        <div className="dm-page animate-fadeIn">
            <div className="dm-header">
                <button className="back-btn" onClick={() => navigate('/chat')}>
                    <ChevronLeft size={24} />
                </button>
                <div className="chat-recipient">
                    <div className="recipient-avatar">
                        {chatInfo?.avatar_url ? (
                            <img src={chatInfo.avatar_url} alt={chatInfo.name} />
                        ) : (
                            <div className="avatar-placeholder">{chatInfo?.name?.[0]?.toUpperCase() || '?'}</div>
                        )}
                    </div>
                    <div className="recipient-info">
                        <h3 className="recipient-name">{chatInfo?.name}</h3>
                        <p className="recipient-status">
                            {uploading ? 'Sending media...' : typingUsers.length > 0 ? `${typingUsers[0]} is typing...` : 'Active now'}
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="icon-btn"><Info size={20} /></button>
                    <button className="icon-btn"><MoreVertical size={20} /></button>
                </div>
            </div>

            <div className="messages-container">
                {messages.length === 0 && (
                    <div className="first-message-prompt">
                        <div className="prompt-avatar">
                            {chatInfo?.name?.[0]?.toUpperCase()}
                        </div>
                        <h3>Say hi to {chatInfo?.name}!</h3>
                        <p>This is the beginning of your conversation.</p>
                    </div>
                )}
                {messages.map((msg, index) => {
                    const isOwn = msg.sender_id === user?.id;
                    const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                    const sharedPost = (msg as any).shared_post;

                    return (
                        <div key={msg.id} className={`message-wrapper ${isOwn ? 'own' : 'other'} ${showAvatar ? 'first-in-group' : ''}`}>
                            {!isOwn && (
                                <div className="message-avatar">
                                    {showAvatar && (
                                        msg.sender?.avatar_url ? (
                                            <img src={msg.sender.avatar_url} alt={msg.sender.name} />
                                        ) : (
                                            <span>{msg.sender?.name?.[0]?.toUpperCase()}</span>
                                        )
                                    )}
                                </div>
                            )}
                            <div className="message-bubble-container">
                                <div className="message-bubble">
                                    {!isOwn && showAvatar && msg.sender && (
                                        <span className="sender-name">{msg.sender.name}</span>
                                    )}

                                    {sharedPost && (
                                        <div className="shared-post-preview" onClick={() => navigate(`/post/${sharedPost.post_id}`)}>
                                            <div className="shared-post-header">
                                                <span className="shared-post-author">@{sharedPost.posts?.profiles?.name}</span>
                                            </div>
                                            <p className="shared-post-content">{sharedPost.posts?.content?.slice(0, 150)}</p>
                                            <button className="view-post-btn" onClick={(e) => { e.stopPropagation(); navigate(`/post/${sharedPost.post_id}`); }}>
                                                View Post
                                            </button>
                                        </div>
                                    )}

                                    {msg.media_url && msg.message_type === 'image' && (
                                        <div className="message-media">
                                            <img src={msg.media_url} alt="Shared" onClick={() => window.open(msg.media_url!, '_blank')} />
                                        </div>
                                    )}

                                    {msg.content && msg.message_type !== 'post' && <p className="message-content">{msg.content}</p>}

                                    <span className="message-time">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="message-reactions">
                                        {Object.entries(
                                            msg.reactions.reduce((acc: any, r: any) => {
                                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                return acc;
                                            }, {})
                                        ).map(([emoji, count]: any) => (
                                            <span key={emoji} className="reaction-badge">
                                                {emoji} {count > 1 && count}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <button className="reaction-btn" onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}>
                                    <Smile size={16} />
                                </button>

                                {showReactionPicker === msg.id && (
                                    <div className="reaction-picker">
                                        {QUICK_REACTIONS.map(emoji => (
                                            <button key={emoji} onClick={() => handleReaction(msg.id, emoji)}>
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-input-area" onSubmit={handleSendMessage}>
                <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                />
                <button
                    type="button"
                    className={`input-action-btn ${uploading ? 'loading' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <ImageIcon size={22} />
                </button>
                <div className="input-wrapper">
                    <textarea
                        placeholder="Message..."
                        value={newMessage}
                        onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        rows={1}
                        disabled={uploading}
                    />
                </div>
                <button
                    type="submit"
                    className={`send-btn ${newMessage.trim() ? 'active' : ''}`}
                    disabled={!newMessage.trim() || uploading}
                >
                    <Send size={22} />
                </button>
            </form>
        </div>
    );
};

export default DirectMessagePage;
