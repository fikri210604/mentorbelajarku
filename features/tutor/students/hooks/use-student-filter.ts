"use client";

import { useState, useMemo } from "react";
import { StudentWithPrograms } from "../types";

export function useStudentFilter(students: StudentWithPrograms[]) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchSearch =
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.student_code.toLowerCase().includes(search.toLowerCase()) ||
        (student.school && student.school.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === "all" || student.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [students, search, statusFilter]);

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredStudents,
  };
}
