import express from 'express';
import { generateToken } from '../middleware/auth.js';
import { validateBody } from '../validators/middleware.js';
import { z } from 'zod';

const router = express.Router();

// ── Schemas ──
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

// ── POST /auth/login ──
router.post('/login', validateBody(loginSchema), (req, res) => {
  const { email, password } = req.body;

  // TODO: Replace with real user database lookup
  // For MVP, accept any valid email/password combination
  // In production, verify against hashed password in DB

  const token = generateToken({
    userId: 'user_' + Date.now(),
    email,
    role: 'admin',
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: '24h',
      user: {
        email,
        role: 'admin',
      },
    },
  });
});

// ── POST /auth/register ──
router.post('/register', validateBody(registerSchema), (req, res) => {
  const { email, password, name } = req.body;

  // TODO: Replace with real user database insertion
  // For MVP, accept any registration
  const token = generateToken({
    userId: 'user_' + Date.now(),
    email,
    role: 'admin',
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: '24h',
      user: {
        email,
        name,
        role: 'admin',
      },
    },
  });
});

// ── POST /auth/refresh ──
router.post('/refresh', (req, res) => {
  // TODO: Implement refresh token logic
  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: {
      accessToken: generateToken({ userId: 'user_' + Date.now(), email: 'user@example.com' }),
      tokenType: 'Bearer',
      expiresIn: '24h',
    },
  });
});

export default router;
