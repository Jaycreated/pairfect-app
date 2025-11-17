declare module 'react-native-animated-carousel' {
  import { ComponentType, Ref } from 'react';

  export interface CarouselProps {
    cardList: any[];
    renderItem: ({ item, index }: { item: any; index: number }) => JSX.Element;
    width: number;
    height: number;
    autoPlay?: boolean;
    autoPlayInterval?: number;
    scrollAnimationDuration?: number;
    onSnapToItem?: (index: number) => void;
    pagingEnabled?: boolean;
    snapEnabled?: boolean;
    mode?: 'parallax' | 'horizontal-stack' | 'vertical-stack';
    modeConfig?: {
      parallaxScrollingScale?: number;
      parallaxScrollingOffset?: number;
    };
    ref?: Ref<any>;
  }

  const Carousel: ComponentType<CarouselProps>;
  export default Carousel;
}
