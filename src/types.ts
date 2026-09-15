export interface Contact {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  tags?: string[];
  category?: string;
  notes?: string;
  avatarUrl?: string;
  isFavorite?: boolean;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  avatarUrl?: string;
}
