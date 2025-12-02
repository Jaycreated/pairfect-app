export type User = {
  id: string;
  email: string;
  name: string;
  token: string;
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
