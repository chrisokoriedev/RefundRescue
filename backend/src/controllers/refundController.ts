import { Request, Response } from 'express';
import { evaluateRefundRequest } from '../services/refundService.js';
import { STORE_POLICIES } from '../services/policyEngine.js';

export async function evaluateRefund(req: Request, res: Response) {
  try {
    const { customerId, orderId, message, requestedAmount } = req.body;

    if (!customerId || !orderId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customerId, orderId, and message are required.'
      });
    }

    const result = await evaluateRefundRequest({
      customerId,
      orderId,
      message,
      requestedAmount: requestedAmount ? Number(requestedAmount) : undefined
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(error.message?.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message || 'Internal server error during refund evaluation'
    });
  }
}

export function getPolicies(req: Request, res: Response) {
  return res.json({
    success: true,
    count: STORE_POLICIES.length,
    data: STORE_POLICIES
  });
}
