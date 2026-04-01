import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Warning as WarningIcon } from '@mui/icons-material';
import { assetService, type AssetDetail } from '../services/assets';
import { borrowingService, type BorrowRecord } from '../services/borrowing';

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AssetReturn() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [activeBorrow, setActiveBorrow] = useState<BorrowRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const [returnedAt, setReturnedAt] = useState(toLocalDateTimeString(new Date()));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const assetRes = await assetService.getById(Number(id));
        setAsset(assetRes.data);

        const historyRes = await borrowingService.getAssetHistory(Number(id));
        const active = historyRes.data.results.find((r) => r.status === 'ACTIVE');
        if (active) {
          setActiveBorrow(active);
        }
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t]);

  const isOverdue =
    activeBorrow?.borrowed_until && new Date(activeBorrow.borrowed_until) < new Date();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeBorrow) return;

    setError('');
    setIsSubmitting(true);

    try {
      await borrowingService.return(activeBorrow.id, {
        returned_at: returnedAt ? new Date(returnedAt).toISOString() : undefined,
        notes: notes || undefined,
      });
      setSnackOpen(true);
      setTimeout(() => navigate('/scanner'), 1500);
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? t('common.error'));
      console.error('[Return] Submit failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!asset || !activeBorrow) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || t('common.error')}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/scanner')} sx={{ mt: 2 }}>
          {t('common.back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: { xs: 2, md: 4 },
        px: 2,
        pb: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/scanner')} sx={{ mb: 1 }}>
          {t('common.back')}
        </Button>
      </Box>

      <Card elevation={2} sx={{ width: '100%', maxWidth: 500, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" fontWeight={700}>
            {asset.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {asset.guid}
          </Typography>
        </CardContent>
      </Card>

      {isOverdue && (
        <Alert severity="error" icon={<WarningIcon />} sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
          {t('returning.overdue_warning')}
        </Alert>
      )}

      <Card elevation={2} sx={{ width: '100%', maxWidth: 500, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            {t('returning.title')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {t('returning.current_borrower')}
            </Typography>
            <Typography variant="body1" fontWeight={600}>
              {activeBorrow.customer.first_name} {activeBorrow.customer.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeBorrow.customer.email}
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('returning.borrowed_since')}
              </Typography>
              <Typography variant="body2">
                {new Date(activeBorrow.borrowed_from).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('returning.due_date')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2">
                  {activeBorrow.borrowed_until
                    ? new Date(activeBorrow.borrowed_until).toLocaleDateString()
                    : '—'}
                </Typography>
                {isOverdue && <Chip label={t('assets.overdue')} color="error" size="small" />}
              </Box>
            </Grid>
          </Grid>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('returning.returned_at')}
                  type="datetime-local"
                  value={returnedAt}
                  onChange={(e) => setReturnedAt(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('borrowing.notes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/scanner')}
                sx={{ flex: 1 }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{ flex: 1 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('returning.confirm')
                )}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={t('returning.success')}
      />
    </Box>
  );
}
