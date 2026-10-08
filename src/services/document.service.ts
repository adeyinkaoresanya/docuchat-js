import { NotFoundError } from '../lib/errors';
import { getUserPermissions } from './rbac.service';
import { appEvents } from '../lib/events';
import { DOC_EVENTS } from '../events/document.events';
import {
  documentQueue,
  queueDocumentForProcessing,
} from '../queues/document.queue';
import {
  documentRepository,
  type ListDocumentsOptions,
} from '../repositories/document.repository';



export async function createDocument(data: {
//   title: string;
//   content: string;
//   userId: string;
//   correlationId?: string;
// }) {

//   // Create the document in the database
//   const doc = await documentRepository.create({
//     userId: data.userId,
//     title: data.title,
//     filename: data.title.toLowerCase().replace(/\s+/g, '-'),
//     content: data.content,
//     status: 'pending',
//   });


 file: Express.Multer.File;
  userId: string;
  correlationId?: string;
}) {
  const { file, userId } = data;

  const doc = await documentRepository.create({
    userId,
    title: file.originalname,
    filename: file.filename,
    filepath: file.path,
    mimeType: file.mimetype,
    fileSize: file.size,
    status: 'pending',
  });

  // Queue for background processing
  const correlationId = data.correlationId ?? doc.id;
  const jobId = await queueDocumentForProcessing(doc.id, data.userId, correlationId);

  appEvents.emit(DOC_EVENTS.CREATED, {
    userId: data.userId,
    documentId: doc.id,
    title: doc.title,
  });

  // Return 202 Accepted (not 201 Created)
  // The document exists but isn't ready yet
  return { document: doc, jobId };
}

export async function getDocumentForUser(documentId: string, userId: string) {
  const document = await documentRepository.findById(documentId);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  if (document.userId !== userId) {
    const permissions = await getUserPermissions(userId);

    if (!permissions.has('users:manage')) {
      throw new NotFoundError('Document not found');
    }
  }

  return document;
}

export async function listDocuments(
  userId: string,
  options: ListDocumentsOptions
) {
  return documentRepository.listForUser(userId, options);
}



export async function deleteDocument(
  documentId: string,
  userId: string
) {
  const doc = await documentRepository.findById(documentId);

  if (!doc || doc.deletedAt) {
    throw new NotFoundError('Document not found');
  }

  // Ownership check
  if (doc.userId !== userId) {
    throw new NotFoundError('Document not found');
  }

  const deletedDoc = await documentRepository.softDelete(documentId, userId);
  appEvents.emit(DOC_EVENTS.DELETED, {
    deletedBy: userId,
    documentId: deletedDoc.id,
    title: deletedDoc.title,
  });

  return deletedDoc;
}

export async function getDocumentProcessingStatus(
  documentId: string,
  userId: string
) {
  const doc = await documentRepository.findStatusById(documentId);

  if (!doc || doc.deletedAt || doc.userId !== userId) {
    throw new NotFoundError('Document not found');
  }

  const jobs = await documentQueue.getJobs(['active', 'waiting']);
  const activeJob = jobs.find((job) => job.data.documentId === documentId);

  return {
    status: doc.status,
    error: doc.error,
    progress: activeJob ? await activeJob.progress : null,
  };
}
