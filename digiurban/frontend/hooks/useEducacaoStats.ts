'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface EducacaoStats {
  schools: number;
  students: {
    total: number;
    enrolled: number;
  };
  teachers: {
    total: number;
    active: number;
  };
  protocols: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  modules: {
    educationAttendances: number;
    students: number;
    schoolTransports: number;
    disciplinaryRecords: number;
    schoolDocuments: number;
    studentTransfers: number;
    attendanceRecords: number;
    gradeRecords: number;
    schoolManagements: number;
    schoolMeals: number;
  };
  moduleStats: Record<string, {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  }>;
}

export function useEducacaoStats() {
  const [stats, setStats] = useState<EducacaoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar estatísticas do backend
        const statsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/secretarias/educacao/stats`,
          { headers }
        );

        const data = statsResponse.data.data;

        // Processar dados com fallbacks
        setStats({
          schools: data.schools || 0,
          students: {
            total: data.modules?.students || 0,
            enrolled: data.modules?.students || 0
          },
          teachers: {
            total: 0, // TODO: adicionar quando houver tabela de professores
            active: 0
          },
          protocols: data.protocols || { total: 0, pending: 0, inProgress: 0, completed: 0 },
          modules: data.modules || {
            educationAttendances: 0,
            students: 0,
            schoolTransports: 0,
            disciplinaryRecords: 0,
            schoolDocuments: 0,
            studentTransfers: 0,
            attendanceRecords: 0,
            gradeRecords: 0,
            schoolManagements: 0,
            schoolMeals: 0
          },
          moduleStats: data.moduleStats || {}
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching educacao stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');

        // Fallback para dados vazios em caso de erro
        setStats({
          schools: 0,
          students: { total: 0, enrolled: 0 },
          teachers: { total: 0, active: 0 },
          protocols: { total: 0, pending: 0, inProgress: 0, completed: 0 },
          modules: {
            educationAttendances: 0,
            students: 0,
            schoolTransports: 0,
            disciplinaryRecords: 0,
            schoolDocuments: 0,
            studentTransfers: 0,
            attendanceRecords: 0,
            gradeRecords: 0,
            schoolManagements: 0,
            schoolMeals: 0
          },
          moduleStats: {}
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, loading, error };
}
