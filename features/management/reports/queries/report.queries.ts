import { ReportService } from "../services/report.service";

export async function getAttendanceReportData() {
  return ReportService.getAttendanceSummary();
}

export async function getStudentReportData() {
  return ReportService.getStudentEnrollmentSummary();
}

export async function getPayrollReportData() {
  return ReportService.getPayrollSummary();
}
