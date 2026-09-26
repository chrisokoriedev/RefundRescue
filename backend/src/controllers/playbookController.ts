import { Request, Response } from 'express';
import { playbookService } from '../services/playbookService.js';
import { asyncErrorWrapper, AppError } from '../middleware/errorHandler.js';
import { paginate } from '../utils/pagination.js';

export const getPlaybooks = asyncErrorWrapper(async (req: Request, res: Response) => {
  const playbooks = await playbookService.getAllPlaybooks();
  
  // Support pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  
  const result = paginate(playbooks, page, limit);
  
  res.status(200).json({
    success: true,
    message: 'Playbooks retrieved successfully',
    ...result,
  });
});

export const getPlaybook = asyncErrorWrapper(async (req: Request, res: Response) => {
  const playbook = await playbookService.getPlaybook(req.params.id as string);
  if (!playbook) throw new AppError('Playbook not found', 404);
  res.status(200).json({ success: true, message: 'Playbook retrieved successfully', data: playbook });
});

export const createPlaybook = asyncErrorWrapper(async (req: Request, res: Response) => {
  const newPlaybook = await playbookService.createPlaybook(req.body);
  res.status(201).json({ success: true, message: 'Playbook created successfully', data: newPlaybook });
});

export const updatePlaybook = asyncErrorWrapper(async (req: Request, res: Response) => {
  const updatedPlaybook = await playbookService.updatePlaybook(req.params.id as string, req.body);
  res.status(200).json({ success: true, message: 'Playbook updated successfully', data: updatedPlaybook });
});

export const deletePlaybook = asyncErrorWrapper(async (req: Request, res: Response) => {
  await playbookService.deletePlaybook(req.params.id as string);
  res.status(204).send();
});
