// src/types.d.ts

export {};

declare global {
  interface Window {
    deviceInfo?: {
      isIOS: boolean;
      isAndroid: boolean;
      isMobile: boolean;
      isTablet: boolean;
      isDesktop: boolean;
      isTouchDevice: boolean;
      isLandscape: boolean;
      userAgent: string;
    };
    MSStream?: any;
    deferredPrompt?: any;
    isMobile?: () => boolean;
    isTablet?: () => boolean;
    isDesktop?: () => boolean;
  }
}
