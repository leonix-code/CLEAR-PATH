// Mock PrismaService for unit tests
// Provides a fully mocked Prisma client with all models needed by services

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  clearanceRequest: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  clearanceApproval: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  notification: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  department: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  academicYear: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  semester: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

export const createMockPrisma = () => {
  // Deep clone to get fresh mocks for each test
  const cloned: any = {};
  for (const [model, methods] of Object.entries(mockPrisma)) {
    cloned[model] = {};
    for (const [method, fn] of Object.entries(methods as Record<string, jest.Mock>)) {
      cloned[model][method] = jest.fn();
    }
  }
  cloned.$connect = jest.fn();
  cloned.$disconnect = jest.fn();
  return cloned;
};

export const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
  verify: jest.fn().mockReturnValue({ sub: 'test-user-id', email: 'test@test.com', role: 'STUDENT' }),
  decode: jest.fn().mockReturnValue({ sub: 'test-user-id', email: 'test@test.com', role: 'STUDENT' }),
};

export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      FRONTEND_URL: 'http://localhost:3000',
      PORT: 4000,
      NODE_ENV: 'test',
    };
    return config[key] ?? defaultValue;
  }),
};
