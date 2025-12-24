import { ICursorResponse, IPaginationResponse } from '@/core/interfaces/paginating-interfaces';
import { PaginationSchemaResponse, CursorSchemaResponse } from '../schemas/pagination-schema';

export class PaginationPresenter {
	static paginationModeToHTTP(pagination: IPaginationResponse): PaginationSchemaResponse {
		return {
			page: pagination.page,
			per_page: pagination.perPage,
			total_occurrences: pagination.totalOccurrences,
			total_pages: pagination.totalPages,
		};
	}

	static cursorModeToHTTP(cursor: ICursorResponse): CursorSchemaResponse {
		return {
			has_more: cursor.hasMore,
			next_cursor: cursor.nextCursor,
			previous_cursor: cursor.previousCursor,
		};
	}
}
