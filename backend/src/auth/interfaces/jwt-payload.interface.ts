export interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'owner';
  iat?: number;
  exp?: number;
}
