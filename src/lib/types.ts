import type { UserType } from './constants';

// ========== Database Row Types ==========

export interface Profile {
  id: string;
  user_type: UserType;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  prefecture: string | null;
  city: string | null;
  website_url: string | null;
  skills: string[];
  experience_years: number | null;
  company_name: string | null;
  is_public: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'banned';
  is_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_urls: string[];
  category: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  target_user_id: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'closed';
  created_at: string;
}

// ========== API Request/Response Types ==========

export interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
  };
  error: { code: string; message: string } | null;
}

// ========== Form Types ==========

export interface ProfileFormData {
  user_type: UserType;
  display_name: string;
  bio: string;
  prefecture: string;
  city: string;
  website_url: string;
  skills: string[];
  experience_years: number | null;
  company_name: string;
}

export interface PortfolioFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  images: File[];
}

export interface InquiryFormData {
  subject: string;
  message: string;
}

// ========== Search Params ==========

export interface SearchParams {
  user_type?: UserType;
  prefecture?: string;
  keyword?: string;
  page?: number;
  per_page?: number;
}

// ========== Extended Types (with relations) ==========

export interface ProfileWithPortfolios extends Profile {
  portfolios: Portfolio[];
}

export interface FavoriteWithProfile extends Favorite {
  target_profile: Profile;
}

export interface InquiryWithProfiles extends Inquiry {
  from_profile: Profile;
  to_profile: Profile;
}

// ========== Phase 2 Types ==========

export interface ChatRoom {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type NotificationType =
  | 'chat_message'
  | 'inquiry_received'
  | 'favorite_added'
  | 'profile_approved'
  | 'profile_rejected'
  | 'report_resolved';

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type ReportReason = 'spam' | 'harassment' | 'fake_profile' | 'inappropriate_content' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

// ========== Phase 2 Extended Types ==========

export interface ChatRoomWithProfile extends ChatRoom {
  other_user: Profile;
  unread_count?: number;
}

export interface ChatMessageWithSender extends ChatMessage {
  sender: Profile;
}

export interface ReportWithProfiles extends Report {
  reporter: Profile;
  reported_user: Profile;
}
