import { createTheme, type Theme } from '@mui/material/styles';

const sharedTypography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, fontSize: '2.25rem' },
  h2: { fontWeight: 700, fontSize: '1.875rem' },
  h3: { fontWeight: 600, fontSize: '1.5rem' },
  h4: { fontWeight: 600, fontSize: '1.25rem' },
  h5: { fontWeight: 500, fontSize: '1.125rem' },
  h6: { fontWeight: 500, fontSize: '1rem' },
  button: { textTransform: 'none' as const, fontWeight: 600 },
};

const sharedComponents = {
  MuiButton: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 16 },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: 12 },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined' as const,
      size: 'medium' as const,
    },
  },
};

export function getTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
            secondary: { main: '#9c27b0', light: '#ba68c8', dark: '#7b1fa2' },
            background: { default: '#f5f5f5', paper: '#ffffff' },
          }
        : {
            primary: { main: '#90caf9', light: '#e3f2fd', dark: '#42a5f5' },
            secondary: { main: '#ce93d8', light: '#f3e5f5', dark: '#ab47bc' },
            background: { default: '#121212', paper: '#1e1e1e' },
          }),
    },
    typography: sharedTypography,
    shape: { borderRadius: 12 },
    components: sharedComponents,
  });
}
