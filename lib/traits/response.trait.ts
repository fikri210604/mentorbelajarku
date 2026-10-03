import { NextResponse } from "next/server";

/**
 * Metadata informasi paginasi standar
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Kontrak output data paginasi sukses (Server Actions, Services, Internal Functions)
 */
export interface PaginatedResult<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
  message?: string;
}

/**
 * Kontrak output data sukses tunggal / list biasa
 */
export interface SuccessResult<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

/**
 * Kontrak output error terstandarisasi
 */
export interface ErrorDetail {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

export interface ErrorResult {
  success: false;
  error: ErrorDetail;
}

/**
 * Union types standar untuk kemudahan pengetikan di controller & actions
 */
export type Result<T> = SuccessResult<T> | ErrorResult;
export type PaginatedApiResult<T> = PaginatedResult<T> | ErrorResult;

/**
 * Parameter input query paginasi standar
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
}

// ==============================================================================
// FACTORY / HELPER FUNCTIONS UNTUK SERVER ACTIONS & SERVICES
// ==============================================================================

/**
 * Membuat object SuccessResult terstandarisasi
 */
export function createSuccessResult<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>
): SuccessResult<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
}

/**
 * Menghitung metadata paginasi dan membuat PaginatedResult terstandarisasi
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number = 1,
  pageSize: number = 20,
  message?: string
): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));

  return {
    success: true,
    data: items,
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    },
    ...(message ? { message } : {}),
  };
}

/**
 * Mendapatkan pesan error yang ramah pengguna dan aman dari kebocoran struktur teknis database.
 * Error teknis database (schema cache, relation, Postgres syntax, dsb.) dicatat ke log server
 * (bukan dilempar ke sistem/UI pengguna) dan digantikan dengan pesan operasional human-friendly.
 */
export function getSafeErrorMessage(
  err: unknown,
  fallbackMessage: string = "Terjadi kendala pada pemrosesan data. Silakan coba beberapa saat lagi."
): string {
  if (!err) return fallbackMessage;

  let rawMessage = "";
  if (typeof err === "string") {
    rawMessage = err;
  } else if (err instanceof Error) {
    rawMessage = err.message;
  } else if (typeof err === "object" && err !== null) {
    const record = err as Record<string, unknown>;
    if (typeof record.message === "string") {
      rawMessage = record.message;
    } else if (typeof record.error === "string") {
      rawMessage = record.error;
    } else {
      rawMessage = String(err);
    }
  }

  const lower = rawMessage.toLowerCase();

  // Pola deteksi error internal database, Supabase, Postgres, RPC, atau network infra
  const isTechnicalDbError =
    lower.includes("schema cache") ||
    lower.includes("could not find the table") ||
    lower.includes("relation") ||
    lower.includes("postgres") ||
    lower.includes("pgrst") ||
    lower.includes("syntax error") ||
    lower.includes("foreign key") ||
    lower.includes("violates") ||
    lower.includes("duplicate key") ||
    lower.includes("unique constraint") ||
    lower.includes("econnrefused") ||
    lower.includes("failed to fetch") ||
    lower.includes("fetch failed") ||
    lower.includes("jwt") ||
    lower.includes("permission denied") ||
    lower.includes("column") ||
    lower.includes("supabase") ||
    lower.includes("public.") ||
    lower.includes("database") ||
    lower.includes("pg_") ||
    lower.includes("invalid input syntax") ||
    lower.includes("null value in column") ||
    lower.includes("deadlock") ||
    lower.includes("table");

  if (isTechnicalDbError) {
    // Log server-side untuk kebutuhan diagnosa dan pengecekan developer (bukan ditampilkan di UI pengguna)
    console.warn("[SafeErrorTrait] Technical DB/System error logged to server:", rawMessage);

    // Memberikan pesan terarah jika duplicate key atau constraint umum
    if (lower.includes("duplicate key") || lower.includes("unique constraint")) {
      return "Data yang dimasukkan sudah terdaftar dalam sistem.";
    }
    if (lower.includes("foreign key") || lower.includes("violates")) {
      return "Terdapat data terkait yang tidak ditemukan atau tidak valid.";
    }

    return fallbackMessage;
  }

  return rawMessage || fallbackMessage;
}

/**
 * Membuat object ErrorResult terstandarisasi dengan sanitasi pesan error
 */
export function createErrorResult(
  errOrMessage: unknown,
  code: string = "INTERNAL_ERROR",
  details?: unknown
): ErrorResult {
  return {
    success: false,
    error: {
      code,
      message: getSafeErrorMessage(errOrMessage, "Terjadi kesalahan pada sistem."),
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
    },
  };
}

// ==============================================================================
// HTTP RESPONSE HELPERS UNTUK NEXT.JS ROUTE HANDLERS (NextResponse)
// ==============================================================================

export interface ApiResponseOptions {
  message?: string;
  status?: number;
  headers?: HeadersInit;
  meta?: Record<string, unknown>;
}

export interface ApiErrorOptions {
  status?: number;
  code?: string;
  details?: unknown;
  headers?: HeadersInit;
}

/**
 * Mengirim respon sukses JSON HTTP via NextResponse
 */
export function apiSuccess<T>(
  data: T,
  options: ApiResponseOptions = {}
): NextResponse<SuccessResult<T>> {
  const { message, status = 200, headers, meta } = options;
  const payload = createSuccessResult(data, message, meta);
  return NextResponse.json(payload, { status, headers });
}

/**
 * Mengirim respon paginasi JSON HTTP via NextResponse
 */
export function apiPaginated<T>(
  items: T[],
  total: number,
  page: number = 1,
  pageSize: number = 20,
  options: ApiResponseOptions = {}
): NextResponse<PaginatedResult<T>> {
  const { message, status = 200, headers } = options;
  const payload = createPaginatedResult(items, total, page, pageSize, message);
  return NextResponse.json(payload, { status, headers });
}

/**
 * Mengirim respon error JSON HTTP via NextResponse
 */
export function apiError(
  message: string,
  options: ApiErrorOptions = {}
): NextResponse<ErrorResult> {
  const { status = 400, code = "BAD_REQUEST", details, headers } = options;
  const payload = createErrorResult(message, code, details);
  return NextResponse.json(payload, { status, headers });
}

// ==============================================================================
// GLOBAL TRAIT OBJECT UNTUK PENGGUNAAN BERGAYA OBJECT/CLASS TRAIT
// ==============================================================================

export const ResponseTrait = {
  success: createSuccessResult,
  paginated: createPaginatedResult,
  error: createErrorResult,
  safeErrorMessage: getSafeErrorMessage,
  apiSuccess,
  apiPaginated,
  apiError,
};
