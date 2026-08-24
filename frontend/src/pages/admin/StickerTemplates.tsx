import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControlLabel,
  Grid,
  Skeleton,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Star } from '@mui/icons-material';
import {
  stickerTemplatesService,
  type StickerTemplate,
  type StickerTemplateFormData,
} from '../../services/stickerTemplates';

const EMPTY_FORM: StickerTemplateFormData = {
  name: '',
  label_width_mm: 38.1,
  label_height_mm: 21.2,
  h_pitch_mm: 40.6,
  v_pitch_mm: 21.2,
  left_margin_mm: 4.8,
  top_margin_mm: 8.5,
  rows: 13,
  columns: 5,
  offset_x_mm: 0,
  offset_y_mm: 0,
  is_default: false,
};

export default function StickerTemplates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<StickerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StickerTemplateFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<StickerTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await stickerTemplatesService.list();
      setTemplates(res.data.results);
    } catch (err) {
      console.error('[StickerTemplates] Failed to load', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (tmpl: StickerTemplate) => {
    setEditingId(tmpl.id);
    setForm({
      name: tmpl.name,
      label_width_mm: tmpl.label_width_mm,
      label_height_mm: tmpl.label_height_mm,
      h_pitch_mm: tmpl.h_pitch_mm,
      v_pitch_mm: tmpl.v_pitch_mm,
      left_margin_mm: tmpl.left_margin_mm,
      top_margin_mm: tmpl.top_margin_mm,
      rows: tmpl.rows,
      columns: tmpl.columns,
      offset_x_mm: tmpl.offset_x_mm,
      offset_y_mm: tmpl.offset_y_mm,
      is_default: tmpl.is_default,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await stickerTemplatesService.update(editingId, form);
      } else {
        await stickerTemplatesService.create(form);
      }
      setDialogOpen(false);
      await fetchTemplates();
    } catch (err) {
      console.error('[StickerTemplates] Save failed', err);
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (tmpl: StickerTemplate) => {
    setDeletingTemplate(tmpl);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    setDeleting(true);
    try {
      await stickerTemplatesService.delete(deletingTemplate.id);
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
      await fetchTemplates();
    } catch (err) {
      console.error('[StickerTemplates] Delete failed', err);
      setError(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const updateNum = (key: keyof StickerTemplateFormData, value: string) => {
    setForm({ ...form, [key]: Number(value) });
  };

  const numField = (key: keyof StickerTemplateFormData, label: string) => (
    <TextField
      label={label}
      type="number"
      value={form[key]}
      onChange={(e) => updateNum(key, e.target.value)}
      size="small"
      fullWidth
      inputProps={{ step: key === 'rows' || key === 'columns' ? 1 : 0.1 }}
    />
  );

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      ) : templates.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {t('admin.no_templates', 'No templates defined yet')}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {templates.map((tmpl) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tmpl.id}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6">{tmpl.name}</Typography>
                    {tmpl.is_default && <Star color="warning" fontSize="small" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {tmpl.rows} × {tmpl.columns} &middot;{' '}
                    {tmpl.label_width_mm}×{tmpl.label_height_mm} mm
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(tmpl)}>
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => confirmDelete(tmpl)}
                  >
                    {t('common.delete')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Fab
        color="primary"
        onClick={openCreate}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <AddIcon />
      </Fab>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? t('admin.edit_template') : t('admin.add_template')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label={t('admin.template_name', 'Template Name')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>{numField('label_width_mm', t('admin.label_width'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('label_height_mm', t('admin.label_height'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('h_pitch_mm', t('admin.h_pitch'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('v_pitch_mm', t('admin.v_pitch'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('left_margin_mm', t('admin.left_margin'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('top_margin_mm', t('admin.top_margin'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('rows', t('admin.rows'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('columns', t('admin.columns'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('offset_x_mm', t('admin.offset_x'))}</Grid>
            <Grid size={{ xs: 6 }}>{numField('offset_y_mm', t('admin.offset_y'))}</Grid>
          </Grid>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_default}
                onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              />
            }
            label={t('admin.set_default')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('admin.delete_template')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('admin.delete_template_warning', 'Are you sure you want to delete this template?')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
