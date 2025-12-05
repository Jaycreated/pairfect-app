import { type NavigatorScreenParams } from '@react-navigation/native';

declare global {
  namespace ReactNavigation {
    interface RootParamList {
      '(auth)': NavigatorScreenParams<{
        login: undefined;
        signup: undefined;
        'select-interests': undefined;
        'photo-upload': undefined;
        'profile-setup': undefined;
      }>;
      '(tabs)': undefined;
      'screens/subscribe': undefined;
    }
  }
}

export { };

