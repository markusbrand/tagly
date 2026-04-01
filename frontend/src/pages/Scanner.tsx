import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Card,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import { QrCodeScanner as ScannerIcon } from '@mui/icons-material';
import { QRScannerService } from '../services/scanner';
import { assetService, type AssetDetail } from '../services/assets';
import type { AxiosError } from 'axios';

type ScanMode = 'idle' | 'scanning' | 'onboarding' | 'borrowing' | 'returning';

const SCANNER_ELEMENT_ID = 'qr-reader';

const MODE_CHIP_COLORS: Record<string, 'success' | 'primary' | 'warning'> = {
  onboarding: 'success',
  borrowing: 'primary',
  returning: 'warning',
};

export default function Scanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scannerRef = useRef<QRScannerService | null>(null);
  const [mode, setMode] = useState<ScanMode>('idle');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const processedRef = useRef(false);

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      if (processedRef.current) return;
      processedRef.current = true;
      setIsProcessing(true);
      setError('');

      try {
        const response = await assetService.getByGuid(decodedText);
        const asset: AssetDetail = response.data;

        if (asset.status === 'BORROWED') {
          setMode('returning');
          navigate(`/scanner/return/${asset.id}`);
        } else {
          setMode('borrowing');
          navigate(`/scanner/borrow/${asset.id}`);
        }
      } catch (err) {
        const axiosErr = err as AxiosError;
        if (axiosErr.response?.status === 404) {
          setMode('onboarding');
          navigate(`/scanner/onboard/${encodeURIComponent(decodedText)}`);
        } else {
          setError(t('scanner.invalid_qr'));
          processedRef.current = false;
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [navigate, t],
  );

  useEffect(() => {
    const scanner = new QRScannerService();
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        setMode('scanning');
        await scanner.start({
          elementId: SCANNER_ELEMENT_ID,
          onSuccess: handleScanSuccess,
          onError: (errMsg) => setError(errMsg),
        });
      } catch (err) {
        console.error('[Scanner] Camera start failed', err);
        setError(t('scanner.camera_error'));
        setMode('idle');
      }
    };

    startScanner();

    return () => {
      scanner.stop().catch((err) =>
        console.warn('[Scanner] Stop failed during cleanup', err),
      );
    };
  }, [handleScanSuccess, t]);

  const modeKey = mode !== 'idle' && mode !== 'scanning' ? mode : null;

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
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        {t('scanner.scan_qr')}
      </Typography>

      {modeKey && (
        <Chip
          label={t(`scanner.mode_${modeKey}`)}
          color={MODE_CHIP_COLORS[modeKey]}
          sx={{ mb: 2, fontWeight: 600 }}
        />
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, width: '100%', maxWidth: 400 }}>
          {error}
        </Alert>
      )}

      <Card
        elevation={2}
        sx={{
          width: '100%',
          maxWidth: 400,
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 3,
        }}
      >
        <Box
          id={SCANNER_ELEMENT_ID}
          sx={{
            width: '100%',
            minHeight: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />

        {(mode === 'idle' || isProcessing) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.3)',
            }}
          >
            {isProcessing ? (
              <CircularProgress sx={{ color: 'white' }} />
            ) : (
              <ScannerIcon sx={{ fontSize: 80, color: 'white', mb: 2 }} />
            )}
          </Box>
        )}
      </Card>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 2, textAlign: 'center' }}
      >
        {t('scanner.scanning_hint')}
      </Typography>
    </Box>
  );
}
