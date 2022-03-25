export enum UserRole {
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