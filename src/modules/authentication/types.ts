export enum UserRole {
    Superadmin = "superadmin",
    Admin = "admin",
    User = "user",
}

export interface RefreshContext {
    id: number;
    role: UserRole;
    sessionId: number;
}

export interface UserContext {
    id: number;
    role: UserRole;
}

export interface LoginRequestBody {
    password: string;
    username: string;
}

export interface LoginResponse {
    token: string;
    refreshToken: string;
}

export interface RefreshResponse {
    token: string;
}

export interface LogoutResponse {
    message: string;
}