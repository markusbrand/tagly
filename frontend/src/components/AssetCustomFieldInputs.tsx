import {
  Box,
  Checkbox,
  FormControl,
  FormHelperText,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import type { CustomFieldDefinition } from '../services/customFields';

export interface AssetCustomFieldInputsProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export function AssetCustomFieldInputs({
  definitions,
  values,
  onChange,
  errors,
  disabled = false,
}: AssetCustomFieldInputsProps) {
  if (definitions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {definitions.map((d) => {
        const fid = String(d.id);
        const err = errors[fid];
        const label = d.name + (d.is_mandatory ? ' *' : '');

        if (d.field_type === 'STRING' || d.field_type === 'DATE') {
          return (
            <TextField
              key={d.id}
              label={d.name}
              required={d.is_mandatory}
              value={(values[fid] as string) ?? ''}
              onChange={(e) => onChange(fid, e.target.value)}
              type={d.field_type === 'DATE' ? 'date' : 'text'}
              fullWidth
              disabled={disabled}
              error={Boolean(err)}
              helperText={err}
              slotProps={
                d.field_type === 'DATE'
                  ? { inputLabel: { shrink: true } }
                  : undefined
              }
            />
          );
        }

        if (d.field_type === 'NUMBER' || d.field_type === 'DECIMAL') {
          return (
            <TextField
              key={d.id}
              label={d.name}
              required={d.is_mandatory}
              value={(values[fid] as string | number) ?? ''}
              onChange={(e) => onChange(fid, e.target.value)}
              type="number"
              fullWidth
              disabled={disabled}
              error={Boolean(err)}
              helperText={err}
              slotProps={{
                htmlInput: {
                  step: d.field_type === 'DECIMAL' ? 'any' : 1,
                },
              }}
            />
          );
        }

        if (d.field_type === 'SINGLE_SELECT') {
          const choices = d.options?.choices ?? [];
          return (
            <TextField
              key={d.id}
              label={d.name}
              required={d.is_mandatory}
              value={(values[fid] as string) ?? ''}
              onChange={(e) => onChange(fid, e.target.value)}
              select
              fullWidth
              disabled={disabled}
              error={Boolean(err)}
              helperText={err}
            >
              <MenuItem value="">
                <em>—</em>
              </MenuItem>
              {choices.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          );
        }

        if (d.field_type === 'MULTI_SELECT') {
          const choices = d.options?.choices ?? [];
          const selected = (values[fid] as string[]) ?? [];

          const handleMulti = (e: SelectChangeEvent<string[]>) => {
            const v = e.target.value;
            onChange(fid, typeof v === 'string' ? v.split(',') : v);
          };

          return (
            <FormControl key={d.id} fullWidth error={Boolean(err)} disabled={disabled} required={d.is_mandatory}>
              <InputLabel id={`${fid}-label`}>{label}</InputLabel>
              <Select
                labelId={`${fid}-label`}
                multiple
                value={selected}
                onChange={handleMulti}
                input={<OutlinedInput label={label} />}
                renderValue={(sel) => (sel as string[]).join(', ')}
              >
                {choices.map((c) => (
                  <MenuItem key={c} value={c}>
                    <Checkbox checked={selected.includes(c)} />
                    <ListItemText primary={c} />
                  </MenuItem>
                ))}
              </Select>
              {err && <FormHelperText>{err}</FormHelperText>}
            </FormControl>
          );
        }

        return null;
      })}
    </Box>
  );
}
