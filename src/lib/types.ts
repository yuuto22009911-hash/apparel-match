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
