import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowDownward,
  ArrowUpward,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  customFieldsService,
  type CustomFieldDefinition,
  type CustomFieldFormData,
} from '../../services/customFields';

const ENTITY_TYPES = ['ASSET', 'CUSTOMER'] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const FIELD_TYPES: CustomFieldDefinition['field_type'][] = [
  'DATE', 'STRING', 'NUMBER', 'DECIMAL', 'SINGLE_SELECT', 'MULTI_SELECT',
];

const EMPTY_FORM: CustomFieldFormData = {
  entity_type: 'ASSET',
  name: '',
  field_type: 'STRING',
  is_mandatory: false,
  options: {},
  validation_rules: {},
  display_order: 0,
};

export default function CustomFields() {
  const { t } = useTranslation();
  const [entityTab, setEntityTab] = useState(0);
  const [fields, setFields] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomFieldFormData>(EMPTY_FORM);
  const [optionInput, setOptionInput] = useState('');
  const [ruleKey, setRuleKey] = useState('');
  const [ruleValue, setRuleValue] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingField, setDeletingField] = useState<CustomFieldDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentEntityType: EntityType = ENTITY_TYPES[entityTab];

  const fetchFields = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await customFieldsService.listDefinitions(currentEntityType);
      const sorted = [...res.data.results].sort((a, b) => a.display_order - b.display_order);
      setFields(sorted);
    } catch (err) {
      console.error('[CustomFields] Failed to load', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [currentEntityType, t]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, entity_type: currentEntityType });
    setOptionInput('');
    setRuleKey('');
    setRuleValue('');
    setDialogOpen(true);
  };

  const openEdit = (field: CustomFieldDefinition) => {
    setEditingId(field.id);
    setForm({
      entity_type: field.entity_type,
      name: field.name,
      field_type: field.field_type,
      is_mandatory: field.is_mandatory,
      options: { ...field.options },
      validation_rules: { ...field.validation_rules },
      display_order: field.display_order,
    });
    setOptionInput('');
    setRuleKey('');
    setRuleValue('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await customFieldsService.updateDefinition(editingId, form);
      } else {
        await customFieldsService.createDefinition(form);
      }
      setDialogOpen(false);
      await fetchFields();
    } catch (err) {
      console.error('[CustomFields] Save failed', err);
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (field: CustomFieldDefinition) => {
    setDeletingField(field);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingField) return;
    setDeleting(true);
    try {
      await customFieldsService.deleteDefinition(deletingField.id);
      setDeleteDialogOpen(false);
      setDeletingField(null);
      await fetchFields();
    } catch (err) {
      console.error('[CustomFields] Delete failed', err);
      setError(t('common.error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleReorder = async (field: CustomFieldDefinition, direction: 'up' | 'down') => {
    const idx = fields.findIndex((f) => f.id === field.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= fields.length) return;

    const swapField = fields[swapIdx];
    try {
      await Promise.all([
        customFieldsService.updateDefinition(field.id, { display_order: swapField.display_order }),
        customFieldsService.updateDefinition(swapField.id, { display_order: field.display_order }),
      ]);
      await fetchFields();
    } catch (err) {
      console.error('[CustomFields] Reorder failed', err);
    }
  };

  const addOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    const choices = form.options.choices ?? [];
    if (!choices.includes(trimmed)) {
      setForm({ ...form, options: { ...form.options, choices: [...choices, trimmed] } });
    }
    setOptionInput('');
  };

  const removeOption = (opt: string) => {
    const choices = (form.options.choices ?? []).filter((c) => c !== opt);
    setForm({ ...form, options: { ...form.options, choices } });
  };

  const addRule = () => {
    if (!ruleKey.trim()) return;
    setForm({
      ...form,
      validation_rules: { ...form.validation_rules, [ruleKey.trim()]: ruleValue.trim() },
    });
    setRuleKey('');
    setRuleValue('');
  };

  const removeRule = (key: string) => {
    const { [key]: _, ...rest } = form.validation_rules;
    void _;
    setForm({ ...form, validation_rules: rest });
  };

  const isSelectType = form.field_type === 'SINGLE_SELECT' || form.field_type === 'MULTI_SELECT';

  return (
    <Box>
      <Tabs
        value={entityTab}
        onChange={(_, v) => setEntityTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label={t('nav.assets')} />
        <Tab label={t('admin.customer_fields', 'Customer Fields')} />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('admin.field_name')}</TableCell>
              <TableCell>{t('admin.field_type')}</TableCell>
              <TableCell>{t('admin.mandatory')}</TableCell>
              <TableCell>{t('admin.display_order')}</TableCell>
              <TableCell align="right">{t('admin.reorder', 'Reorder')}</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t('admin.no_fields', 'No fields defined yet')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              fields.map((field, idx) => (
                <TableRow key={field.id}>
                  <TableCell>{field.name}</TableCell>
                  <TableCell>
                    <Chip label={field.field_type} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {field.is_mandatory && (
                      <Chip label={t('admin.mandatory')} color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{field.display_order}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      disabled={idx === 0}
                      onClick={() => handleReorder(field, 'up')}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={idx === fields.length - 1}
                      onClick={() => handleReorder(field, 'down')}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small" onClick={() => openEdit(field)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton size="small" color="error" onClick={() => confirmDelete(field)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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
          {editingId ? t('admin.edit_field') : t('admin.add_field')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label={t('admin.field_name')}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label={t('admin.field_type')}
            value={form.field_type}
            onChange={(e) =>
              setForm({ ...form, field_type: e.target.value as CustomFieldDefinition['field_type'] })
            }
            select
            fullWidth
          >
            {FIELD_TYPES.map((ft) => (
              <MenuItem key={ft} value={ft}>{ft}</MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={form.is_mandatory}
                onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
              />
            }
            label={t('admin.mandatory')}
          />
          <TextField
            label={t('admin.display_order')}
            type="number"
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
            fullWidth
          />

          {isSelectType && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('admin.options')}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {(form.options.choices ?? []).map((opt) => (
                  <Chip key={opt} label={opt} onDelete={() => removeOption(opt)} />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder={t('admin.add_option')}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  sx={{ flex: 1 }}
                />
                <Button variant="outlined" size="small" onClick={addOption}>
                  {t('admin.add_option')}
                </Button>
              </Box>
            </Box>
          )}

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('admin.validation_rules')}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {Object.entries(form.validation_rules).map(([k, v]) => (
                <Chip
                  key={k}
                  label={`${k}: ${String(v)}`}
                  onDelete={() => removeRule(k)}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                value={ruleKey}
                onChange={(e) => setRuleKey(e.target.value)}
                placeholder="key"
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                placeholder="value"
                sx={{ flex: 1 }}
              />
              <Button variant="outlined" size="small" onClick={addRule}>
                +
              </Button>
            </Box>
          </Box>
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
        <DialogTitle>{t('admin.delete_field')}</DialogTitle>
        <DialogContent>
          <Typography>{t('admin.delete_field_warning')}</Typography>
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
