import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  Cameraswitch as CameraSwitchIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import {
  QRScannerService,
  sortCamerasForQrScan,
  resolveInitialCameraIndex,
  storePreferredCameraId,
  type CameraDevice,
} from '../services/scanner';
import { assetService, type AssetDetail } from '../services/assets';
import type { AxiosError } from 'axios';

type ScanMode = 'idle' | 'scanning' | 'onboarding' | 'borrowing' | 'returning';

const SCANNER_ELEMENT_ID = 'qr-reader';
const AUTO_CAMERA_INTERVAL_MS = 3200;

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

  const [orderedCameras, setOrderedCameras] = useState<CameraDevice[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [autoCycleCameras, setAutoCycleCameras] = useState(false);
  /** Live preview only after an explicit user action (required for camera + video.play on Firefox / Safari). */
  const [cameraPreviewActive, setCameraPreviewActive] = useState(false);

  const cameraIndexRef = useRef(cameraIndex);
  const cameraPreviewActiveRef = useRef(cameraPreviewActive);
  cameraIndexRef.current = cameraIndex;
  cameraPreviewActiveRef.current = cameraPreviewActive;

  useEffect(() => {
    let cancelled = false;
    QRScannerService.listCameras()
      .then((raw) => {
        if (cancelled) return;
        const sorted = sortCamerasForQrScan(raw);
        setOrderedCameras(sorted);
        setCameraIndex(resolveInitialCameraIndex(sorted));
      })
      .catch((err) => {
        console.warn('[Scanner] Camera list failed', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.warn('[Scanner] stop()', e);
      }
      scannerRef.current = null;
    }
  }, []);

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

  const startScannerWithHandler = useCallback(
    async (cameraId: string | null) => {
      await stopScanner();
      const scanner = new QRScannerService();
      scannerRef.current = scanner;
      await scanner.start({
        elementId: SCANNER_ELEMENT_ID,
        cameraId: cameraId ?? undefined,
        onSuccess: handleScanSuccess,
      });
      setMode('scanning');
    },
    [handleScanSuccess, stopScanner],
  );

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (!autoCycleCameras || orderedCameras.length < 2 || !cameraPreviewActive) return;
    const id = window.setInterval(() => {
      void (async () => {
        if (!cameraPreviewActiveRef.current) return;
        const i = cameraIndexRef.current;
        const next = (i + 1) % orderedCameras.length;
        const nextCam = orderedCameras[next];
        if (!nextCam) return;
        storePreferredCameraId(nextCam.id);
        setCameraIndex(next);
        try {
          await startScannerWithHandler(nextCam.id);
        } catch (e) {
          console.warn('[Scanner] Auto-cycle camera switch failed', e);
          setAutoCycleCameras(false);
          setError(t('scanner.camera_autocycle_blocked'));
          setCameraPreviewActive(false);
          setMode('idle');
          await stopScanner();
        }
      })();
    }, AUTO_CAMERA_INTERVAL_MS);
    return () => clearInterval(id);
  }, [
    autoCycleCameras,
    orderedCameras,
    cameraPreviewActive,
    startScannerWithHandler,
    stopScanner,
    t,
  ]);

  const activeCameraId =
    orderedCameras.length > 0 ? orderedCameras[cameraIndex % orderedCameras.length]?.id : null;
  const activeCameraLabel =
    orderedCameras.length > 0
      ? orderedCameras[cameraIndex % orderedCameras.length]?.label
      : t('scanner.camera_default');

  const handleStartCamera = () => {
    void (async () => {
      try {
        setError('');
        await startScannerWithHandler(activeCameraId);
        setCameraPreviewActive(true);
      } catch (err) {
        console.error('[Scanner] Camera start failed', err);
        setError(t('scanner.camera_error'));
        setCameraPreviewActive(false);
        setMode('idle');
      }
    })();
  };

  const goToNextCamera = () => {
    if (orderedCameras.length < 2) return;
    const nextIdx = (cameraIndex + 1) % orderedCameras.length;
    const nextCam = orderedCameras[nextIdx];
    if (!nextCam) return;
    storePreferredCameraId(nextCam.id);
    setCameraIndex(nextIdx);
    if (!cameraPreviewActive) return;
    void (async () => {
      try {
        setError('');
        await startScannerWithHandler(nextCam.id);
      } catch (err) {
        console.error('[Scanner] Camera switch failed', err);
        setError(t('scanner.camera_error'));
      }
    })();
  };

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

        {(!cameraPreviewActive || isProcessing) && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.3)',
              gap: 2,
              px: 2,
            }}
          >
            {isProcessing ? (
              <CircularProgress sx={{ color: 'white' }} />
            ) : (
              <>
                <ScannerIcon sx={{ fontSize: 80, color: 'white' }} />
                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  startIcon={<VideocamIcon />}
                  onClick={handleStartCamera}
                  sx={{ fontWeight: 700 }}
                >
                  {t('scanner.start_camera')}
                </Button>
                <Typography variant="caption" color="common.white" sx={{ textAlign: 'center', opacity: 0.9 }}>
                  {t('scanner.start_camera_hint')}
                </Typography>
              </>
            )}
          </Box>
        )}
      </Card>

      <Stack spacing={1.5} sx={{ mt: 2, width: '100%', maxWidth: 400, alignItems: 'stretch' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          {t('scanner.current_camera')}: <strong>{activeCameraLabel}</strong>
        </Typography>

        <Button
          variant="outlined"
          size="medium"
          startIcon={<CameraSwitchIcon />}
          onClick={goToNextCamera}
          disabled={orderedCameras.length < 2}
        >
          {t('scanner.next_camera')}
        </Button>

        <FormControlLabel
          sx={{ mx: 0, justifyContent: 'center' }}
          control={
            <Switch
              checked={autoCycleCameras}
              onChange={(_, v) => setAutoCycleCameras(v)}
              disabled={orderedCameras.length < 2}
            />
          }
          label={t('scanner.auto_cycle_cameras')}
        />

        {orderedCameras.length < 2 && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('scanner.single_camera_hint')}
          </Typography>
        )}

        {autoCycleCameras && orderedCameras.length >= 2 && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('scanner.auto_cycle_hint')}
          </Typography>
        )}
      </Stack>

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
