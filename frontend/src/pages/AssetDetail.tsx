import { useCallback, useEffect, useState } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import { assetService, type AssetDetail as AssetDetailType } from '../services/assets';
import { borrowingService, type BorrowRecord } from '../services/borrowing';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default' | 'error'> = {
  AVAILABLE: 'success',
  BORROWED: 'warning',
  DELETED: 'default',
};

const BORROW_STATUS_COLORS: Record<string, 'info' | 'success'> = {
  ACTIVE: 'info',
  RETURNED: 'success',
};

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [asset, setAsset] = useState<AssetDetailType | null>(null);
  const [borrowHistory, setBorrowHistory] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAsset = useCallback(async () => {
    if (!id) return;
    try {
      const [assetRes, historyRes] = await Promise.all([
        assetService.getById(Number(id)),
        borrowingService.getAssetHistory(Number(id)),
      ]);
      setAsset(assetRes.data);
      setBorrowHistory(historyRes.data.results);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const handleDelete = async () => {
    if (!asset || !deleteReason.trim()) return;
    setIsDeleting(true);
    try {
      await assetService.softDelete(asset.id, deleteReason.trim());
      setDeleteDialogOpen(false);
      await loadAsset();
    } catch {
      setError(t('common.error'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!asset) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || t('common.error')}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/assets')} sx={{ mb: 2 }}>
        {t('common.back')}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {asset.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 2 }}>
                {asset.guid}
              </Typography>
              <Chip
                label={t(`assets.${asset.status.toLowerCase()}`)}
                color={STATUS_COLORS[asset.status] ?? 'default'}
              />
            </Box>

            {isAdmin && !asset.is_deleted && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                {t('common.delete')}
              </Button>
            )}
          </Box>

          {asset.is_deleted && asset.delete_reason && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 2 }}>
              {asset.delete_reason}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('assets.created_at')}
              </Typography>
              <Typography variant="body1">
                {new Date(asset.created_at).toLocaleString()}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('assets.updated_at')}
              </Typography>
              <Typography variant="body1">
                {new Date(asset.updated_at).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        {t('assets.borrow_history')}
      </Typography>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('borrowing.customer_search')}</TableCell>
              <TableCell>{t('borrowing.borrowed_from')}</TableCell>
              <TableCell>{t('borrowing.borrowed_until')}</TableCell>
              <TableCell>{t('returning.returned_at')}</TableCell>
              <TableCell>{t('assets.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {borrowHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('assets.no_assets')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              borrowHistory.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.customer.first_name} {record.customer.last_name}
                  </TableCell>
                  <TableCell>{new Date(record.borrowed_from).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {record.borrowed_until
                      ? new Date(record.borrowed_until).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {record.returned_at
                      ? new Date(record.returned_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={record.status}
                      color={BORROW_STATUS_COLORS[record.status] ?? 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('assets.delete_confirm')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('assets.delete_reason')}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={isDeleting || !deleteReason.trim()}
          >
            {isDeleting ? <CircularProgress size={20} color="inherit" /> : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
