import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import api from '../services/api';
import { stickerTemplatesService, type StickerTemplate } from '../services/stickerTemplates';

export default function QRGenerate() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<StickerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [numPages, setNumPages] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stickerTemplatesService.list();
      setTemplates(res.data.results);
      const defaultTmpl = res.data.results.find((t) => t.is_default);
      if (defaultTmpl) setSelectedTemplateId(defaultTmpl.id);
    } catch (err) {
      console.error('[QRGenerate] Failed to load templates', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const selectedTemplate = templates.find((tpl) => tpl.id === selectedTemplateId);

  const handleGenerate = async () => {
    if (!selectedTemplateId) return;
    setGenerating(true);
    setSuccess(false);
    setError('');
    try {
      const res = await api.post(
        '/qr/generate/',
        { template_id: selectedTemplateId, num_pages: numPages },
        { responseType: 'blob' },
      );
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-stickers-${numPages}p.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (err) {
      console.error('[QRGenerate] Generation failed', err);
      setError(t('common.error'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        {t('qr.title')}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{t('qr.download_ready')}</Alert>}

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }} elevation={2}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
          {loading ? (
            <Skeleton variant="rounded" height={56} />
          ) : (
            <TextField
              label={t('qr.select_template')}
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(Number(e.target.value))}
              select
              fullWidth
            >
              {templates.map((tmpl) => (
                <MenuItem key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} ({tmpl.rows}×{tmpl.columns})
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            label={t('qr.num_pages')}
            type="number"
            value={numPages}
            onChange={(e) => setNumPages(Math.max(1, Math.min(50, Number(e.target.value))))}
            inputProps={{ min: 1, max: 50 }}
            fullWidth
          />

          <Button
            variant="contained"
            size="large"
            startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
            onClick={handleGenerate}
            disabled={generating || !selectedTemplateId}
          >
            {generating ? t('qr.generating') : t('qr.generate')}
          </Button>
        </Box>
      </Paper>

      {/* Layout preview */}
      {selectedTemplate && (
        <Paper sx={{ p: 3, borderRadius: 2 }} elevation={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {t('qr.preview')}
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 500,
              aspectRatio: '210 / 297',
              border: '2px solid',
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <svg
              viewBox="0 0 210 297"
              width="100%"
              height="100%"
              xmlns="http://www.w3.org/2000/svg"
            >
              {Array.from({ length: selectedTemplate.rows }).flatMap((_, row) =>
                Array.from({ length: selectedTemplate.columns }).map((_, col) => {
                  const x =
                    selectedTemplate.left_margin_mm +
                    selectedTemplate.offset_x_mm +
                    col * selectedTemplate.h_pitch_mm;
                  const y =
                    selectedTemplate.top_margin_mm +
                    selectedTemplate.offset_y_mm +
                    row * selectedTemplate.v_pitch_mm;
                  return (
                    <rect
                      key={`${row}-${col}`}
                      x={x}
                      y={y}
                      width={selectedTemplate.label_width_mm}
                      height={selectedTemplate.label_height_mm}
                      rx={0.5}
                      fill="none"
                      stroke="#1976d2"
                      strokeWidth={0.3}
                    />
                  );
                }),
              )}
            </svg>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {selectedTemplate.rows} × {selectedTemplate.columns} ={' '}
            {selectedTemplate.rows * selectedTemplate.columns} {t('qr.labels_per_page', 'labels per page')}
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
