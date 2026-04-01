import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';

export default function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h1" sx={{ fontSize: '6rem', fontWeight: 800, color: 'text.secondary' }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary">
        Page not found
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
        {t('common.back')}
      </Button>
    </Box>
  );
}
