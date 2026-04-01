import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Tab, Tabs, Typography } from '@mui/material';

const ADMIN_TABS = [
  { key: 'custom-fields', i18nKey: 'admin.custom_fields' },
  { key: 'sticker-templates', i18nKey: 'admin.sticker_templates' },
  { key: 'users', i18nKey: 'admin.user_management' },
] as const;

function tabIndexFromPath(pathname: string): number {
  const segment = pathname.split('/admin/')[1]?.split('/')[0] ?? '';
  const idx = ADMIN_TABS.findIndex((tab) => tab.key === segment);
  return idx >= 0 ? idx : 0;
}

export default function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = tabIndexFromPath(location.pathname);

  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/admin/') {
      navigate('/admin/custom-fields', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(`/admin/${ADMIN_TABS[newValue].key}`);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        {t('admin.title')}
      </Typography>
      <Tabs
        value={currentTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {ADMIN_TABS.map((tab) => (
          <Tab key={tab.key} label={t(tab.i18nKey)} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
