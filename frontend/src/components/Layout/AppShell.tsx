import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DarkMode,
  LightMode,
  Dashboard as DashboardIcon,
  Inventory2 as AssetsIcon,
  QrCodeScanner as ScannerIcon,
  AdminPanelSettings as AdminIcon,
  QrCode2 as QrStickerIcon,
  AccountCircle,
  Translate,
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import BottomNav from './BottomNav';

const DRAWER_WIDTH = 260;

const LANGUAGES: Record<string, string> = { en: 'English', de: 'Deutsch' };

export default function AppShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleMode } = useThemeMode();
  const { logout, isAdmin } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);

  const navItems = [
    { label: t('nav.dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { label: t('nav.assets'), icon: <AssetsIcon />, path: '/assets' },
    { label: t('nav.scanner'), icon: <ScannerIcon />, path: '/scanner' },
    { label: t('nav.qr_stickers'), icon: <QrStickerIcon />, path: '/qr-generate' },
    ...(isAdmin
      ? [{ label: t('nav.admin'), icon: <AdminIcon />, path: '/admin' }]
      : []),
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH, pt: 2 }}>
      <Typography variant="h5" sx={{ px: 2, mb: 2, fontWeight: 700 }}>
        {t('common.app_name')}
      </Typography>
      <Divider />
      <List>
        {navItems.map(({ label, icon, path }) => (
          <ListItemButton
            key={path}
            selected={location.pathname === path || location.pathname.startsWith(path + '/')}
            onClick={() => handleNav(path)}
            sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}

            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              {isMobile ? t('common.app_name') : ''}
            </Typography>

            <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
              <IconButton onClick={toggleMode} color="inherit">
                {mode === 'light' ? <DarkMode /> : <LightMode />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Language">
              <IconButton onClick={(e) => setLangAnchor(e.currentTarget)} color="inherit">
                <Translate />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={langAnchor}
              open={Boolean(langAnchor)}
              onClose={() => setLangAnchor(null)}
            >
              {Object.entries(LANGUAGES).map(([code, label]) => (
                <MenuItem
                  key={code}
                  selected={i18n.language?.startsWith(code)}
                  onClick={() => {
                    i18n.changeLanguage(code);
                    setLangAnchor(null);
                  }}
                >
                  {label}
                </MenuItem>
              ))}
            </Menu>

            <Tooltip title={t('auth.logout_button')}>
              <IconButton onClick={(e) => setUserAnchor(e.currentTarget)} color="inherit">
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userAnchor}
              open={Boolean(userAnchor)}
              onClose={() => setUserAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setUserAnchor(null);
                  logout();
                }}
              >
                {t('auth.logout_button')}
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            pb: isMobile ? 10 : 3,
          }}
        >
          <Outlet />
        </Box>

        {isMobile && <BottomNav />}
      </Box>
    </Box>
  );
}
