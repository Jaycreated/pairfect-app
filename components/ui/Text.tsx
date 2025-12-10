import { Text as RNText, TextProps as RNTextProps } from 'react-native';

type TextProps = RNTextProps & {
  weight?: '400' | '500' | '600' | '700';
};

export function Text({ 
  style,
  weight = '400',
  children,
  ...props 
}: TextProps) {
  const fontFamily = `Poppins_${weight}Regular`;
  
  return (
    <RNText 
      style={[
        { fontFamily },
        style
      ]} 
      {...props}
    >
      {children}
    </RNText>
  );
}

export function H1({ style, ...props }: TextProps) {
  return (
    <Text 
      style={[
        { 
          fontSize: 32,
          lineHeight: 40,
          fontWeight: '700',
        },
        style
      ]} 
      weight="700"
      {...props} 
    />
  );
}

export function H2({ style, ...props }: TextProps) {
  return (
    <Text 
      style={[
        { 
          fontSize: 24,
          lineHeight: 32,
          fontWeight: '600',
        },
        style
      ]} 
      weight="600"
      {...props} 
    />
  );
}

export function H3({ style, ...props }: TextProps) {
  return (
    <Text 
      style={[
        { 
          fontSize: 20,
          lineHeight: 28,
          fontWeight: '600',
        },
        style
      ]} 
      weight="600"
      {...props} 
    />
  );
}

export function P({ style, ...props }: TextProps) {
  return (
    <Text 
      style={[
        { 
          fontSize: 16,
          lineHeight: 24,
        },
        style
      ]} 
      weight="400"
      {...props} 
    />
  );
}

export function Small({ style, ...props }: TextProps) {
  return (
    <Text 
      style={[
        { 
          fontSize: 14,
          lineHeight: 20,
        },
        style
      ]} 
      weight="400"
      {...props} 
    />
  );
}
