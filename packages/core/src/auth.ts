import { createClient } from '@supabase/supabase-js';
import { AppError } from './errors';

export interface AuthContext {
  userId: string;
  email?: string;
}

export async function authenticateBearerToken(params: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  bearerToken?: string;
}): Promise<AuthContext> {
  if (!params.bearerToken) {
    throw new AppError('Missing bearer token', 'AUTH_MISSING_TOKEN');
  }

  const supabase = createClient(params.supabaseUrl, params.supabaseServiceRoleKey);
  const { data, error } = await supabase.auth.getUser(params.bearerToken);

  if (error || !data.user) {
    throw new AppError('Invalid bearer token', 'AUTH_INVALID_TOKEN', error);
  }

  return {
    userId: data.user.id,
    ...(data.user.email ? { email: data.user.email } : {}),
  };
}
