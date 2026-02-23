// ============================================================
// TypeScript Types — Shared Types untuk API
// ============================================================

// ---- Auth Types ----
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  location?: {
    district: string;
    city: string;
    province: string;
    lat?: number;
    lng?: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      fullName: string;
    };
    accessToken: string;
    refreshToken?: string;
  };
}

// ---- API Response ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---- User Types ----
export interface UserMetadata {
  id: string;
  authId: string;
  fullName: string;
  initials: string;
  email: string;
  phone?: string;
  bio?: string;
  location: {
    district: string;
    city: string;
    province: string;
    lat?: number;
    lng?: number;
  };
  ecoPoints: number;
  currentBadge: string;
  totalReports: number;
  totalActions: number;
  rank: number;
  joinedDate: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Report Types ----
export interface CreateReportRequest {
  category: string;
  type: string;
  title: string;
  description: string;
  address: string;
  district?: string;
  city?: string;
  lat: number;
  lng: number;
  urgency?: number;
  photoUrls?: string[];
}

export interface ReportResponse {
  id: string;
  userId: string;
  category: string;
  type: string;
  title: string;
  description: string;
  address: string;
  district: string;
  city: string;
  lat: number;
  lng: number;
  status: string;
  urgency: number;
  votesCount: number;
  verifiedCount: number;
  photosCount: number;
  commentsCount: number;
  respondedBy: string | null;
  estimatedCompletion: string | null;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
  reporter?: {
    fullName: string;
    initials: string;
    currentBadge: string;
    totalReports: number;
  };
  comments?: CommentResponse[];
  hasVoted?: boolean;
}

// ---- Action Types ----
export interface CreateActionRequest {
  category: string;
  type: string;
  title: string;
  description: string;
  address: string;
  district?: string;
  city?: string;
  lat?: number;
  lng?: number;
  date?: string;
  duration?: string;
  points?: number;
  maxParticipants?: number;
  photoUrls?: string[];
}

export interface ActionResponse {
  id: string;
  userId: string;
  category: string;
  type: string;
  title: string;
  description: string;
  address: string;
  district: string;
  city: string;
  lat: number | null;
  lng: number | null;
  status: string;
  date: string | null;
  duration: string | null;
  points: number;
  maxParticipants: number;
  totalParticipants: number;
  verified: boolean;
  verifiedBy: string | null;
  commentsCount: number;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
  organizer?: {
    fullName: string;
    initials: string;
    currentBadge: string;
    totalActions: number;
  };
  comments?: CommentResponse[];
}

// ---- Comment Types ----
export interface CreateCommentRequest {
  targetId: string;
  targetType: 'report' | 'action';
  text: string;
}

export interface CommentResponse {
  id: string;
  userId: string;
  targetId: string;
  targetType: string;
  text: string;
  likes: number;
  createdAt: string;
  user?: {
    fullName: string;
    initials: string;
  };
}

// ---- Upload Types ----
export interface UploadResponse {
  url: string;
  path: string;
  filename: string;
}
