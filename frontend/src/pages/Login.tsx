import { type FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';

export default function Login() {
  const { t } = useTranslation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ username, password });
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: unknown }>;
      const status = axiosErr.response?.status;
      const data = axiosErr.response?.data;
      const detailStr =
        typeof data?.detail === 'string'
          ? data.detail
          : Array.isArray(data?.detail)
            ? data.detail.map(String).join(' ')
            : null;
      if (status === 401) {
        setError(t('auth.login_error'));
      } else if (detailStr) {
        setError(detailStr.length > 300 ? `${detailStr.slice(0, 300)}…` : detailStr);
      } else if (status === 403) {
        setError(t('auth.login_error'));
      } else {
        setError(t('common.error'));
      }
      console.error('[Auth] Login failed', status, axiosErr.response?.data ?? axiosErr.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card elevation={4} sx={{ width: '100%', maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            sx={{ textAlign: 'center', mb: 1, fontWeight: 700 }}
          >
            {t('common.app_name')}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: 'center', mb: 4 }}
          >
            {t('auth.login_title')}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label={t('auth.username')}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              fullWidth
              autoFocus
              disabled={isSubmitting}
            />
            <TextField
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 1 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : t('auth.login_button')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
