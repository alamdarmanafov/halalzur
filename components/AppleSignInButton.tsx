import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { radius } from '../constants/theme';

export function AppleSignInButton({ onPress }: { onPress: () => void }) {
  if (Platform.OS !== 'ios') return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={radius.md}
      style={{ height: 50, width: '100%' }}
      onPress={onPress}
    />
  );
}
