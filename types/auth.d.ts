export type User = {
  id: number;
  email: string;
  name: string;
  token: string;
  age: number | null;
  gender: string | null;
  bio: string | null;
  location: string | null;
  orientation: string | null;
  photos: string[];
  interests: string[];
  last_login: string;
  // Add other fields that might be present in your API response
  [key: string]: any; // This allows for additional properties
};

export type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpData = SignInCredentials & {
  name: string;
};
