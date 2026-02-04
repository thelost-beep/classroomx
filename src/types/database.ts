export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    name: string;
                    email: string;
                    role: 'student' | 'teacher' | 'admin';
                    is_first_login: boolean;
                    avatar_url: string | null;
                    bio: string | null;
                    phone: string | null;
                    birthday: string | null;
                    hobbies: string | null;
                    dream_job: string | null;
                    quote: string | null;
                    instagram_handle: string | null;
                    twitter_handle: string | null;
                    linkedin_handle: string | null;
                    hometown: string | null;
                    privacy_settings: {
                        show_email: boolean;
                        show_phone: boolean;
                        show_birthday: boolean;
                        show_socials: boolean;
                    };
                    besties: string[];
                    created_at: string;
                };
                Insert: {
                    id: string;
                    name: string;
                    email: string;
                    role?: 'student' | 'teacher' | 'admin';
                    is_first_login?: boolean;
                    avatar_url?: string | null;
                    bio?: string | null;
                    phone?: string | null;
                    birthday?: string | null;
                    hobbies?: string | null;
                    dream_job?: string | null;
                    quote?: string | null;
                    instagram_handle?: string | null;
                    twitter_handle?: string | null;
                    linkedin_handle?: string | null;
                    hometown?: string | null;
                    privacy_settings?: {
                        show_email: boolean;
                        show_phone: boolean;
                        show_birthday: boolean;
                        show_socials: boolean;
                    };
                    besties?: string[];
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    email?: string;
                    role?: 'student' | 'teacher' | 'admin';
                    is_first_login?: boolean;
                    avatar_url?: string | null;
                    bio?: string | null;
                    phone?: string | null;
                    birthday?: string | null;
                    hobbies?: string | null;
                    dream_job?: string | null;
                    quote?: string | null;
                    instagram_handle?: string | null;
                    twitter_handle?: string | null;
                    linkedin_handle?: string | null;
                    hometown?: string | null;
                    privacy_settings?: {
                        show_email?: boolean;
                        show_phone?: boolean;
                        show_birthday?: boolean;
                        show_socials?: boolean;
                    };
                    besties?: string[];
                    created_at?: string;
                };
            };
            posts: {
                Row: {
                    id: string;
                    user_id: string;
                    content: string;
                    post_type: 'text' | 'image' | 'video' | 'mixed';
                    visibility: 'class' | 'selected' | 'private';
                    mood: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    content: string;
                    post_type: 'text' | 'image' | 'video' | 'mixed';
                    visibility?: 'class' | 'selected' | 'private';
                    mood?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    content?: string;
                    post_type?: 'text' | 'image' | 'video' | 'mixed';
                    visibility?: 'class' | 'selected' | 'private';
                    mood?: string | null;
                    created_at?: string;
                };
            };
            media: {
                Row: {
                    id: string;
                    post_id: string;
                    file_url: string;
                    file_type: 'image' | 'video';
                    order_index: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    post_id: string;
                    file_url: string;
                    file_type: 'image' | 'video';
                    order_index?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    post_id?: string;
                    file_url?: string;
                    file_type?: 'image' | 'video';
                    order_index?: number;
                    created_at?: string;
                };
            };
            likes: {
                Row: {
                    id: string;
                    post_id: string;
                    user_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    post_id: string;
                    user_id: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    post_id?: string;
                    user_id?: string;
                    created_at?: string;
                };
            };
            comments: {
                Row: {
                    id: string;
                    post_id: string;
                    user_id: string;
                    content: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    post_id: string;
                    user_id: string;
                    content: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    post_id?: string;
                    user_id?: string;
                    content?: string;
                    created_at?: string;
                };
            };
            tags: {
                Row: {
                    id: string;
                    post_id: string;
                    tagged_user_id: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    post_id: string;
                    tagged_user_id: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    post_id?: string;
                    tagged_user_id?: string;
                    created_at?: string;
                };
            };
            confessions: {
                Row: {
                    id: string;
                    user_id: string | null;
                    content: string;
                    is_anonymous: boolean;
                    status: 'pending' | 'approved' | 'rejected';
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id?: string | null;
                    content: string;
                    is_anonymous?: boolean;
                    status?: 'pending' | 'approved' | 'rejected';
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string | null;
                    content?: string;
                    is_anonymous?: boolean;
                    status?: 'pending' | 'approved' | 'rejected';
                    created_at?: string;
                };
            };
            time_capsules: {
                Row: {
                    id: string;
                    creator_id: string;
                    capsule_type: 'personal' | 'class' | 'teacher';
                    content: string;
                    unlock_date: string;
                    is_locked: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    creator_id: string;
                    capsule_type: 'personal' | 'class' | 'teacher';
                    content: string;
                    unlock_date: string;
                    is_locked?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    creator_id?: string;
                    capsule_type?: 'personal' | 'class' | 'teacher';
                    content?: string;
                    unlock_date?: string;
                    is_locked?: boolean;
                    created_at?: string;
                };
            };
            teacher_letters: {
                Row: {
                    id: string;
                    teacher_id: string;
                    title: string;
                    content: string;
                    is_delivered: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    teacher_id: string;
                    title: string;
                    content: string;
                    is_delivered?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    teacher_id?: string;
                    title?: string;
                    content?: string;
                    is_delivered?: boolean;
                    created_at?: string;
                };
            };
            notifications: {
                Row: {
                    id: string;
                    user_id: string;
                    actor_id: string | null;
                    type: 'like' | 'comment' | 'tag' | 'capsule' | 'letter';
                    reference_id: string | null;
                    is_read: boolean;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    actor_id?: string | null;
                    type: 'like' | 'comment' | 'tag' | 'capsule' | 'letter';
                    reference_id?: string | null;
                    is_read?: boolean;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    actor_id?: string | null;
                    type?: 'like' | 'comment' | 'tag' | 'capsule' | 'letter';
                    reference_id?: string | null;
                    is_read?: boolean;
                    created_at?: string;
                };
            };
            journals: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    content: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    content: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    content?: string;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            alumni_updates: {
                Row: {
                    id: string;
                    user_id: string;
                    content: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    content: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    content?: string;
                    created_at?: string;
                };
            };
        };
    };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Media = Database['public']['Tables']['media']['Row'];
export type Like = Database['public']['Tables']['likes']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type Confession = Database['public']['Tables']['confessions']['Row'];
export type TimeCapsule = Database['public']['Tables']['time_capsules']['Row'];
export type TeacherLetter = Database['public']['Tables']['teacher_letters']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Journal = Database['public']['Tables']['journals']['Row'];
export type AlumniUpdate = Database['public']['Tables']['alumni_updates']['Row'];

export interface PostWithDetails extends Post {
    profiles: Profile;
    media: Media[];
    likes: Like[];
    comments: (Comment & { profiles: Profile })[];
    tags: (Tag & { profiles: Profile })[];
    like_count?: number;
    comment_count?: number;
    is_liked?: boolean;
}
