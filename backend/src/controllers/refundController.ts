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
  const { orderId, message, clarificationCount } = req.body; // validated by Zod middleware

  if (orderId) {
    const { getChatSession } = await import('../services/refundService.js');
    const session = getChatSession(orderId);
    if (session.takeoverActive) {
      return res.status(200).json({
        success: true,
        data: {
          needsClarification: false,
          humanTakeoverActive: true
        }
      });
    }
  }

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

export async function getChatMessages(req: Request, res: Response) {
  const orderId = req.query.orderId ? String(req.query.orderId) : '';
  const customerId = req.query.customerId ? String(req.query.customerId) : undefined;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required query parameter: orderId'
    });
  }

  const { getChatHistory, getChatSession } = await import('../services/refundService.js');
  const messages = getChatHistory(orderId, customerId);
  const session = getChatSession(orderId, customerId);

  return res.json({
    success: true,
    count: messages.length,
    takeoverActive: session.takeoverActive,
    takenOverBy: session.takenOverBy,
    data: messages
  });
}

export async function clearChatMessages(req: Request, res: Response) {
  const orderId = (req.query.orderId || req.body.orderId) ? String(req.query.orderId || req.body.orderId) : '';
  const customerId = (req.query.customerId || req.body.customerId) ? String(req.query.customerId || req.body.customerId) : undefined;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: orderId'
    });
  }

  const { clearChatHistory } = await import('../services/refundService.js');
  const result = clearChatHistory(orderId, customerId);
  return res.json({
    success: true,
    message: result.message
  });
}

export async function getRecentConversations(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const { getRecentChats } = await import('../services/refundService.js');
  const conversations = getRecentChats(limit);

  return res.json({
    success: true,
    count: conversations.length,
    data: conversations
  });
}

export async function sendAgentReply(req: Request, res: Response) {
  const { orderId, customerId, message, ticketId } = req.body;
  const { sendAdminChatMessage } = await import('../services/refundService.js');
  const result = sendAdminChatMessage(orderId, customerId, message, ticketId);

  return res.status(201).json({
    success: true,
    takeoverActive: true,
    data: result
  });
}

export async function handoverToAiHandler(req: Request, res: Response) {
  const { orderId, customerId, ticketId } = req.body;
  const { handoverToAi } = await import('../services/refundService.js');
  const result = await handoverToAi(orderId, customerId, ticketId);

  return res.status(200).json({
    success: true,
    message: 'Chat handed back to AI assistant successfully.',
    data: result
  });
}

export async function takeoverChatHandler(req: Request, res: Response) {
  const { orderId, customerId, ticketId } = req.body;
  const { setChatTakeover, sendAdminChatMessage } = await import('../services/refundService.js');
  const session = setChatTakeover(orderId, customerId, true, 'HUMAN_SPECIALIST', ticketId);
  const notice = sendAdminChatMessage(
    orderId,
    customerId,
    'A human support specialist has joined this chat session and taken over from AI.',
    ticketId
  );

  return res.status(200).json({
    success: true,
    message: 'Human takeover activated.',
    data: { session, notice }
  });
}

export async function sendCustomerMessageHandler(req: Request, res: Response) {
  const { orderId, customerId, message, ticketId } = req.body;
  const { sendCustomerChatMessage } = await import('../services/refundService.js');
  const result = sendCustomerChatMessage(orderId, customerId, message, ticketId);

  return res.status(201).json({
    success: true,
    data: result
  });
}
