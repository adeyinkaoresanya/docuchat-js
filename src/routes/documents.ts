// import { Router } from 'express';
// import { authenticate } from '../middleware/auth';
// import { validate } from '../middleware/validate';
// import { documentParamsSchema } from '../validators/document.validator';
// import { getDocument } from '../controllers/document.controller';
// import {documentQueue} from '../queues/document.queue';

// const router = Router();

// router.use(authenticate);

// router.get('/:id', validate(documentParamsSchema), getDocument);

// export default router;

// router.get('/:id/processing-status',
//   authenticate,
//   requirePermission('documents:read'),
//   async (req, res) => {
//     const doc = await prisma.document.findUnique({
//       where: { id: req.params.id },
//       select: { id: true, status: true, error: true, userId: true },
//     });

//     if (!doc || doc.userId !== req.user!.id) {
//       return res.status(404).json({
//         success: false,
//         error: { code: 'NOT_FOUND', message: 'Document not found' },
//       });
//     }

//     // Try to find the active job for this document
//     const jobs = await documentQueue.getJobs(['active', 'waiting']);
//     const activeJob = jobs.find(
//       j => j.data.documentId === req.params.id
//     );

//     res.json({
//       success: true,
//       data: {
//         status: doc.status,
//         error: doc.error,
//         progress: activeJob ? await activeJob.progress : null,
//       },
        // });
        // }
        // );


// router.get('/documents/:id', conditionalGet(), getDocument);