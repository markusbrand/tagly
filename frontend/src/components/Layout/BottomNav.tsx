import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory2 as AssetsIcon,
  QrCodeScanner as ScannerIcon,
} from '@mui/icons-material';

const routes = ['/dashboard', '/assets', '/scanner'] as const;

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const currentIndex = routes.indexOf(
    routes.find((r) => location.pathname.startsWith(r)) ?? '/dashboard',
  );

  return (
    <Paper
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }}
      elevation={3}
    >
      <BottomNavigation
        showLabels
        value={currentIndex}
        onChange={(_event, newValue: number) => navigate(routes[newValue])}
      >
        <BottomNavigationAction label={t('nav.dashboard')} icon={<DashboardIcon />} />
        <BottomNavigationAction label={t('nav.assets')} icon={<AssetsIcon />} />
        <BottomNavigationAction label={t('nav.scanner')} icon={<ScannerIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
