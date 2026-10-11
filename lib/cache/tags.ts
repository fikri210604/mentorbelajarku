/**
 * Kumpulan cache tag terpusat.
 *
 * Dipakai oleh query (`unstable_cache`) dan mutation (`revalidateTag`) agar
 * invalidasi cache tidak tersebar sebagai string literal di banyak file.
 */
export const STUDENTS_CACHE_TAG = "students";
export const ATTENDANCE_WINDOW_CACHE_TAG = "attendance-window";
export const NOTIFICATION_SETTINGS_CACHE_TAG = "notification-settings";
