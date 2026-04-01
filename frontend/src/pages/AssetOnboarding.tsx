import { type FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  QrCodeScanner as ScannerIcon,
  Visibility as DetailIcon,
  CloudOff as OfflineIcon,
} from '@mui/icons-material';
import { assetService } from '../services/assets';
import { addPendingAction } from '../services/offlineStore';
import type { AxiosError } from 'axios';

export default function AssetOnboarding() {
  const { guid } = useParams<{ guid: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState<number | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const decodedGuid = guid ? decodeURIComponent(guid) : '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!decodedGuid || !name.trim()) return;

    setError('');
    setIsSubmitting(true);

    try {
      const response = await assetService.create({ name: name.trim() });
      setCreatedAssetId(response.data.id);
      setSnackOpen(true);
    } catch (err) {
      const axiosErr = err as AxiosError;

      if (!axiosErr.response && !navigator.onLine) {
        await addPendingAction({
          method: 'POST',
          url: '/assets/',
          data: { name: name.trim(), guid: decodedGuid },
        });
        setSavedOffline(true);
        setSnackOpen(true);
      } else {
        setError(
          (axiosErr.response?.data as { detail?: string })?.detail ?? t('common.error'),
        );
        console.error('[Onboarding] Create failed', axiosErr.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = createdAssetId !== null || savedOffline;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: { xs: 2, md: 4 },
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 480, mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/scanner')}
          sx={{ mb: 1 }}
        >
          {t('common.back')}
        </Button>
      </Box>

      <Card elevation={2} sx={{ width: '100%', maxWidth: 480, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            {t('onboarding.title')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {savedOffline && (
            <Alert severity="info" icon={<OfflineIcon />} sx={{ mb: 2 }}>
              {t('onboarding.saved_offline')}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label={t('onboarding.guid_label')}
              value={decodedGuid}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
            />

            <TextField
              label={t('onboarding.name_label')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              autoFocus
              disabled={isSubmitting || isSuccess}
            />

            {!isSuccess && (
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting || !name.trim()}
                sx={{ mt: 1 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('onboarding.save')
                )}
              </Button>
            )}

            {isSuccess && (
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<ScannerIcon />}
                  onClick={() => navigate('/scanner')}
                  sx={{ flex: 1 }}
                >
                  {t('scanner.scan_qr')}
                </Button>
                {createdAssetId && (
                  <Button
                    variant="outlined"
                    startIcon={<DetailIcon />}
                    onClick={() => navigate(`/assets/${createdAssetId}`)}
                    sx={{ flex: 1 }}
                  >
                    {t('common.edit')}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackOpen}
        autoHideDuration={4000}
        onClose={() => setSnackOpen(false)}
        message={savedOffline ? t('onboarding.saved_offline') : t('onboarding.success')}
      />
    </Box>
  );
}
