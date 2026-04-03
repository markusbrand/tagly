import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { assetService, type AssetDetail } from '../services/assets';
import { borrowingService } from '../services/borrowing';
import { customerService, type Country, type Customer } from '../services/customers';
import { addPendingAction } from '../services/offlineStore';

interface CustomerForm {
  first_name: string;
  last_name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

const emptyForm: CustomerForm = {
  first_name: '',
  last_name: '',
  address: '',
  postal_code: '',
  city: '',
  country: '',
  phone: '',
  email: '',
};

function toLocalDateTimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'default'> = {
  AVAILABLE: 'success',
  BORROWED: 'warning',
  DELETED: 'default',
};

function customerAutocompleteLabel(c: Customer): string {
  return `${c.first_name} ${c.last_name} (${c.email || c.phone})`;
}

export default function AssetBorrow() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [borrowedFrom, setBorrowedFrom] = useState(toLocalDateTimeString(new Date()));
  const [borrowedUntil, setBorrowedUntil] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [assetRes, countriesRes] = await Promise.all([
          assetService.getById(Number(id)),
          customerService.getCountries(),
        ]);
        setAsset(assetRes.data);
        setCountries(countriesRes.data);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t]);

  const searchCustomers = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setCustomerOptions([]);
        return;
      }
      setCustomerSearchLoading(true);
      try {
        const res = await customerService.list({ search: query });
        setCustomerOptions(res.data.results);
      } catch {
        setCustomerOptions([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      // After selection, MUI sets the input to getOptionLabel(); that string does not match backend search
      // (e.g. "First Last (email@x)"), which would clear options and break the controlled Autocomplete state.
      if (
        selectedCustomer &&
        customerSearchQuery === customerAutocompleteLabel(selectedCustomer)
      ) {
        return;
      }
      void searchCustomers(customerSearchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerSearchQuery, searchCustomers, selectedCustomer]);

  const handleCustomerSelect = (_: unknown, value: Customer | null) => {
    setSelectedCustomer(value);
    if (value) {
      setForm({
        first_name: value.first_name ?? '',
        last_name: value.last_name ?? '',
        address: value.address ?? '',
        postal_code: value.postal_code ?? '',
        city: value.city ?? '',
        country: value.country ?? '',
        phone: value.phone ?? '',
        email: value.email ?? '',
      });
    } else {
      setForm(emptyForm);
    }
  };

  const updateField = (field: keyof CustomerForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    setError('');
    setIsSubmitting(true);

    try {
      let customerId: number;

      if (selectedCustomer) {
        const changed = Object.keys(form).some(
          (key) => form[key as keyof CustomerForm] !== selectedCustomer[key as keyof Customer]?.toString(),
        );
        if (changed) {
          const res = await customerService.update(selectedCustomer.id, form);
          customerId = res.data.id;
        } else {
          customerId = selectedCustomer.id;
        }
      } else {
        const res = await customerService.create(form);
        customerId = res.data.id;
      }

      await borrowingService.create({
        asset_id: asset.id,
        customer_id: customerId,
        borrowed_from: borrowedFrom ? new Date(borrowedFrom).toISOString() : undefined,
        borrowed_until: borrowedUntil ? new Date(borrowedUntil).toISOString() : undefined,
        notes: notes || undefined,
      });

      setSnackOpen(true);
      setTimeout(() => navigate('/scanner'), 1500);
    } catch (err) {
      if (!navigator.onLine) {
        await addPendingAction({
          method: 'POST',
          url: '/borrowing/create/',
          data: {
            asset_id: asset.id,
            customer: form,
            borrowed_from: borrowedFrom ? new Date(borrowedFrom).toISOString() : undefined,
            borrowed_until: borrowedUntil ? new Date(borrowedUntil).toISOString() : undefined,
            notes,
          },
        });
        setSnackOpen(true);
        setTimeout(() => navigate('/scanner'), 1500);
      } else {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setError(detail ?? t('common.error'));
        console.error('[Borrow] Submit failed', err);
      }
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

  if (!asset) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || t('common.error')}</Alert>
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
      <Box sx={{ width: '100%', maxWidth: 600, mb: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/scanner')} sx={{ mb: 1 }}>
          {t('common.back')}
        </Button>
      </Box>

      <Card elevation={2} sx={{ width: '100%', maxWidth: 600, borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {asset.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {asset.guid}
              </Typography>
            </Box>
            <Chip
              label={t(`assets.${asset.status.toLowerCase()}`)}
              color={STATUS_COLORS[asset.status] ?? 'default'}
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      <Card elevation={2} sx={{ width: '100%', maxWidth: 600, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            {t('borrowing.title')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Autocomplete
              options={customerOptions}
              getOptionLabel={customerAutocompleteLabel}
              loading={customerSearchLoading}
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              inputValue={customerSearchQuery}
              onInputChange={(_, val) => setCustomerSearchQuery(val)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('borrowing.customer_search')}
                  fullWidth
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {customerSearchLoading && <CircularProgress size={20} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
              noOptionsText={customerSearchQuery.length < 2 ? '' : t('assets.no_assets')}
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              {t('borrowing.customer_search')}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('borrowing.first_name')}
                  value={form.first_name}
                  onChange={updateField('first_name')}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('borrowing.last_name')}
                  value={form.last_name}
                  onChange={updateField('last_name')}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('borrowing.address')}
                  value={form.address}
                  onChange={updateField('address')}
                  required
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label={t('borrowing.postal_code')}
                  value={form.postal_code}
                  onChange={updateField('postal_code')}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label={t('borrowing.city')}
                  value={form.city}
                  onChange={updateField('city')}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('borrowing.country')}
                  value={form.country}
                  onChange={updateField('country')}
                  required
                  fullWidth
                  select
                >
                  {countries.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('borrowing.phone')}
                  value={form.phone}
                  onChange={updateField('phone')}
                  required
                  fullWidth
                  placeholder="+49 123 456789"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label={t('borrowing.email')}
                  value={form.email}
                  onChange={updateField('email')}
                  fullWidth
                  type="email"
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              {t('borrowing.title')}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('borrowing.borrowed_from')}
                  type="datetime-local"
                  value={borrowedFrom}
                  onChange={(e) => setBorrowedFrom(e.target.value)}
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('borrowing.borrowed_until')}
                  type="datetime-local"
                  value={borrowedUntil}
                  onChange={(e) => setBorrowedUntil(e.target.value)}
                  required
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

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting || !form.first_name || !form.last_name || !borrowedUntil}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('borrowing.confirm')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={t('borrowing.success')}
      />
    </Box>
  );
}
