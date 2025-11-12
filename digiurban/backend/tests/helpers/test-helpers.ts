import { PrismaClient } from '@prisma/client';

// Helper para criar mock de tenant
export function createMockTenant(overrides = {}) {
  return {
    id: 'test-tenant-id',
    name: 'Test Municipality',
    slug: 'test-municipality',
    domain: 'test.digiurban.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper para criar mock de citizen
export function createMockCitizen(overrides = {}) {
  return {
    id: 'test-citizen-id',
    name: 'Test Citizen',
    email: 'citizen@test.com',
    cpf: '12345678900',
    phone: '11999999999',
    address: 'Test Address',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper para criar mock de admin
export function createMockAdmin(overrides = {}) {
  return {
    id: 'test-admin-id',
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin',
    department: 'education',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper para criar mock de service
export function createMockService(overrides = {}) {
  return {
    id: 'test-service-id',
    templateId: 'test-template-id',
    name: 'Test Service',
    description: 'Test service description',
    category: 'education',
    serviceType: 'REQUEST',
    moduleType: 'education',
    moduleEntity: 'StudentEnrollment',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper para criar mock de protocol
export function createMockProtocol(overrides = {}) {
  return {
    id: 'test-protocol-id',
    citizenId: 'test-citizen-id',
    serviceId: 'test-service-id',
    number: '2025/000001',
    title: 'Test Protocol',
    description: 'Test protocol description',
    status: 'VINCULADO',
    priority: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper para criar mock de service template
export function createMockServiceTemplate(overrides = {}) {
  return {
    id: 'test-template-id',
    code: 'EDU_TEST_001',
    name: 'Test Template',
    category: 'Educação',
    description: 'Test template description',
    icon: 'GraduationCap',
    defaultFields: [],
    requiredDocs: [],
    estimatedTime: '3 dias úteis',
    moduleType: 'education',
    moduleEntity: 'StudentEnrollment',
    fieldMapping: {},
    isActive: true,
    version: '1.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper para criar mock de module action
export function createMockModuleAction(overrides = {}) {
  return {
    type: 'education',
    entity: 'StudentEnrollment',
    action: 'create',
    data: {
      studentName: 'Test Student',
      birthDate: '2015-01-01',
      parentName: 'Test Parent',
      parentPhone: '11999999999',
      desiredGrade: '1º ano',
    },
    protocol: '2025/000001',
    serviceId: 'test-service-id',
    ...overrides,
  };
}

// Helper para criar mock de transaction
export function createMockTransaction() {
  const mockPrisma = new PrismaClient();
  return mockPrisma;
}

// Helper para resetar todos os mocks
export function resetAllMocks() {
  jest.clearAllMocks();
  jest.resetAllMocks();
}

// Helper para esperar async
export function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
