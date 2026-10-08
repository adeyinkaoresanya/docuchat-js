import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface ListDocumentsOptions {
	page: number;
	limit: number;
	status?: string;
	search?: string;
	sortBy?: 'createdAt' | 'title' | 'chunkCount';
	sortOrder?: 'asc' | 'desc';
}

export const documentRepository = {
	async create(data: {
		userId: string;
		title: string;
		filename: string;
		filepath: string;
		mimeType: string;
		fileSize: number;
		status: string;
	}) {
		return prisma.document.create({
			data: {
				userId: data.userId,
				title: data.title,
				filename: data.filename,
				filepath: data.filepath,
				mimeType: data.mimeType,
				fileSizeBytes: data.fileSize,
				status: data.status,
			},
		});
	},

	async findById(id: string) {
		return prisma.document.findUnique({
			where: { id },
		});
	},

	async findStatusById(id: string) {
		return prisma.document.findUnique({
			where: { id },
			select: {
				id: true,
				status: true,
				error: true,
				userId: true,
				deletedAt: true,
			},
		});
	},

	async listForUser(userId: string, options: ListDocumentsOptions) {
		const {
			page,
			limit,
			status,
			search,
			sortBy = 'createdAt',
			sortOrder = 'desc',
		} = options;

		const where: Prisma.DocumentWhereInput = {
			userId,
			deletedAt: null,
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
	},

	async softDelete(id: string, deletedBy: string) {
		return prisma.document.update({
			where: { id },
			data: {
				deletedAt: new Date(),
				deletedBy,
			},
		});
	},
};
