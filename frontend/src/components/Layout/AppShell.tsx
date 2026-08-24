import { useEffect, useState } from 'react';
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
  Palette as PaletteIcon,
  Translate,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { useThemeMode } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useAppearance } from '../../context/AppearanceContext';
import AppearanceDialog from '../AppearanceDialog';
import BottomNav from './BottomNav';

const DRAWER_EXPANDED_WIDTH = 260;
const DRAWER_COLLAPSED_WIDTH = 72;
const NAV_DRAWER_STORAGE_KEY = 'tagly-nav-drawer-collapsed';

const LANGUAGES: Record<string, string> = { en: 'English', de: 'Deutsch' };

export default function AppShell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleMode } = useThemeMode();
  const { logout, isAdmin } = useAuth();
  const { mainOuterSx, mainInnerSx } = useAppearance();

  const [navCollapsed, setNavCollapsed] = useState(() => {
    try {
      return localStorage.getItem(NAV_DRAWER_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(NAV_DRAWER_STORAGE_KEY, navCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [navCollapsed]);

  const railCollapsed = !isMobile && navCollapsed;
  const drawerWidth = railCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_EXPANDED_WIDTH;

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
    <Box sx={{ width: drawerWidth, pt: 1, transition: theme.transitions.create('width') }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: railCollapsed ? 'center' : 'space-between',
          px: railCollapsed ? 0.5 : 1,
          mb: 1,
          minHeight: 40,
        }}
      >
        {!railCollapsed && (
          <Typography variant="h5" sx={{ pl: 1, fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('common.app_name')}
          </Typography>
        )}
        {!isMobile && (
          <Tooltip title={railCollapsed ? t('nav.expand_drawer') : t('nav.collapse_drawer')}>
            <IconButton
              size="small"
              onClick={() => setNavCollapsed((c) => !c)}
              aria-label={railCollapsed ? t('nav.expand_drawer') : t('nav.collapse_drawer')}
            >
              {railCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider />
      <List sx={{ px: railCollapsed ? 0.25 : 0, pt: 1 }}>
        {navItems.map(({ label, icon, path }) => (
          <Tooltip
            key={path}
            title={label}
            placement="right"
            disableHoverListener={!railCollapsed}
            disableFocusListener={!railCollapsed}
            disableTouchListener={!railCollapsed}
          >
            <ListItemButton
              selected={location.pathname === path || location.pathname.startsWith(path + '/')}
              onClick={() => handleNav(path)}
              sx={{
                borderRadius: 2,
                mx: railCollapsed ? 0.5 : 1,
                my: 0.5,
                justifyContent: railCollapsed ? 'center' : 'flex-start',
                px: railCollapsed ? 1 : 2,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: railCollapsed ? 0 : 56,
                  justifyContent: 'center',
                  color: 'inherit',
                }}
              >
                {icon}
              </ListItemIcon>
              {!railCollapsed && <ListItemText primary={label} />}
            </ListItemButton>
          </Tooltip>
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
            width: drawerWidth,
            flexShrink: 0,
            transition: theme.transitions.create('width'),
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              transition: theme.transitions.create('width'),
              overflowX: 'hidden',
            },
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
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_EXPANDED_WIDTH } }}
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
                  setAppearanceOpen(true);
                }}
              >
                <PaletteIcon fontSize="small" sx={{ mr: 1 }} />
                {t('appearance.title')}
              </MenuItem>
              <Divider />
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
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            ...mainOuterSx,
          }}
        >
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              pb: isMobile ? 10 : 3,
              ...mainInnerSx,
            }}
          >
            <Outlet />
          </Box>
        </Box>

        {isMobile && <BottomNav />}
      </Box>

      <AppearanceDialog open={appearanceOpen} onClose={() => setAppearanceOpen(false)} />
    </Box>
  );
}
