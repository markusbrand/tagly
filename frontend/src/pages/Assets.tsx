import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { Download as DownloadIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { assetService, type Asset } from '../services/assets';
import api from '../services/api';

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  AVAILABLE: 'success',
  BORROWED: 'warning',
  DELETED: 'default',
};

const PAGE_SIZE = 20;

export default function Assets() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAssets = useCallback(async (params: {
    search: string;
    status: string;
    include_deleted: boolean;
    page: number;
  }) => {
    setLoading(true);
    try {
      const queryParams: Record<string, string> = {
        page: String(params.page + 1),
        page_size: String(PAGE_SIZE),
      };
      if (params.search) queryParams.search = params.search;
      if (params.status) queryParams.status = params.status;
      if (params.include_deleted) queryParams.include_deleted = 'true';

      const res = await assetService.list(queryParams);
      setAssets(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error('[Assets] Failed to load', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAssets({ search, status: statusFilter, include_deleted: includeDeleted, page });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, statusFilter, includeDeleted, page, fetchAssets]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (includeDeleted) params.include_deleted = 'true';

      const res = await api.get('/assets/export/', { params, responseType: 'blob' });
      const blob = new Blob([res.data as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `assets-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Assets] Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  const truncateGuid = (guid: string) => (guid.length > 12 ? `${guid.slice(0, 12)}…` : guid);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        {t('nav.assets')}
      </Typography>

      <Toolbar
        disableGutters
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
          px: 0,
        }}
      >
        <TextField
          label={t('assets.search')}
          value={search}
          onChange={handleSearchChange}
          size="small"
          sx={{ minWidth: 200, flex: 1 }}
        />
        <TextField
          label={t('assets.status_filter')}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          size="small"
          select
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">{t('assets.all')}</MenuItem>
          <MenuItem value="AVAILABLE">{t('assets.available')}</MenuItem>
          <MenuItem value="BORROWED">{t('assets.borrowed')}</MenuItem>
        </TextField>
        <FormControlLabel
          control={
            <Checkbox
              checked={includeDeleted}
              onChange={(e) => {
                setIncludeDeleted(e.target.checked);
                setPage(0);
              }}
            />
          }
          label={t('assets.include_deleted')}
        />
        <Button
          variant="outlined"
          startIcon={exporting ? <CircularProgress size={18} /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? t('export.exporting') : t('export.button')}
        </Button>
      </Toolbar>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('assets.name')}</TableCell>
              <TableCell>{t('assets.guid')}</TableCell>
              <TableCell>{t('assets.status')}</TableCell>
              <TableCell>{t('assets.created_at')}</TableCell>
              <TableCell>{t('assets.updated_at')}</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">{t('assets.no_assets')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow
                  key={asset.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/assets/${asset.id}`)}
                >
                  <TableCell>{asset.name}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{truncateGuid(asset.guid)}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(`assets.${asset.status.toLowerCase()}`)}
                      color={STATUS_COLORS[asset.status] ?? 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(asset.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(asset.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/assets/${asset.id}`);
                      }}
                    >
                      {t('assets.view_detail')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
        />
      </TableContainer>
    </Box>
  );
}
