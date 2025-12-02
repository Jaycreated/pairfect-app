import { useAuth } from '@/hooks/useAuth';
import { Button } from 'react-native';

export function LogoutButton() {
  const { logout, isLoggingOut } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Button
      title={isLoggingOut ? "Logging out..." : "Logout"}
      onPress={handleLogout}
      disabled={isLoggingOut}
      color="red"
    />
  );
}
