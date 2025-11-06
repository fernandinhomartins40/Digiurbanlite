/**
 * Prisma Include Templates - Templates padrão de includes para queries Prisma
 *
 * Este arquivo centraliza todos os includes mais comumente usados para cada entidade,
 * garantindo consistência e evitando erros de propriedades não carregadas.
 *
 * REGRA: Sempre use estes templates ao invés de definir includes inline
 */

// ============================================================================
// CORE ENTITIES INCLUDES
// ============================================================================

export const UserIncludes = {
  basic: {
    tenant: true,
    department: true
        },

  full: {
    tenant: {
      select: {
        id: true,
        name: true,
        status: true,
        plan: true
        }
      },
    department: {
      select: {
        id: true,
        name: true,
        code: true
        }
      },
    assignedProtocols: {
      select: {
        id: true,
        number: true,
        title: true,
        status: true
        }
      },
    createdProtocols: {
      select: {
        id: true,
        number: true,
        title: true,
        status: true
        }
      }
        },

  withCounts: {
    tenant: true,
    department: true,
    _count: {
      select: {
        assignedProtocolsSimplified: true,
        createdProtocolsSimplified: true
        }
      }
        }
} as const;

export const TenantIncludes = {
  basic: {
    users: {
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
        }
      },
    departments: {
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true
        }
      }
        },

  full: {
    users: true,
    departments: true,
    servicesSimplified: true,
    protocols: {
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true
        }
      },
        service: {
          select: {
            id: true,
            name: true,
            category: true
        }
      }
        }
    },
    citizens: true
        },

  withCounts: {
    _count: {
      select: {
        users: true,
        departments: true,
        servicesSimplified: true,
        protocolsSimplified: true,
        citizens: true
        }
      }
        }
} as const;

export const ProtocolIncludes = {
  basic: {
    citizen: {
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true
        }
      },
    service: {
      select: {
        id: true,
        name: true,
        category: true,
        estimatedDays: true
        }
      },
    department: {
      select: {
        id: true,
        name: true,
        code: true
        }
      }
        },

  full: {
    citizen: {
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        address: true
        }
      },
    service: {
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true
        }
      }
      }
    },
    department: true,
    tenant: {
      select: {
        id: true,
        name: true,
        status: true
        }
      },
    assignedUser: {
      select: {
        id: true,
        name: true,
        email: true
        }
      },
    createdBy: {
      select: {
        id: true,
        name: true,
        email: true
        }
      },
    history: {
      orderBy: {
        timestamp: 'desc' as const
      },
      take: 10
        },
    evaluations: true
        },

  withHistory: {
    citizen: {
      select: {
        id: true,
        name: true,
        cpf: true
        }
      },
    service: {
      select: {
        id: true,
        name: true,
        category: true
        }
      },
    department: {
      select: {
        id: true,
        name: true
        }
      },
    history: {
      orderBy: {
        timestamp: 'desc' as const
      }
    }
        }
} as const;

export const ServiceIncludes = {
  basic: {
    department: {
      select: {
        id: true,
        name: true,
        code: true
        }
      },
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    department: true,
    tenant: true,
    protocols: {
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true
        }
      }
      }
    }
        },

  withCounts: {
    department: {
      select: {
        id: true,
        name: true,
        code: true
        }
      },
    _count: {
      select: {
        protocolsSimplified: true
        }
      }
        }
} as const;

export const CitizenIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true,
    protocols: {
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true
        }
      },
        department: {
          select: {
            id: true,
            name: true
        }
      }
      },
      orderBy: {
        createdAt: 'desc' as const
      }
    },
    familyAsHead: {
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cpf: true
        }
      }
      }
    },
    familyAsMember: {
      include: {
        head: {
          select: {
            id: true,
            name: true,
            cpf: true
        }
      }
      }
    },
    notifications: {
      orderBy: {
        createdAt: 'desc' as const
      },
      take: 10
        }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        protocolsSimplified: true,
        familyAsHead: true,
        familyAsMember: true,
        notifications: true
        }
      }
        }
} as const;

// ============================================================================
// SECRETARIAS INCLUDES
// ============================================================================

export const HealthAttendanceIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true
        }
} as const;

export const HealthAppointmentIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    doctor: {
      select: {
        id: true,
        name: true,
        crm: true,
        speciality: true
        }
      }
        },

  full: {
    tenant: true,
    doctor: {
      include: {
        tenant: {
          select: {
            id: true,
            name: true
        }
      }
      }
    }
        }
} as const;

export const HealthDoctorIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true,
    appointments: {
      orderBy: {
        appointmentDate: 'desc' as const
      },
      take: 20
        }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        appointments: true
        }
      }
        }
} as const;

export const VulnerableFamilyIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true,
    benefitRequests: {
      include: {
        deliveries: true
        },
      orderBy: {
        requestDate: 'desc' as const
      }
    },
    homeVisits: {
      orderBy: {
        visitDate: 'desc' as const
      }
    }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        benefitRequests: true,
        homeVisits: true
        }
      }
        }
} as const;

export const BenefitRequestIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    family: {
      select: {
        id: true,
        familyHeadName: true,
        familyHeadCpf: true,
        address: true
        }
      }
        },

  full: {
    tenant: true,
    family: {
      include: {
        homeVisits: {
          orderBy: {
            visitDate: 'desc' as const
          },
          take: 5
        }
      }
    },
    deliveries: {
      orderBy: {
        deliveryDate: 'desc' as const
      }
    }
        }
} as const;

export const CulturalAttendanceIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true
        }
} as const;

export const SportsAttendanceIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true
        }
} as const;

export const HousingAttendanceIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true
        }
} as const;

export const HousingProgramIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true,
    registrations: {
      orderBy: {
        registrationDate: 'desc' as const
      }
    }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        registrations: true
        }
      }
        }
} as const;

// ============================================================================
// EDUCAÇÃO INCLUDES
// ============================================================================

export const SchoolIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true,
    classes: {
      orderBy: {
        name: 'asc' as const
      }
    },
    students: {
      orderBy: {
        name: 'asc' as const
      },
      take: 100
        }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        classes: true,
        students: true
        }
      }
        }
} as const;

export const StudentIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    school: {
      select: {
        id: true,
        name: true,
        code: true
        }
      }
        },

  full: {
    tenant: true,
    school: true,
    enrollments: {
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            shift: true
        }
      }
      },
      orderBy: {
        year: 'desc' as const
      }
    },
    attendances: {
      orderBy: {
        date: 'desc' as const
      },
      take: 30
        },
    incidents: {
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true
        }
      }
      },
      orderBy: {
        createdAt: 'desc' as const
      }
    }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    school: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        enrollments: true,
        attendances: true,
        incidents: true
        }
      }
        }
} as const;

export const SchoolClassIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    school: {
      select: {
        id: true,
        name: true,
        code: true
        }
      }
        },

  full: {
    tenant: true,
    school: true,
    enrollments: {
      include: {
        student: {
          select: {
            id: true,
            name: true,
            cpf: true,
            parentName: true,
            parentPhone: true
        }
      }
      }
    },
    attendances: {
      include: {
        student: {
          select: {
            id: true,
            name: true
        }
      }
      },
      orderBy: {
        date: 'desc' as const
      },
      take: 100
        },
    incidents: {
      include: {
        student: {
          select: {
            id: true,
            name: true
        }
      }
      },
      orderBy: {
        createdAt: 'desc' as const
      }
    }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    school: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        enrollments: true,
        attendances: true,
        incidents: true
        }
      }
        }
} as const;

// ============================================================================
// ANALYTICS E RELATÓRIOS INCLUDES
// ============================================================================

export const ReportIncludes = {
  basic: {
    executions: {
      orderBy: {
        startedAt: 'desc' as const
      },
      take: 5
        }
        },

  full: {
    executions: {
      orderBy: {
        startedAt: 'desc' as const
      }
    }
        },

  withCounts: {
    _count: {
      select: {
        executions: true
        }
      }
        }
} as const;

export const AlertIncludes = {
  basic: {
    triggers: {
      where: {
        isResolved: false
        },
      orderBy: {
        triggeredAt: 'desc' as const
      },
      take: 10
        }
        },

  full: {
    triggers: {
      orderBy: {
        triggeredAt: 'desc' as const
      }
    }
        },

  withCounts: {
    _count: {
      select: {
        triggers: true
        }
      }
        }
} as const;

// ============================================================================
// AGRICULTURE E OBRAS INCLUDES
// ============================================================================

export const RuralProducerIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true,
    properties: {
      orderBy: {
        name: 'asc' as const
      }
    }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        properties: true
        }
      }
        }
} as const;

export const PublicWorkIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      }
        },

  full: {
    tenant: true
        }
} as const;

// ============================================================================
// EMAIL INCLUDES
// ============================================================================

export const EmailServerIncludes = {
  basic: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    domains: {
      select: {
        id: true,
        domainName: true,
        isVerified: true
        }
      }
        },

  full: {
    tenant: true,
    domains: true,
    users: {
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isAdmin: true
        }
      },
    statistics: {
      orderBy: {
        date: 'desc' as const
      },
      take: 30
        }
        },

  withCounts: {
    tenant: {
      select: {
        id: true,
        name: true
        }
      },
    _count: {
      select: {
        domains: true,
        users: true,
        emails: true,
        logs: true
        }
      }
        }
} as const;

export const EmailIncludes = {
  basic: {
    emailServer: {
      select: {
        id: true,
        hostname: true
        }
      },
    domain: {
      select: {
        id: true,
        domainName: true
        }
      },
    user: {
      select: {
        id: true,
        email: true,
        name: true
        }
      }
        },

  full: {
    emailServer: true,
    
    user: true,
    events: {
      orderBy: {
        timestamp: 'desc' as const
      }
    }
        },

  withCounts: {
    emailServer: {
      select: {
        id: true,
        hostname: true
        }
      },
    _count: {
      select: {
        events: true
        }
      }
        }
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Combina múltiplos includes de forma type-safe
 */
export function combineIncludes<T extends Record<string, any>[]>(...includes: T): T[0] {
  return Object.assign({}, ...includes);
}

/**
 * Cria um include básico com tenant para qualquer entidade
 */
export function withTenant() {
  return {
    tenant: {
      select: {
        id: true,
        name: true,
        status: true
        }
      }
        };
}

/**
 * Adiciona paginação a qualquer query com include
 */
export function withPagination(page: number = 1, limit: number = 20) {
  return {
    skip: (page - 1) * limit,
    take: limit
        };
}

/**
 * Template para queries com ordenação e paginação
 */
export function createPaginatedQuery<T>(
  include: T,
  page: number = 1,
  limit: number = 20,
  orderBy?: any
) {
  return {
    include,
    ...withPagination(page, limit),
    ...(orderBy && { orderBy })
        };
}