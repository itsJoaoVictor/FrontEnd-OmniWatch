export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  created_at?: string;
}
