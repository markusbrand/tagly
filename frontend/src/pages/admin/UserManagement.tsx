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
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  IconButton,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import type { User } from '../../services/auth';
import { usersService, type CreateUserData, type UpdateUserData } from '../../services/users';

const ROLES = ['USER', 'ADMIN'] as const;

const LANGUAGES: { value: 'en' | 'de'; labelKey: string }[] = [
  { value: 'en', labelKey: 'admin.lang_en' },
  { value: 'de', labelKey: 'admin.lang_de' },
];

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserData>({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    language: 'en',
  });
  const [creating, setCreating] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserData>({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersService.list();
      setUsers(res.data.results);
    } catch (err) {
      console.error('[UserManagement] Failed to load', err);
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await usersService.create(createForm);
      setCreateOpen(false);
      setCreateForm({ username: '', email: '', password: '', role: 'USER', language: 'en' });
      await fetchUsers();
    } catch (err) {
      console.error('[UserManagement] Create failed', err);
      setError(t('common.error'));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ role: user.role, language: user.language as CreateUserData['language'] });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      await usersService.update(editUser.id, editForm);
      setEditOpen(false);
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('[UserManagement] Update failed', err);
      setError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('auth.username')}</TableCell>
              <TableCell>{t('admin.email', 'Email')}</TableCell>
              <TableCell>{t('admin.role', 'Role')}</TableCell>
              <TableCell>{t('admin.language', 'Language')}</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t('admin.no_users', 'No users found')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isAdminRow = user.role === 'ADMIN' || user.is_superuser;
                return (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={isAdminRow ? 'ADMIN' : user.role}
                        color={isAdminRow ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.language}</TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('common.edit')}>
                        <IconButton size="small" onClick={() => openEdit(user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab
        color="primary"
        onClick={() => setCreateOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
      >
        <AddIcon />
      </Fab>

      {/* Create user dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.add_user')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label={t('auth.username')}
            value={createForm.username}
            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label={t('admin.email', 'Email')}
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label={t('auth.password')}
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            required
            fullWidth
          />
          <TextField
            label={t('admin.role', 'Role')}
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'USER' | 'ADMIN' })}
            select
            fullWidth
          >
            {ROLES.map((role) => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('admin.language', 'Language')}
            value={createForm.language}
            onChange={(e) =>
              setCreateForm({ ...createForm, language: e.target.value as CreateUserData['language'] })
            }
            select
            fullWidth
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {t(lang.labelKey)}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !createForm.username || !createForm.email || !createForm.password}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit user role dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('admin.edit_user')}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label={t('admin.role', 'Role')}
            value={editForm.role ?? ''}
            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'USER' | 'ADMIN' })}
            select
            fullWidth
          >
            {ROLES.map((role) => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </TextField>
          <TextField
            label={t('admin.language', 'Language')}
            value={editForm.language ?? 'en'}
            onChange={(e) =>
              setEditForm({ ...editForm, language: e.target.value as CreateUserData['language'] })
            }
            select
            fullWidth
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {t(lang.labelKey)}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleEdit} disabled={saving}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
