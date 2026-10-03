import { Metadata } from 'next';
import SubjectsManagementPage from '@/features/management/subjects/components/SubjectsManagementPage';
import {
  getSubjects,
  getCurriculumTopics,
} from '@/features/management/subjects/queries/subject.queries';
import { requireAuthUser } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Master Mata Pelajaran & Kurikulum Materi | Bimbel Mentorbelajarku',
  description: 'Pengaturan master mata pelajaran dan silabus kurikulum materi pembelajaran bimbel.',
};

export default async function Page() {
  await requireAuthUser();

  const [subjects, topics] = await Promise.all([
    getSubjects(),
    getCurriculumTopics(),
  ]);

  return (
    <SubjectsManagementPage
      initialSubjects={subjects}
      initialTopics={topics}
    />
  );
}
