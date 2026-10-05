import { Router } from 'express';
import { conditionalGet } from '../middleware/etag';
import { authenticate } from '../middleware/authenticate';
import { listConversations } from '../controllers/conversation.controller';

const router = Router();

router.use(authenticate);


router.get('/conversations', conditionalGet(), listConversations);