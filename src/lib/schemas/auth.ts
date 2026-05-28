import { z } from 'zod'

// Common weak passwords (truncated list — production would use a longer one)
const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234',
  'qwerty', 'qwerty123', 'qwertyuiop', '12345678', '123456789', '1234567890',
  'letmein', 'letmein123', 'welcome', 'welcome1', 'welcome123',
  'admin', 'admin123', 'administrator', 'root', 'toor',
  'iloveyou', 'monkey', 'dragon', 'sunshine', 'princess',
  'travelplan', 'travelplan123', 'travel123',
])

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .refine(
    pw => /[A-Za-z]/.test(pw) && /\d/.test(pw),
    'Password must contain letters and numbers'
  )
  .refine(pw => !COMMON_PASSWORDS.has(pw.toLowerCase()), 'Password is too common')

export const emailSchema = z.string().email().max(254).toLowerCase().trim()

export const registerSchema = z.object({
  name: z.string().trim().max(100).optional().nullable(),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
