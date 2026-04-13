import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  RestartAlt as ResetIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AppearanceDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  const [fontColor, setFontColor] = useState('');
  const [bgColor, setBgColor] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageTransparency, setImageTransparency] = useState(50);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackOpen, setSnackOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const hasImagePreview = Boolean(previewUrl);
  const previewBackdrop = bgColor || '#e0e0e0';
  const previewImageOpacity = 1 - imageTransparency / 100;

  useEffect(() => {
    if (open && user) {
      setFontColor(user.appearance_font_color || '');
      setBgColor(user.appearance_bg_color || '');
      setPreviewUrl(user.appearance_bg_image || '');
      setPendingFile(null);
      setImageTransparency(
        typeof user.appearance_bg_image_transparency === 'number'
          ? user.appearance_bg_image_transparency
          : 50,
      );
      setError('');
    }
  }, [open, user]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleRemoveImage = useCallback(() => {
    setPendingFile(null);
    setPreviewUrl('');
    setImageTransparency(50);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const handleReset = useCallback(() => {
    setFontColor('');
    setBgColor('');
    handleRemoveImage();
  }, [handleRemoveImage]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      try {
        await authService.getCsrfToken();
      } catch {
        /* best-effort */
      }

      await authService.updatePreferences({
        appearance_font_color: fontColor,
        appearance_bg_color: bgColor,
        appearance_bg_image_transparency: imageTransparency,
      });

      if (pendingFile) {
        await authService.uploadBackgroundImage(pendingFile);
      } else if (!previewUrl && user?.appearance_bg_image) {
        await authService.deleteBackgroundImage();
      }

      await refreshUser();
      setSnackOpen(true);
      onClose();
    } catch (err) {
      console.error('[Appearance] Save failed', err);
      if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
        const d = err.response.data as Record<string, unknown>;
        const img = d.image;
        if (img != null) {
          setError(Array.isArray(img) ? img.map(String).join(' ') : String(img));
        } else {
          setError(t('common.error'));
        }
      } else {
        setError(t('common.error'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              maxHeight: { xs: '92dvh', sm: 'min(90vh, 640px)' },
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
      >
        <DialogTitle>{t('appearance.title')}</DialogTitle>
        <DialogContent
          dividers
          sx={{
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
            pb: 2,
          }}
        >
          <Stack spacing={3} sx={{ pt: 0.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('appearance.font_color')}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <input
                  type="color"
                  value={fontColor || '#000000'}
                  onChange={(e) => setFontColor(e.target.value)}
                  style={{ width: 48, height: 36, border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {fontColor || '—'}
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('appearance.bg_color')}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <input
                  type="color"
                  value={bgColor || '#ffffff'}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: 48, height: 36, border: 'none', cursor: 'pointer', background: 'transparent' }}
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {bgColor || '—'}
                </Typography>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('appearance.bg_image')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {t('appearance.max_size')}
              </Typography>

              {hasImagePreview && (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 180,
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                    bgcolor: previewBackdrop,
                  }}
                >
                  <Box
                    component="img"
                    src={previewUrl}
                    alt=""
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: previewImageOpacity,
                    }}
                  />
                </Box>
              )}

              {hasImagePreview && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('appearance.image_transparency')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {t('appearance.transparency_hint')}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 0.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ flex: '0 0 3.5rem', lineHeight: 1.2 }}
                    >
                      {t('appearance.opaque')}
                    </Typography>
                    <Slider
                      size="small"
                      value={imageTransparency}
                      onChange={(_, v) => setImageTransparency(v as number)}
                      min={0}
                      max={100}
                      step={1}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${v}%`}
                      sx={{ flex: '1 1 auto', minWidth: 0 }}
                      aria-label={t('appearance.image_transparency')}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ flex: '0 0 3.5rem', lineHeight: 1.2, textAlign: 'right' }}
                    >
                      {t('appearance.fully_transparent')}
                    </Typography>
                  </Stack>
                </Box>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  onClick={() => fileRef.current?.click()}
                >
                  {t('appearance.upload')}
                </Button>
                {previewUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveImage}
                  >
                    {t('appearance.remove_image')}
                  </Button>
                )}
              </Stack>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handleFileChange}
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0, justifyContent: 'space-between' }}>
          <Button startIcon={<ResetIcon />} onClick={handleReset} color="inherit">
            {t('appearance.reset')}
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
            >
              {t('appearance.save')}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message={t('appearance.saved')}
      />
    </>
  );
}
