import 'server-only'
import { verify } from '@node-rs/argon2'

export function assertAdminEnv(): void {
  const missing: string[] = []
  if (!process.env.ADMIN_USERNAME) missing.push('ADMIN_USERNAME')
  if (!process.env.ADMIN_PASSWORD_HASH) missing.push('ADMIN_PASSWORD_HASH')
  if (!process.env.SESSION_SECRET) missing.push('SESSION_SECRET')
  if (missing.length > 0) {
    throw new Error(
      `Admin auth is not configured. Missing env vars: ${missing.join(', ')}`,
    )
  }
}

export async function verifyAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  assertAdminEnv()
  const expectedUsername = process.env.ADMIN_USERNAME!
  const hash = process.env.ADMIN_PASSWORD_HASH!
  if (username !== expectedUsername) return false
  try {
    return await verify(hash, password)
  } catch {
    return false
  }
}
