import { type FormEvent, useCallback, useEffect, useState } from 'react';
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
import type { AxiosError } from 'axios';
import { AssetCustomFieldInputs } from '../components/AssetCustomFieldInputs';
import { buildCustomFieldsPayload } from '../utils/assetCustomFieldPayload';
import { flattenDrfDetail, firstDrfFieldMessage } from '../utils/drfErrorDetail';
import { assetService } from '../services/assets';
import { authService } from '../services/auth';
import { customFieldsService, type CustomFieldDefinition } from '../services/customFields';
import { addPendingAction } from '../services/offlineStore';
import {
  initialValueForField,
  validateAssetCustomFieldValuesForCreate,
} from '../utils/assetCustomFieldValidation';

export default function AssetOnboarding() {
  const { guid } = useParams<{ guid: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [loadingFields, setLoadingFields] = useState(true);

  const [assetName, setAssetName] = useState('');
  const [nameError, setNameError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState<number | null>(null);
  const [savedOffline, setSavedOffline] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);

  const decodedGuid = guid ? decodeURIComponent(guid) : '';

  const setFieldValue = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingFields(true);
      setLoadError('');
      try {
        const res = await customFieldsService.listDefinitions('ASSET');
        const sorted = [...res.data.results].sort((a, b) => a.display_order - b.display_order);
        if (cancelled) return;
        setDefinitions(sorted);
        const initial: Record<string, unknown> = {};
        for (const d of sorted) {
          initial[String(d.id)] = initialValueForField(d.field_type);
        }
        setValues(initial);
      } catch (err) {
        console.error('[Onboarding] Failed to load custom fields', err);
        if (!cancelled) setLoadError(t('common.error'));
      } finally {
        if (!cancelled) setLoadingFields(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!decodedGuid) return;

    setError('');
    setNameError('');
    setFieldErrors({});

    const trimmedName = assetName.trim();
    if (!trimmedName) {
      setNameError(t('onboarding.name_required'));
      return;
    }

    const localErrors = validateAssetCustomFieldValuesForCreate(definitions, values);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    const customFields = buildCustomFieldsPayload(definitions, values);

    setIsSubmitting(true);

    try {
      try {
        await authService.getCsrfToken();
      } catch (e) {
        console.warn('[Onboarding] CSRF refresh before create failed', e);
      }
      const response = await assetService.create({
        name: trimmedName,
        guid: decodedGuid,
        custom_fields: customFields,
      });
      setCreatedAssetId(response.data.id);
      setSnackOpen(true);
    } catch (err) {
      const axiosErr = err as AxiosError<Record<string, unknown>>;

      if (!axiosErr.response && !navigator.onLine) {
        await addPendingAction({
          method: 'POST',
          url: '/assets/',
          data: { name: trimmedName, guid: decodedGuid, custom_fields: customFields },
        });
        setSavedOffline(true);
        setSnackOpen(true);
      } else {
        const raw = axiosErr.response?.data;
        const data = raw && typeof raw === 'object' ? raw : undefined;
        let hasCustomFieldApiErrors = false;

        if (data?.custom_fields && typeof data.custom_fields === 'object') {
          hasCustomFieldApiErrors = true;
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.custom_fields as Record<string, unknown>)) {
            flat[k] = Array.isArray(v) ? v.map(String).join(' ') : String(v);
          }
          setFieldErrors(flat);
        }

        const status = axiosErr.response?.status;
        let message = '';

        let nameFieldErr = '';
        if (data?.name) {
          const nm = data.name as unknown;
          nameFieldErr = Array.isArray(nm) ? nm.map(String).join(' ') : String(nm);
        }
        setNameError(nameFieldErr);

        if (status === 403 && data) {
          const d = flattenDrfDetail(data.detail);
          if (/csrf/i.test(d)) {
            message = t('onboarding.error_csrf');
          }
        }

        if (!message) {
          message =
            firstDrfFieldMessage(data, ['custom_fields']) || flattenDrfDetail(data?.detail);
        }

        if (!message && !axiosErr.response) {
          message = t('onboarding.error_network');
        }

        if (!message && hasCustomFieldApiErrors) {
          message = t('onboarding.error_fix_fields');
        }

        if (!message && !nameFieldErr) {
          message = t('common.error');
        }

        setError(message);
        console.error('[Onboarding] Create failed', status, axiosErr.message, raw);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuccess = createdAssetId !== null || savedOffline;
  const canSubmit =
    !loadingFields &&
    !loadError &&
    decodedGuid.length > 0 &&
    assetName.trim().length > 0 &&
    !isSuccess;

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
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
            {t('onboarding.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {t('onboarding.stammdaten_hint')}
          </Typography>

          {loadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}

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

          {loadingFields ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label={t('onboarding.guid_label')}
                value={decodedGuid}
                fullWidth
                slotProps={{ input: { readOnly: true } }}
              />

              <TextField
                label={t('onboarding.name_label')}
                value={assetName}
                onChange={(e) => {
                  setAssetName(e.target.value);
                  setNameError('');
                }}
                helperText={nameError || t('onboarding.name_helper')}
                error={Boolean(nameError)}
                required
                fullWidth
                disabled={isSubmitting || isSuccess}
                inputProps={{ maxLength: 255 }}
              />

              {definitions.length === 0 ? (
                <Alert severity="info">{t('onboarding.no_custom_fields')}</Alert>
              ) : (
                <AssetCustomFieldInputs
                  definitions={definitions}
                  values={values}
                  onChange={setFieldValue}
                  errors={fieldErrors}
                  disabled={isSubmitting || isSuccess}
                />
              )}

              {!isSuccess && (
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isSubmitting || !canSubmit}
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
          )}
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
