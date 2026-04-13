import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTheme, type SxProps, type Theme } from '@mui/material/styles';
import { useAuth } from './AuthContext';

interface AppearanceContextValue {
  /** Outer `<main>`: positioning + background layers (no padding). */
  mainOuterSx: SxProps<Theme>;
  /** Inner wrapper: padding + text color (above background image). */
  mainInnerSx: SxProps<Theme>;
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const theme = useTheme();

  const { mainOuterSx, mainInnerSx } = useMemo(() => {
    const outer: Record<string, unknown> = {};
    const inner: Record<string, unknown> = {};

    if (user?.appearance_font_color) {
      inner.color = user.appearance_font_color;
    }

    const bgImageUrl = user?.appearance_bg_image ?? '';
    const hasImage = bgImageUrl.length > 0;
    const transparency = Math.min(
      100,
      Math.max(0, user?.appearance_bg_image_transparency ?? 50),
    );
    const imageOpacity = 1 - transparency / 100;

    if (hasImage) {
      outer.position = 'relative';
      outer.backgroundColor =
        user?.appearance_bg_color || theme.palette.background.default;
      outer['&::before'] = {
        content: '""',
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: `url(${bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: imageOpacity,
        pointerEvents: 'none',
      };
    } else if (user?.appearance_bg_color) {
      outer.backgroundColor = user.appearance_bg_color;
    }

    inner.position = 'relative';
    inner.zIndex = 1;
    inner.flexGrow = 1;

    return {
      mainOuterSx: outer as SxProps<Theme>,
      mainInnerSx: inner as SxProps<Theme>,
    };
  }, [user, theme.palette.background.default]);

  const value = useMemo(() => ({ mainOuterSx, mainInnerSx }), [mainOuterSx, mainInnerSx]);

  return <AppearanceContext value={value}>{children}</AppearanceContext>;
}

// eslint-disable-next-line react-refresh/only-export-components -- useAppearance exported next to AppearanceProvider (context pattern)
export function useAppearance(): AppearanceContextValue {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
