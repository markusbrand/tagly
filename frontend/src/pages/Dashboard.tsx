import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Inventory2 as TotalIcon,
  CheckCircle as AvailableIcon,
  SwapHoriz as BorrowedIcon,
  Warning as OverdueIcon,
} from '@mui/icons-material';
import { assetService } from '../services/assets';
import { borrowingService, type BorrowRecord } from '../services/borrowing';

interface StatCardProps {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card elevation={2}>
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 3,
        }}
      >
        <Box
          sx={{
            bgcolor: color,
            color: '#fff',
            borderRadius: 3,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {value === null ? (
            <Skeleton width={60} height={40} />
          ) : (
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();

  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [borrowedCount, setBorrowedCount] = useState<number | null>(null);
  const [overdueCount, setOverdueCount] = useState<number | null>(null);
  const [recentBorrows, setRecentBorrows] = useState<BorrowRecord[]>([]);
  const [overdueBorrows, setOverdueBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [totalRes, availableRes, borrowedRes, overdueRes, recentRes] = await Promise.all([
          assetService.list(),
          assetService.list({ status: 'AVAILABLE' }),
          assetService.list({ status: 'BORROWED' }),
          borrowingService.list({ overdue: 'true' }),
          borrowingService.list({ status: 'ACTIVE' }),
        ]);
        setTotalCount(totalRes.data.count);
        setAvailableCount(availableRes.data.count);
        setBorrowedCount(borrowedRes.data.count);
        setOverdueCount(overdueRes.data.count);
        setRecentBorrows(recentRes.data.results.slice(0, 5));
        setOverdueBorrows(overdueRes.data.results);
      } catch (err) {
        console.error('[Dashboard] Failed to load stats', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats: StatCardProps[] = [
    { title: t('dashboard.total_assets'), value: totalCount, icon: <TotalIcon />, color: '#1976d2' },
    { title: t('dashboard.in_inventory'), value: availableCount, icon: <AvailableIcon />, color: '#2e7d32' },
    { title: t('dashboard.currently_borrowed'), value: borrowedCount, icon: <BorrowedIcon />, color: '#ed6c02' },
    { title: t('dashboard.overdue_items'), value: overdueCount, icon: <OverdueIcon />, color: '#d32f2f' },
  ];

  const isOverdue = (record: BorrowRecord) =>
    record.borrowed_until && new Date(record.borrowed_until) < new Date();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        {t('nav.dashboard')}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
        {t('dashboard.recent_borrows')}
      </Typography>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('assets.name')}</TableCell>
              <TableCell>{t('borrowing.customer_search')}</TableCell>
              <TableCell>{t('borrowing.borrowed_from')}</TableCell>
              <TableCell>{t('returning.due_date')}</TableCell>
              <TableCell>{t('assets.status')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : recentBorrows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{t('assets.no_assets')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              recentBorrows.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.asset.name}</TableCell>
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
                    {isOverdue(record) ? (
                      <Chip label={t('assets.overdue')} color="error" size="small" />
                    ) : (
                      <Chip label={t('assets.borrowed')} color="warning" size="small" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {overdueBorrows.length > 0 && (
        <>
          <Typography variant="h5" fontWeight={700} color="error" sx={{ mb: 2 }}>
            {t('dashboard.overdue_assets')}
          </Typography>

          <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2, border: '2px solid', borderColor: 'error.main' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'error.main' }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{t('assets.name')}</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{t('borrowing.customer_search')}</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{t('returning.due_date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overdueBorrows.map((record) => (
                  <TableRow key={record.id} sx={{ bgcolor: 'error.50' }}>
                    <TableCell>{record.asset.name}</TableCell>
                    <TableCell>
                      {record.customer.first_name} {record.customer.last_name}
                      {record.customer.email && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {record.customer.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.borrowed_until
                        ? new Date(record.borrowed_until).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
