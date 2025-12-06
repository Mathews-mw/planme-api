export interface IPaginationParams {
	page: number;
	perPage: 'all' | number;
}

export interface IPaginationResponse {
	page: number;
	perPage: number;
	totalPages: number;
	totalOccurrences: number;
}

export interface ICursorParams {
	cursor?: string;
	limit: number;
	skip?: number;
}

export interface ICursorResponse {
	nextCursor?: string;
	previousCursor?: string;
	hasMore: boolean;
}
