import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import {
  documentParamsSchema,
  createDocumentSchema,
  listDocumentsSchema,
} from '../validators/document.validator';
import { requirePermission } from '../middleware';
import { uploadFile} from '../middleware/uploadFile';
//import { uploadLimiter } from '../middleware/rateLimiter';
import * as documentController from '../controllers/document.controller';

const router = Router();

router.use(authenticate);

//IMPLEMENT UPLOAD LIMITER!!!

router.post('/',
  // uploadLimiter,            // Upload-specific limit
  requirePermission('documents:create'),
  uploadFile.single("file"),
  //validate(createDocumentSchema),
  documentController.createDocument
);

router.get('/:id', validate(documentParamsSchema), documentController.getDocument);

router.get(
  '/',
  requirePermission('documents:read'),
  validate(listDocumentsSchema),
  documentController.listDocuments
);


router.delete('/:id', validate(documentParamsSchema), requirePermission('documents:delete'), documentController.deleteDocument);


router.get('/:id/processing-status',
  validate(documentParamsSchema),
  requirePermission('documents:read'),
  documentController.getDocumentProcessingStatus
);


        
export default router;

