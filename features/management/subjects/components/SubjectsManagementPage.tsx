'use client';

import React, { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  FileText,
  Layers,
  GraduationCap,
  ExternalLink,
  BookMarked,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsNavTabs } from '@/features/management/settings/components/SettingsNavTabs';
import { Subject, CurriculumTopic } from '@/types/subjects';
import {
  subjectSchema,
  SubjectInput,
  curriculumTopicSchema,
  CurriculumTopicInput,
} from '../schemas/subject.schema';
import {
  saveSubjectAction,
  deleteSubjectAction,
  saveCurriculumTopicAction,
  deleteCurriculumTopicAction,
} from '../actions/subject.actions';

interface SubjectsManagementPageProps {
  initialSubjects: Subject[];
  initialTopics: CurriculumTopic[];
}

const GRADE_OPTIONS = [
  'PAUD / KB',
  'TK A',
  'TK B',
  '1 SD',
  '2 SD',
  '3 SD',
  '4 SD',
  '5 SD',
  '6 SD',
  '7 SMP',
  '8 SMP',
  '9 SMP',
  '10 SMA',
  '11 SMA',
  '12 SMA',
  'Umum',
];

export default function SubjectsManagementPage({
  initialSubjects = [],
  initialTopics = [],
}: SubjectsManagementPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'subjects' | 'topics'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [topics, setTopics] = useState<CurriculumTopic[]>(initialTopics);

  // Filter state for Subjects tab
  const [subjectSearch, setSubjectSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  // Filter state for Topics tab
  const [topicSearch, setTopicSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');

  // Modals state for Subject
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  // Modals state for Topic
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CurriculumTopic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<CurriculumTopic | null>(null);

  // -------------------------------------------------------------
  // FORM: Subject
  // -------------------------------------------------------------
  const {
    register: registerSubject,
    handleSubmit: handleSubmitSubject,
    setValue: setSubjectValue,
    reset: resetSubjectForm,
    formState: { isSubmitting: isSubmittingSubject, errors: subjectErrors },
  } = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      code: '',
      name: '',
      level: 'SD',
      description: '',
      status: 'active',
    },
  });

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    resetSubjectForm({
      code: '',
      name: '',
      level: 'SD',
      description: '',
      status: 'active',
    });
    setIsSubjectDialogOpen(true);
  };

  const handleOpenEditSubject = (item: Subject) => {
    setEditingSubject(item);
    resetSubjectForm({
      id: item.id,
      code: item.code,
      name: item.name,
      level: item.level,
      description: item.description || '',
      status: item.status,
    });
    setIsSubjectDialogOpen(true);
  };

  const onSubmitSubject = async (data: SubjectInput) => {
    const res = await saveSubjectAction(data);
    if (res.success) {
      toast.success(res.message);
      setIsSubjectDialogOpen(false);
      if (editingSubject) {
        setSubjects((prev) =>
          prev.map((s) => (s.id === editingSubject.id ? { ...s, ...data } : s))
        );
      } else if (res.data) {
        setSubjects((prev) => [...prev, res.data as Subject]);
      }
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    const res = await deleteSubjectAction(deletingSubject.id);
    if (res.success) {
      toast.success(res.message);
      setSubjects((prev) => prev.filter((s) => s.id !== deletingSubject.id));
      setDeletingSubject(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  };

  // -------------------------------------------------------------
  // FORM: Curriculum Topic
  // -------------------------------------------------------------
  const {
    register: registerTopic,
    handleSubmit: handleSubmitTopic,
    setValue: setTopicValue,
    watch: watchTopic,
    reset: resetTopicForm,
    formState: { isSubmitting: isSubmittingTopic, errors: topicErrors },
  } = useForm<CurriculumTopicInput>({
    resolver: zodResolver(curriculumTopicSchema),
    defaultValues: {
      subject_id: '',
      grade: '4 SD',
      chapter_number: 1,
      title: '',
      description: '',
      worksheet_name: '',
      worksheet_url: '',
    },
  });

  const handleOpenAddTopic = (defaultSubjectId?: string) => {
    setEditingTopic(null);
    const subId =
      defaultSubjectId ||
      (selectedSubjectFilter !== 'all' ? selectedSubjectFilter : subjects[0]?.id || '');
    const gradeVal = selectedGradeFilter !== 'all' ? selectedGradeFilter : '4 SD';

    // Calculate next chapter number
    const existingChapters = topics
      .filter((t) => t.subject_id === subId && t.grade === gradeVal)
      .map((t) => t.chapter_number);
    const nextChapter = existingChapters.length > 0 ? Math.max(...existingChapters) + 1 : 1;

    resetTopicForm({
      subject_id: subId,
      grade: gradeVal,
      chapter_number: nextChapter,
      title: '',
      description: '',
      worksheet_name: '',
      worksheet_url: '',
    });
    setIsTopicDialogOpen(true);
  };

  const handleOpenEditTopic = (item: CurriculumTopic) => {
    setEditingTopic(item);
    resetTopicForm({
      id: item.id,
      subject_id: item.subject_id,
      grade: item.grade,
      chapter_number: item.chapter_number,
      title: item.title,
      description: item.description || '',
      worksheet_name: item.worksheet_name || '',
      worksheet_url: item.worksheet_url || '',
    });
    setIsTopicDialogOpen(true);
  };

  const onSubmitTopic = async (data: CurriculumTopicInput) => {
    const res = await saveCurriculumTopicAction(data);
    if (res.success) {
      toast.success(res.message);
      setIsTopicDialogOpen(false);
      const subjectName = subjects.find((s) => s.id === data.subject_id)?.name || '';

      if (editingTopic) {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === editingTopic.id
              ? { ...t, ...data, subject_name: subjectName }
              : t
          )
        );
      } else if (res.data) {
        setTopics((prev) => [...prev, { ...(res.data as CurriculumTopic), subject_name: subjectName }]);
      }
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  };

  const handleDeleteTopic = async () => {
    if (!deletingTopic) return;
    const res = await deleteCurriculumTopicAction(deletingTopic.id);
    if (res.success) {
      toast.success(res.message);
      setTopics((prev) => prev.filter((t) => t.id !== deletingTopic.id));
      setDeletingTopic(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(res.message);
    }
  };

  // Navigasi cepat dari Subject Card ke Tab Topics
  const handleQuickViewTopics = (subjectId: string) => {
    setSelectedSubjectFilter(subjectId);
    setActiveTab('topics');
  };

  // -------------------------------------------------------------
  // Filtered lists
  // -------------------------------------------------------------
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(subjectSearch.toLowerCase());
      const matchLevel = levelFilter === 'all' || s.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [subjects, subjectSearch, levelFilter]);

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(topicSearch.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(topicSearch.toLowerCase()));
      const matchSubject =
        selectedSubjectFilter === 'all' || t.subject_id === selectedSubjectFilter;
      const matchGrade = selectedGradeFilter === 'all' || t.grade === selectedGradeFilter;
      return matchSearch && matchSubject && matchGrade;
    });
  }, [topics, topicSearch, selectedSubjectFilter, selectedGradeFilter]);

  return (
    <div className="space-y-6">
      {/* 1. NAVIGASI PENGATURAN & BREADCRUMB */}
      <SettingsNavTabs />

      {/* 2. HEADER HALAMAN */}
      <PageHeader
        title="Mata Pelajaran & Kurikulum Materi"
        description="Kelola master mata pelajaran dan silabus bab materi pembelajaran untuk penugasan jadwal dan worksheet murid."
      >
        <Button
          onClick={() => (activeTab === 'subjects' ? handleOpenAddSubject() : handleOpenAddTopic())}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'subjects' ? 'Tambah Mata Pelajaran' : 'Tambah Bab Materi'}
        </Button>
      </PageHeader>

      {/* 3. TABS: MATA PELAJARAN VS SILABUS MATERI */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'subjects' | 'topics')}
        className="space-y-6"
      >
        <TabsList className="grid w-full sm:w-[420px] grid-cols-2 p-1 bg-muted/60">
          <TabsTrigger value="subjects" className="gap-2 text-xs sm:text-sm font-semibold">
            <BookOpen className="w-4 h-4" />
            Mata Pelajaran ({subjects.length})
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-2 text-xs sm:text-sm font-semibold">
            <Layers className="w-4 h-4" />
            Silabus Bab Materi ({topics.length})
          </TabsTrigger>
        </TabsList>

        {/* ==============================================================
            TAB 1: MASTER MATA PELAJARAN
            ============================================================== */}
        <TabsContent value="subjects" className="space-y-4">
          {/* Toolbar Pencarian & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari mapel atau kode..."
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Jenjang:
              </span>
              <Select value={levelFilter} onValueChange={(val) => setLevelFilter(val || 'all')}>
                <SelectTrigger className="h-9 text-xs w-36 bg-background">
                  <SelectValue placeholder="Semua Jenjang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Semua Jenjang
                  </SelectItem>
                  <SelectItem value="SD" className="text-xs">
                    SD
                  </SelectItem>
                  <SelectItem value="SMP" className="text-xs">
                    SMP
                  </SelectItem>
                  <SelectItem value="SMA" className="text-xs">
                    SMA
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid Daftar Mata Pelajaran */}
          {filteredSubjects.length === 0 ? (
            <Card className="border border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground space-y-2">
                <BookOpen className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold">Tidak ada mata pelajaran ditemukan.</p>
                <p className="text-xs">Klik tombol "Tambah Mata Pelajaran" di atas untuk menambah baru.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjects.map((sub) => {
                const topicCount = topics.filter((t) => t.subject_id === sub.id).length;

                return (
                  <Card
                    key={sub.id}
                    className="border shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
                  >
                    <CardHeader className="pb-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="outline" className="font-mono text-[10px] tracking-wider">
                          {sub.code}
                        </Badge>
                        <Badge
                          className={
                            sub.level === 'SD'
                              ? 'bg-amber-500/10 text-amber-700 border-amber-300'
                              : sub.level === 'SMP'
                              ? 'bg-blue-500/10 text-blue-700 border-blue-300'
                              : 'bg-purple-500/10 text-purple-700 border-purple-300'
                          }
                        >
                          {sub.level}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold text-foreground mt-2">
                        {sub.name}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
                        {sub.description || 'Tidak ada keterangan tambahan.'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2 border-t space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          Silabus: <strong>{topicCount} Bab Materi</strong>
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleQuickViewTopics(sub.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 px-2 h-7"
                        >
                          <span>Lihat Bab</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditSubject(sub)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit Mata Pelajaran"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingSubject(sub)}
                            className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title="Hapus Mata Pelajaran"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==============================================================
            TAB 2: SILABUS BAB MATERI PEMBELAJARAN
            ============================================================== */}
        <TabsContent value="topics" className="space-y-4">
          {/* Filter Bar Bab Materi */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari judul bab atau topik..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Mapel:
                </span>
                <Select
                  value={selectedSubjectFilter}
                  onValueChange={(val) => setSelectedSubjectFilter(val || 'all')}
                >
                  <SelectTrigger className="h-9 text-xs w-44 bg-background">
                    <SelectValue placeholder="Semua Mapel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Semua Mapel
                    </SelectItem>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Kelas:
                </span>
                <Select
                  value={selectedGradeFilter}
                  onValueChange={(val) => setSelectedGradeFilter(val || 'all')}
                >
                  <SelectTrigger className="h-9 text-xs w-32 bg-background">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      Semua Kelas
                    </SelectItem>
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                size="sm"
                onClick={() => handleOpenAddTopic()}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 ml-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Bab
              </Button>
            </div>
          </div>

          {/* List Tabel Bab Materi */}
          {filteredTopics.length === 0 ? (
            <Card className="border border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground space-y-2">
                <Layers className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold">Belum ada bab materi kurikulum.</p>
                <p className="text-xs">
                  Pilih mata pelajaran & jenjang kelas, lalu klik "+ Tambah Bab" untuk menyusun materi ajar.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">Bab</th>
                      <th className="px-4 py-3 w-44">Mata Pelajaran</th>
                      <th className="px-3 py-3 w-28 text-center">Jenjang / Kelas</th>
                      <th className="px-4 py-3">Judul Materi & Silabus</th>
                      <th className="px-4 py-3 w-56">Lembar Kerja (Worksheet)</th>
                      <th className="px-3 py-3 w-20 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredTopics.map((topic) => {
                      const subjectObj = subjects.find((s) => s.id === topic.subject_id);

                      return (
                        <tr key={topic.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-center font-bold text-foreground">
                            <span className="inline-block w-7 h-7 leading-7 rounded-full bg-primary/10 text-primary font-mono text-xs">
                              {topic.chapter_number}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">
                            {subjectObj?.name || topic.subject_name || '-'}
                            <span className="block font-mono text-[10px] text-muted-foreground">
                              {subjectObj?.code}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Badge variant="outline" className="font-semibold text-xs">
                              {topic.grade}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground text-sm">
                              {topic.title}
                            </p>
                            {topic.description && (
                              <p className="text-muted-foreground text-xs line-clamp-1 mt-0.5">
                                {topic.description}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {topic.worksheet_name ? (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 w-fit">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[170px]" title={topic.worksheet_name}>
                                  {topic.worksheet_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground/60 italic text-[11px]">
                                Belum dilampirkan
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditTopic(topic)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Edit Bab Materi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingTopic(topic)}
                                className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                title="Hapus Bab Materi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==============================================================
          MODAL: TAMBAH / EDIT MATA PELAJARAN
          ============================================================== */}
      <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmitSubject(onSubmitSubject)}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                {editingSubject ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mata pelajaran akan menjadi acuan penyusunan kurikulum materi dan jadwal belajar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sub-code" className="text-xs font-semibold">
                    Kode Mapel
                  </Label>
                  <Input
                    id="sub-code"
                    placeholder="Contoh: MTK-SD"
                    {...registerSubject('code')}
                    className="h-8 text-xs font-mono uppercase"
                  />
                  {subjectErrors.code && (
                    <p className="text-rose-500 text-[10px]">{subjectErrors.code.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sub-level" className="text-xs font-semibold">
                    Jenjang Pendidikan
                  </Label>
                  <Select
                    defaultValue={editingSubject?.level || 'SD'}
                    onValueChange={(v) => v && setSubjectValue('level', v as any)}
                  >
                    <SelectTrigger id="sub-level" className="h-8 text-xs">
                      <SelectValue placeholder="Pilih jenjang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TK/PAUD" className="text-xs">
                        TK / PAUD
                      </SelectItem>
                      <SelectItem value="SD" className="text-xs">
                        SD
                      </SelectItem>
                      <SelectItem value="SMP" className="text-xs">
                        SMP
                      </SelectItem>
                      <SelectItem value="SMA" className="text-xs">
                        SMA
                      </SelectItem>
                      <SelectItem value="Umum" className="text-xs">
                        Umum
                      </SelectItem>
                      <SelectItem value="Semua Jenjang" className="text-xs">
                        Semua Jenjang
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="sub-name" className="text-xs font-semibold">
                  Nama Mata Pelajaran
                </Label>
                <Input
                  id="sub-name"
                  placeholder="Contoh: Matematika"
                  {...registerSubject('name')}
                  className="h-8 text-xs"
                />
                {subjectErrors.name && (
                  <p className="text-rose-500 text-[10px]">{subjectErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="sub-desc" className="text-xs font-semibold">
                  Deskripsi & Ruang Lingkup
                </Label>
                <Textarea
                  id="sub-desc"
                  rows={2}
                  placeholder="Keterangan cakupan materi belajar..."
                  {...registerSubject('description')}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sub-status" className="text-xs font-semibold">
                  Status Keaktifan
                </Label>
                <Select
                  defaultValue={editingSubject?.status || 'active'}
                  onValueChange={(v) => v && setSubjectValue('status', v as any)}
                >
                  <SelectTrigger id="sub-status" className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-xs">
                      Aktif
                    </SelectItem>
                    <SelectItem value="inactive" className="text-xs">
                      Nonaktif
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSubjectDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingSubject}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingSubject ? 'Menyimpan...' : 'Simpan Mapel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          MODAL: TAMBAH / EDIT BAB MATERI KURIKULUM
          ============================================================== */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmitTopic(onSubmitTopic)}>
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                {editingTopic ? 'Edit Bab Materi Kurikulum' : 'Tambah Bab Materi Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Materi ini akan otomatis muncul pada form presensi tutor dan siap diunduh worksheet-nya.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="topic-sub" className="text-xs font-semibold">
                  Pilih Mata Pelajaran
                </Label>
                <Select
                  defaultValue={editingTopic?.subject_id || watchTopic('subject_id') || subjects[0]?.id}
                  onValueChange={(v) => v && setTopicValue('subject_id', v)}
                >
                  <SelectTrigger id="topic-sub" className="h-8 text-xs">
                    <SelectValue placeholder="Pilih mapel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name} ({s.code}) - {s.level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {topicErrors.subject_id && (
                  <p className="text-rose-500 text-[10px]">{topicErrors.subject_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="topic-grade" className="text-xs font-semibold">
                    Jenjang Kelas
                  </Label>
                  <Select
                    defaultValue={editingTopic?.grade || watchTopic('grade') || '4 SD'}
                    onValueChange={(v) => v && setTopicValue('grade', v)}
                  >
                    <SelectTrigger id="topic-grade" className="h-8 text-xs">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g} className="text-xs">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {topicErrors.grade && (
                    <p className="text-rose-500 text-[10px]">{topicErrors.grade.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="topic-chap" className="text-xs font-semibold">
                    Bab ke-
                  </Label>
                  <Input
                    id="topic-chap"
                    type="number"
                    {...registerTopic('chapter_number', { valueAsNumber: true })}
                    className="h-8 text-xs text-center font-bold"
                  />
                  {topicErrors.chapter_number && (
                    <p className="text-rose-500 text-[10px]">{topicErrors.chapter_number.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="topic-title" className="text-xs font-semibold">
                  Judul Materi / Bab
                </Label>
                <Input
                  id="topic-title"
                  placeholder="Contoh: Operasi Pecahan Senilai & Campuran"
                  {...registerTopic('title')}
                  className="h-8 text-xs"
                />
                {topicErrors.title && (
                  <p className="text-rose-500 text-[10px]">{topicErrors.title.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="topic-desc" className="text-xs font-semibold">
                  Rincian Sub-Materi & Silabus (Opsional)
                </Label>
                <Textarea
                  id="topic-desc"
                  rows={2}
                  placeholder="Penjelasan ringkas kompetensi dasar yang dipelajari..."
                  {...registerTopic('description')}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1 border-t pt-2">
                <Label htmlFor="topic-ws" className="text-xs font-semibold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <FileText className="w-3.5 h-3.5" />
                  Nama File Worksheet / Lembar Kerja (Opsional)
                </Label>
                <Input
                  id="topic-ws"
                  placeholder="Contoh: Worksheet Latihan Pecahan Campuran.pdf"
                  {...registerTopic('worksheet_name')}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="topic-url" className="text-xs font-medium text-muted-foreground">
                  URL Tautan Worksheet (Opsional)
                </Label>
                <Input
                  id="topic-url"
                  placeholder="Contoh: /samples/worksheets/mtk4_bab3.pdf"
                  {...registerTopic('worksheet_url')}
                  className="h-8 text-xs font-mono text-muted-foreground"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTopicDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingTopic}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmittingTopic ? 'Menyimpan...' : 'Simpan Bab Materi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==============================================================
          ALERT DIALOG: HAPUS SUBJECT
          ============================================================== */}
      <AlertDialog open={!!deletingSubject} onOpenChange={() => setDeletingSubject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Pelajaran?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus mata pelajaran{' '}
              <strong>{deletingSubject?.name}</strong>? Seluruh bab materi kurikulum yang terkait
              akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubject}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Ya, Hapus Mapel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==============================================================
          ALERT DIALOG: HAPUS TOPIC
          ============================================================== */}
      <AlertDialog open={!!deletingTopic} onOpenChange={() => setDeletingTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Bab Materi?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus{' '}
              <strong>
                Bab {deletingTopic?.chapter_number}: {deletingTopic?.title}
              </strong>{' '}
              dari kurikulum?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTopic}
              className="text-xs bg-rose-600 hover:bg-rose-700 text-white"
            >
              Ya, Hapus Bab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
