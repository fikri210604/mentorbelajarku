import AttendanceWindowSettingsPage from "@/features/management/settings/components/AttendanceWindowSettingsPage";
import { getAttendanceWindowSetting } from "@/features/management/settings/actions/settings.actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Batas Waktu Absensi | Bimbel Belajarku",
  description: "Master batas waktu dan toleransi keterlambatan pengunggahan presensi tutor.",
};

export default async function Page() {
  const result = await getAttendanceWindowSetting();

  return <AttendanceWindowSettingsPage initialSetting={result?.data} />;
}
