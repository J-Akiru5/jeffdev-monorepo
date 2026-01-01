'use server';

/**
 * Logout Action
 * --------------
 * Clears session cookie and signs out user.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  redirect('/admin/login');
}
