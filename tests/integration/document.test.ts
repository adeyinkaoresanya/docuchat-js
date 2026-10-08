import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/rbac.service', () => ({
  getUserPermissions: vi.fn(
    async () => new Set(['documents:create', 'documents:read', 'documents:delete'])
  ),
}));

vi.mock('../../src/queues/document.worker', () => ({}));
vi.mock('../../src/services/document.service', () => ({
  createDocument: vi.fn(),
  getDocumentForUser: vi.fn(),
  listDocuments: vi.fn(),
  deleteDocument: vi.fn(),
  getDocumentProcessingStatus: vi.fn(),
}));

import { app } from '../../src/app';
import * as documentService from '../../src/services/document.service';
import { NotFoundError } from '../../src/lib/errors';
import { createTestUser, resetDatabase } from '../helpers/setup';

describe('Document endpoints', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    await resetDatabase();

    const user = await createTestUser({ email: 'docs@example.com' });
    userId = user.id;

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'docs@example.com', password: 'TestPassword1!' });

    accessToken = login.body.accessToken;

    vi.mocked(documentService.createDocument).mockResolvedValue({
      document: {
        id: 'doc_123',
        userId,
        title: 'My first doc',
        filename: 'my-first-doc',
        status: 'pending',
      },
      jobId: 'job-test-1',
    } as any);

    vi.mocked(documentService.listDocuments).mockResolvedValue({
      data: [
        {
          id: 'doc_123',
          title: 'Owner doc',
          filename: 'owner-doc',
          status: 'ready',
          chunkCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: { page: 1, limit: 10, total: 1 },
    } as any);

    vi.mocked(documentService.deleteDocument).mockResolvedValue({
      id: 'doc_123',
      deletedBy: userId,
      deletedAt: new Date().toISOString(),
    } as any);

    vi.mocked(documentService.getDocumentProcessingStatus).mockResolvedValue({
      status: 'processing',
      error: null,
      progress: 67,
    } as any);
  });

  describe('POST /api/v1/documents', () => {
    it('creates a document and returns 202', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'My first doc',
          content: 'hello world',
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('jobId', 'job-test-1');
      expect(res.body.data.document).toHaveProperty('id');
      expect(res.body.data.document.title).toBe('My first doc');
      expect(res.body.data.document.status).toBe('pending');
      expect(documentService.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My first doc',
          content: 'hello world',
          userId,
        })
      );
    });
  });

  describe('GET /api/v1/documents', () => {
    it('returns paginated documents for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/documents?page=1&limit=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Owner doc');
      expect(res.body.meta).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: 1,
        })
      );
      expect(documentService.listDocuments).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ page: 1, limit: 10 })
      );
    });

    it('returns 400 for invalid query params', async () => {
      const res = await request(app)
        .get('/api/v1/documents?page=0&limit=999')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(documentService.listDocuments).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/v1/documents/:id', () => {
    it('soft-deletes a document owned by the user', async () => {
      const res = await request(app)
        .delete('/api/v1/documents/cm4xk2f0000012n7x8u9a1b2c')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('doc_123');
      expect(res.body.data.deletedAt).toBeTruthy();
      expect(res.body.data.deletedBy).toBe(userId);
    });
  });

  describe('GET /api/v1/documents/:id/processing-status', () => {
    it('returns document processing status and queue progress', async () => {
      const res = await request(app)
        .get('/api/v1/documents/cm4xk2f0000012n7x8u9a1b2c/processing-status')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(
        expect.objectContaining({
          status: 'processing',
          error: null,
          progress: 67,
        })
      );
    });

    it('returns 404 when requesting another user\'s document status', async () => {
      vi.mocked(documentService.getDocumentProcessingStatus)
        .mockRejectedValueOnce(new NotFoundError('Document not found'));

      const res = await request(app)
        .get('/api/v1/documents/cm4xk2f0000012n7x8u9a1b2c/processing-status')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
