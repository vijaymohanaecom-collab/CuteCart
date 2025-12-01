export interface User {
  id?: number;
  username: string;
  password?: string;
  role: 'admin' | 'manager' | 'sales';
  created_at?: string;
}
