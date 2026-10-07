import { appEvents } from '../lib/events';
import { logger } from '../lib/logger';
import { documentsProcessed } from '../lib/metrics';
import { usageLogRepository } from '../repositories/usageLog.repository';

appEvents.on('doc:processed', async (data) => {
  try {
    await usageLogRepository.create({
      userId: data.userId,
      action: 'document_ingested',
      tokens: 0,
      costUsd: 0,
      metadata: JSON.stringify({
        documentId: data.documentId,
        chunkCount: data.chunkCount,
        durationMs: data.durationMs,
        format: data.format,
        pageCount: data.pageCount,
      }),
    });

    // Update Prometheus metric
    documentsProcessed.inc({ status: 'success' });

    logger.info(
      {
        documentId: data.documentId,
        chunkCount: data.chunkCount,
        correlationId: data.correlationId,
      },
      'Ingestion logged'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to log ingestion');
  }
});
