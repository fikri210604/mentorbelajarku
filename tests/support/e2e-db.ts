import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';

/** Parser .env minimal (tanpa dotenv) ala supabase/seed-auth.ts. */
function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const full = path.resolve(process.cwd(), file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, 'utf-8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

let pool: Pool | null = null;

export function getE2EPool(): Pool {
  loadEnv();
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url) throw new Error('DATABASE_URL tidak tersedia untuk cleanup E2E.');
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      ssl: /supabase|pooler/.test(url) ? { rejectUnauthorized: false } : undefined,
    });
  }
  return pool;
}

export interface E2ECleanupResult {
  payments: number;
  attendance: number;
  sessions: number;
  schedules: number;
  enrollments: number;
  students: number;
}

/**
 * Hapus SELURUH artefak flow-test berdasarkan prefix kode murid E2E.
 * Guard wajib: prefix harus diawali 'E2E-' agar tidak pernah menyentuh data riil.
 * Urutan menghormati FK RESTRICT: payment -> attendance -> session -> schedule -> enrollment -> student.
 */
export async function cleanupE2EFlow(prefix: string): Promise<E2ECleanupResult> {
  if (!prefix.startsWith('E2E-')) {
    throw new Error(`Guard: prefix cleanup harus diawali 'E2E-' (diterima: ${prefix}).`);
  }
  const db = getE2EPool();
  const like = `${prefix}%`;
  const out: E2ECleanupResult = {
    payments: 0,
    attendance: 0,
    sessions: 0,
    schedules: 0,
    enrollments: 0,
    students: 0,
  };

  const studentIds: string[] = (
    await db.query<{ id: string }>(`SELECT id FROM students WHERE student_code LIKE $1`, [like])
  ).rows.map((r) => r.id);
  if (studentIds.length === 0) return out;

  const sessionRows = (
    await db.query<{ id: string }>(
      `SELECT DISTINCT s.id FROM sessions s
       JOIN schedule_students ss ON ss.schedule_id = s.schedule_id
       WHERE ss.student_id = ANY($1)`,
      [studentIds]
    )
  ).rows.map((r) => r.id);

  // 1. Draft payroll yang merujuk sesi E2E (hapus payment -> cascade items).
  if (sessionRows.length > 0) {
    const payRows = (
      await db.query<{ id: string }>(
        `SELECT DISTINCT payment_id AS id FROM tutor_payment_items WHERE session_id = ANY($1)`,
        [sessionRows]
      )
    ).rows.map((r) => r.id);
    for (const pid of payRows) {
      const st = await db.query(`SELECT status FROM tutor_payments WHERE id = $1`, [pid]);
      if (st.rows[0]?.status !== 'draft') {
        throw new Error(`Guard: payment ${pid} berstatus ${st.rows[0]?.status}, bukan draft. Batalkan cleanup manual.`);
      }
      await db.query(`DELETE FROM tutor_payments WHERE id = $1`, [pid]);
      out.payments += 1;
    }
    // 2. Attendance sesi E2E.
    const att = await db.query(`DELETE FROM attendance WHERE session_id = ANY($1)`, [sessionRows]);
    out.attendance = att.rowCount ?? 0;
    // 3. Sesi E2E.
    const ses = await db.query(`DELETE FROM sessions WHERE id = ANY($1)`, [sessionRows]);
    out.sessions = ses.rowCount ?? 0;
  }

  // 4. Jadwal E2E (schedule_students ikut CASCADE) — hanya yang memuat murid E2E.
  const schedRows = (
    await db.query<{ schedule_id: string }>(
      `SELECT DISTINCT schedule_id FROM schedule_students WHERE student_id = ANY($1)`,
      [studentIds]
    )
  ).rows.map((r) => r.schedule_id);
  for (const sid of schedRows) {
    const other = await db.query(
      `SELECT COUNT(*)::int AS c FROM schedule_students WHERE schedule_id = $1 AND NOT (student_id = ANY($2))`,
      [sid, studentIds]
    );
    if ((other.rows[0]?.c ?? 0) > 0) {
      throw new Error(`Guard: jadwal ${sid} memuat murid non-E2E. Batalkan cleanup manual.`);
    }
    await db.query(`DELETE FROM schedules WHERE id = $1`, [sid]);
    out.schedules += 1;
  }

  // 5-6. Enrollment + student E2E.
  const enr = await db.query(`DELETE FROM enrollments WHERE student_id = ANY($1)`, [studentIds]);
  out.enrollments = enr.rowCount ?? 0;
  const stu = await db.query(`DELETE FROM students WHERE id = ANY($1)`, [studentIds]);
  out.students = stu.rowCount ?? 0;

  return out;
}

export async function closeE2EPool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
