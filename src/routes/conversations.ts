// import { Router } from 'express';
// import { conditionalGet } from '../middleware/etag';
// import { authenticate } from '../middleware/authenticate';
// import { listConversations } from '../controllers/conversation.controller';
// import { chatLimiter } from '../middleware/rateLimiter';

// const router = Router();

// router.use(authenticate);


// router.get('/conversations', conditionalGet(), listConversations);
// router.post('/:id/messages',
//   chatLimiter,              // Chat-specific limit
//   requirePermission('conversations:create'),
//   validate(sendMessageSchema),
//   sendMessage
// );
