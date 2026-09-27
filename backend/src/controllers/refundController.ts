import { Request, Response } from 'express';
import { evaluateRefundRequest } from '../services/refundService.js';
import { maybeAskClarification } from '../services/clarificationService.js';
import { STORE_POLICIES } from '../services/policyEngine.js';
import { NotFoundError } from '../middleware/errorHandler.js';

/**
 * Multi-turn stage: decide whether the claim needs ONE follow-up question
 * before running the (more expensive) full evaluation pipeline.
 */
export async function clarifyRefund(req: Request, res: Response) {
  const { message, clarificationCount } = req.body; // validated by Zod middleware

  const result = await maybeAskClarification(message, clarificationCount ?? 0);

  return res.status(200).json({
    success: true,
    data: result
  });
}

export async function evaluateRefund(req: Request, res: Response) {
  const { customerId, orderId, message, requestedAmount } = req.body; // validated by Zod middleware

  try {
    const result = await evaluateRefundRequest({
      customerId,
      orderId,
      message,
      requestedAmount
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    // Map known domain errors to proper status codes
    if (/Customer not found|Order not found/i.test(error?.message || '')) {
      throw new NotFoundError('Resource', error.message);
    }
    throw error;
  }
}

export function getPolicies(req: Request, res: Response) {
  return res.json({
    success: true,
    count: STORE_POLICIES.length,
    data: STORE_POLICIES
  });
}
