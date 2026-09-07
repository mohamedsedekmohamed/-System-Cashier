export interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export interface LoginPayload {
  name: string;
  password: string;
  guard: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}
