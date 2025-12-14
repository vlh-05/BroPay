/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Authentication request types
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Authentication response types
 */
export interface AuthResponse {
  token: string;
  name: string;
  email: string;
  role: string;
}

export interface RegisterResponse {
  message: string;
  success: boolean;
}
