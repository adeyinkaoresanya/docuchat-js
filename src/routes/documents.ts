import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createDocumentSchema,
  listDocumentsSchema,
  documentParamsSchema,
} from '../validators/document.validator';


const router = Router();
router.use(authenticate); // Apply authentication middleware to all routes in this router

router.get('/', (req, res) => {
  res.status(200).json({ success: true, data: [] });
});

// // Public route - no auth needed
// router.get('/health', (req, res) => res.json({ status: 'ok' }));

// // Protected route - requires valid access token
// router.get('/documents', authenticate, async (req, res) => {
//   // Document model is introduced in a later step of the project.
//   res.status(501).json({
//     error: 'Documents endpoint not implemented yet',
//     userId: req.user!.id,
//   });
// });




// router.get('/',
//   validate(listDocumentsSchema),
//   listDocuments
// );

// router.post('/',
//   validate(createDocumentSchema),
//   createDocument
// );

// router.get('/:id',
//   validate(documentParamsSchema),
//   getDocument
// );

// router.delete('/:id',
//   validate(documentParamsSchema),
//   deleteDocument
// );


export default router;
