import express from 'express';
import { 
  getPlaybooks, 
  getPlaybook, 
  createPlaybook, 
  updatePlaybook, 
  deletePlaybook 
} from '../controllers/playbookController.js';
import { validateBody, validateParams } from '../validators/middleware.js';
import { 
  createPlaybookSchema, 
  updatePlaybookSchema, 
  playbookIdParamSchema 
} from '../validators/playbook.schema.js';

const router = express.Router();

router.get('/', getPlaybooks);
router.get('/:id', validateParams(playbookIdParamSchema), getPlaybook);
router.post('/', validateBody(createPlaybookSchema), createPlaybook);
router.put('/:id', validateParams(playbookIdParamSchema), validateBody(updatePlaybookSchema), updatePlaybook);
router.delete('/:id', validateParams(playbookIdParamSchema), deletePlaybook);

export default router;
