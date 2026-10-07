import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { getUserPermissions } from './rbac.service';
import { appEvents } from '../lib/events';
import { DOC_EVENTS } from '../events/document.events';
import { queueDocumentForProcessing } from '../queues/document.queue';

export async function getDocumentForUser(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

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





interface ListDocumentsOptions {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: 'createdAt' | 'title' | 'chunkCount';
  sortOrder?: 'asc' | 'desc';
}

export async function listDocuments(
  userId: string,
  options: ListDocumentsOptions
) {
  const {
    page, limit,
    status, search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  // Build the where clause dynamically
  const where: any = {
    userId,
    deletedAt: null, // Soft delete filter (we'll add this today)
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
    where.description = { contains: search, mode: 'insensitive' };
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        filename: true,
        status: true,
        chunkCount: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  return {
    data: documents,
    meta: { page, limit, total },
  };
}



export async function deleteDocument(
  documentId: string,
  userId: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!doc || doc.deletedAt) {
    throw new NotFoundError('Document not found');
  }

  // Ownership check
  if (doc.userId !== userId) {
    throw new NotFoundError('Document not found');
  }

  return prisma.document.update({
    where: { id: documentId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId,
    },
  });
}



// appEvents.emit(DOC_EVENTS.CREATED, {
//   userId: user.id,
//   documentId: doc.id,
//   title: doc.title,
//   fileSizeBytes: doc.fileSizeBytes,
// });



// // In document.service.ts deleteDocument:
// appEvents.emit(DOC_EVENTS.DELETED, {
//   deletedBy: userId,
//   documentId: doc.id,
//   title: doc.title,
// });


export async function createDocument(data: {
  title: string;
  content: string;
  userId: string;
  correlationId?: string;
}) {
  // Create the document with pending status
  const doc = await prisma.document.create({
    data: {
      userId: data.userId,
      title: data.title,
      filename: data.title.toLowerCase().replace(/\s+/g, '-'),
      content: data.content,
      status: 'pending',
    },
  });

  // Queue for background processing
  const correlationId = data.correlationId ?? doc.id;
  const jobId = await queueDocumentForProcessing(doc.id, data.userId, correlationId);

  appEvents.emit('doc:created', {
    userId: data.userId,
    documentId: doc.id,
    title: doc.title,
  });

  // Return 202 Accepted (not 201 Created)
  // The document exists but isn't ready yet
  return { document: doc, jobId };
}

