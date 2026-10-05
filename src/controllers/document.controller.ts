// import type { Request, Response } from 'express';
// import { getDocumentForUser } from '../services/document.service';

// export async function getDocument(req: Request, res: Response) {
//   const documentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

//   if (!documentId) {
//     throw new Error('Document ID is required');
//   }

//   const document = await getDocumentForUser(documentId, req.user!.id);

//   res.json({
//     success: true,
//     data: document,
//   });
// }
