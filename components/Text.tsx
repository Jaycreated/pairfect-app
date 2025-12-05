import { useTheme } from '@/context/ThemeContext';
import { Text as RNText, TextProps, useColorScheme } from 'react-native';

type FontWeight = 'regular' | 'medium' | 'semibold' | 'bold';

interface TextComponentProps extends TextProps {
  weight?: FontWeight;
  children: React.ReactNode;
}

const fontMap: Record<FontWeight, string> = {
  regular: 'font-sans',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function Text({
  style,
  weight = 'regular',
  children,
  ...props
}: TextComponentProps) {
  const colorScheme = useColorScheme();
  const { theme } = useTheme();
  
  // Determine the text color based on theme
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';
  
  return (
    <RNText
      className={`${fontMap[weight]} ${textColor}`}
      style={[style]}
      {...props}
    >
      {children}
    </RNText>
  );
}

export function Heading1({ style, children, ...props }: TextComponentProps) {
  return (
    <Text
      weight="bold"
      className="text-3xl mb-4"
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Heading2({ style, children, ...props }: TextComponentProps) {
  return (
    <Text
      weight="semibold"
      className="text-2xl mb-3"
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Body({ style, children, ...props }: TextComponentProps) {
  return (
    <Text
      weight="regular"
      className="text-base"
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}

export function Caption({ style, children, ...props }: TextComponentProps) {
  return (
    <Text
      weight="regular"
      className="text-sm text-gray-500"
      style={style}
      {...props}
    >
      {children}
    </Text>
  );
}
