import { Text as DefaultText, TextProps } from 'react-native';

interface PoppinsTextProps extends TextProps {
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
}

export function PoppinsText({ 
  style, 
  weight = 'regular',
  ...props 
}: PoppinsTextProps) {
  const fontFamily = {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  }[weight];

  return (
    <DefaultText
      style={[{ fontFamily }, style]}
      {...props}
    />
  );
}
