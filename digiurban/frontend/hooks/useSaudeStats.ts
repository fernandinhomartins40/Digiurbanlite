'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface SaudeStats {
  department: {
    id: string;
    name: string;
    code: string;
  };
  modules: {
    healthAttendances: number;
    healthAppointments: number;
    medicationDispenses: number;
    healthCampaigns: number;
    healthPrograms: number;
    healthTransports: number;
    healthExams: number;
    healthTransportRequests: number;
    vaccinations: number;
    patients: number;
    communityHealthAgents: number;
  };
  protocolsByModule: Record<string, Record<string, number>>;
  totals: {
    totalProtocols: number;
    totalModuleRecords: number;
  };
}

interface DashboardStats {
  appointmentsThisMonth: number;
  activeEmergencies: number;
  lowStockMedications: number;
  activeCampaigns: number;
  topSpecialities: Array<{
    speciality: string;
    _count: { id: number };
  }>;
}

interface HealthUnitsStats {
  totalUnits: number;
  activeUnits: number;
  totalCapacity: number;
  typeStats: Array<{
    type: string;
    _count: { _all: number };
    _sum: { capacity: number | null };
  }>;
}

export function useSaudeStats() {
  const [stats, setStats] = useState<SaudeStats | null>(null);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [healthUnitsStats, setHealthUnitsStats] = useState<HealthUnitsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const token = localStorage.getItem('adminToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Buscar todas as estatísticas em paralelo
        const [statsResponse, dashboardResponse, healthUnitsResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/saude/stats`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/saude/dashboard`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/secretarias/saude/health-units/stats`, { headers })
        ]);

        if (statsResponse.data.success) {
          setStats(statsResponse.data.data);
        }

        if (dashboardResponse.data.success) {
          setDashboard(dashboardResponse.data.data);
        }

        if (healthUnitsResponse.data.success) {
          setHealthUnitsStats(healthUnitsResponse.data.data);
        }

        setError(null);
      } catch (err: any) {
        console.error('Error fetching saude stats:', err);
        setError(err.response?.data?.message || 'Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, dashboard, healthUnitsStats, loading, error };
}
