import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger';
import * as documentService from '../services/document.service';


export async function createDocument(req: Request, res: Response, next: NextFunction) {
    try {
    logger.info({
            correlationId: req.body.correlationId,
            userId: req.user!.id,
            title: req.body.title,
    }, 'Creating document');
        
        const result = await documentService.createDocument({
            file: req.file!,
            //...req.body,
            userId: req.user!.id,
            correlationId: (req as any).correlationId,
        });

        res.status(202).json({ success: true, data: result});
    } catch (error) {
       next(error)
    }
}


export async function getDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (res.locals.validatedParams ?? req.params) as { id: string };
    const document = await documentService.getDocumentForUser(params.id, req.user!.id);
    res.json({ success: true, data: document});
  } catch (error) {
    next(error);
  }
}

export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (res.locals.validatedQuery ?? req.query) as {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      sortBy?: 'createdAt' | 'title' | 'chunkCount';
      sortOrder?: 'asc' | 'desc';
    };

    const options: {
      page: number;
      limit: number;
      status?: string;
      search?: string;
      sortBy?: 'createdAt' | 'title' | 'chunkCount';
      sortOrder?: 'asc' | 'desc';
    } = {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    };

    if (query.status) options.status = query.status;
    if (query.search) options.search = query.search;
    if (query.sortBy) options.sortBy = query.sortBy;
    if (query.sortOrder) options.sortOrder = query.sortOrder;

    const result = await documentService.listDocuments(req.user!.id, options);

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (res.locals.validatedParams ?? req.params) as { id: string };
    const document = await documentService.deleteDocument(params.id, req.user!.id);
    res.json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentProcessingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const params = (res.locals.validatedParams ?? req.params) as { id: string };
    const status = await documentService.getDocumentProcessingStatus(params.id, req.user!.id);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
}
