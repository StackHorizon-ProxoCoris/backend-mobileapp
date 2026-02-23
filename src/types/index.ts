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

// ---- Report Types (untuk nanti) ----
export interface CreateReportRequest {
  category: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  photos?: string[];
}

// ---- Action Types (untuk nanti) ----
export interface CreateActionRequest {
  type: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  address: string;
  photoBefore?: string;
  photoAfter?: string;
}
