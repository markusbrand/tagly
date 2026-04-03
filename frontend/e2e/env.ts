/** Must match `backend/users/management/commands/ensure_e2e_user.py` defaults. */
export const e2eCredentials = {
  username: process.env.E2E_USERNAME ?? 'e2e_user',
  password: process.env.E2E_PASSWORD ?? 'TaglyE2E_Local_Only_1',
} as const;
