import { Test, TestingModule } from '@nestjs/testing';
import { AIService } from './ai.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AIService', () => {
  let service: AIService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    clearanceRequest: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    clearanceApproval: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    department: {
      findMany: jest.fn(),
    },
    semester: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('chat', () => {
    it('should return greeting when no user messages', async () => {
      const result = await service.chat('user-1', [
        { role: 'assistant', content: 'Hello!' },
      ]);

      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBe(1);
      expect(result.followUps.length).toBeGreaterThan(0);
    });

    it('should respond to clearance status queries', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({
        userId: 'user-1',
        clearances: [
          {
            id: 'clearance-1',
            status: 'IN_PROGRESS',
            approvals: [
              {
                status: 'APPROVED',
                officer: { firstName: 'John', lastName: 'Doe', role: 'FINANCE_OFFICER' },
              },
              {
                status: 'PENDING',
                officer: { firstName: 'Jane', lastName: 'Smith', role: 'LIBRARY_OFFICER' },
              },
            ],
          },
        ],
      });

      const result = await service.chat('user-1', [
        { role: 'user', content: 'What is my clearance status?' },
      ]);

      expect(result.intent).toBe('status');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reply).toContain('IN_PROGRESS');
      expect(result.reply).toContain('LIBRARY_OFFICER');
    });

    it('should respond to knowledge base queries', async () => {
      const result = await service.chat('user-2', [
        { role: 'user', content: 'How do I download my certificate?' },
      ]);

      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.reply).toContain('certificate');
    });

    it('should handle analytics queries', async () => {
      mockPrisma.clearanceRequest.count
        .mockResolvedValueOnce(100)   // total
        .mockResolvedValueOnce(75)    // approved
        .mockResolvedValueOnce(10)    // rejected
        .mockResolvedValueOnce(10)    // pending
        .mockResolvedValueOnce(5);    // in_progress

      const result = await service.chat('user-1', [
        { role: 'user', content: 'Show me clearance statistics' },
      ]);

      expect(result.intent).toBe('analytics');
      expect(result.reply).toContain('Analytics');
    });
  });

  describe('naturalLanguageSearch', () => {
    it('should search students by query', async () => {
      mockPrisma.student.findMany.mockResolvedValue([
        {
          id: 'student-1',
          studentId: 'STU001',
          user: { firstName: 'Alice', lastName: 'Johnson', email: 'alice@test.com' },
        },
      ]);

      const results = await service.naturalLanguageSearch('user-1', 'Alice');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('student');
      expect(results[0].title).toContain('Alice');
    });

    it('should search clearances with filters', async () => {
      mockPrisma.clearanceRequest.findMany.mockResolvedValue([
        {
          id: 'clearance-1',
          status: 'PENDING',
          createdAt: new Date(),
          student: {
            user: { firstName: 'Bob', lastName: 'Smith' },
          },
        },
      ]);

      const results = await service.naturalLanguageSearch('user-1', 'Bob', { status: 'PENDING' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('clearance');
    });

    it('should search departments', async () => {
      mockPrisma.department.findMany.mockResolvedValue([
        { id: 'dept-1', name: 'Computer Science', code: 'CS' },
      ]);

      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.clearanceRequest.findMany.mockResolvedValue([]);

      const results = await service.naturalLanguageSearch('user-1', 'Computer Science', { type: 'department' });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('department');
    });

    it('should return empty results when nothing matches', async () => {
      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.clearanceRequest.findMany.mockResolvedValue([]);
      mockPrisma.department.findMany.mockResolvedValue([]);

      const results = await service.naturalLanguageSearch('user-1', 'zzzznotfound');

      expect(results).toEqual([]);
    });
  });

  describe('getRecommendations', () => {
    it('should recommend submitting clearance for students without one', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'STUDENT',
        student: { clearances: [] },
      });

      const recommendations = await service.getRecommendations('user-1');

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.type === 'action')).toBe(true);
    });

    it('should recommend certificate download for approved clearances', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-2',
        role: 'STUDENT',
        student: {
          clearances: [{ id: 'c-1', status: 'APPROVED' }],
        },
      });

      const recommendations = await service.getRecommendations('user-2');

      expect(recommendations.some(r => r.title.includes('Download'))).toBe(true);
    });

    it('should alert about rejection with reason', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-3',
        role: 'STUDENT',
        student: {
          clearances: [{ id: 'c-2', status: 'REJECTED' }],
        },
      });
      mockPrisma.clearanceApproval.findFirst.mockResolvedValue({
        remarks: 'Library books not returned',
      });

      const recommendations = await service.getRecommendations('user-3');

      expect(recommendations.some(r => r.type === 'alert')).toBe(true);
      expect(recommendations.some(r => r.title.includes('Rejected'))).toBe(true);
    });

    it('should show pending clearance count for admins', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: 'ADMINISTRATOR',
        student: null,
      });
      mockPrisma.clearanceRequest.count.mockResolvedValue(15);
      mockPrisma.clearanceApproval.findMany.mockResolvedValue([]);
      mockPrisma.clearanceApproval.findFirst.mockResolvedValue(null);

      const recommendations = await service.getRecommendations('admin-1');

      expect(recommendations.some(r => r.title.includes('Pending'))).toBe(true);
    });
  });

  describe('getPredictiveAnalytics', () => {
    it('should return predictive analytics data', async () => {
      mockPrisma.clearanceRequest.findMany.mockResolvedValue([
        {
          status: 'APPROVED',
          completedAt: new Date(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          status: 'APPROVED',
          completedAt: new Date(),
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ]);
      mockPrisma.clearanceRequest.count.mockResolvedValue(10);
      mockPrisma.department.findMany.mockResolvedValue([]);
      mockPrisma.clearanceApproval.count.mockResolvedValue(0);
      mockPrisma.clearanceApproval.findMany.mockResolvedValue([]);
      mockPrisma.semester.findFirst.mockResolvedValue(null);

      const result = await service.getPredictiveAnalytics();

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalCompleted).toBe(2);
      expect(result.predictions).toBeDefined();
      expect(result.trending).toBeDefined();
    });
  });

  describe('getSmartReports', () => {
    it('should return smart report data', async () => {
      mockPrisma.clearanceRequest.findMany.mockResolvedValue([
        {
          id: 'c-1',
          status: 'APPROVED',
          createdAt: new Date(),
          completedAt: new Date(),
          student: {
            user: { firstName: 'Alice', lastName: 'Johnson' },
            department: { name: 'Computer Science' },
          },
          approvals: [
            {
              status: 'APPROVED',
              officer: { firstName: 'John', lastName: 'Doe', role: 'FINANCE_OFFICER' },
            },
          ],
        },
        {
          id: 'c-2',
          status: 'REJECTED',
          createdAt: new Date(),
          completedAt: null,
          student: {
            user: { firstName: 'Bob', lastName: 'Smith' },
            department: { name: 'Mathematics' },
          },
          approvals: [
            {
              status: 'REJECTED',
              officer: { firstName: 'Jane', lastName: 'Smith', role: 'LIBRARY_OFFICER' },
            },
          ],
        },
      ]);

      const result = await service.getSmartReports({});

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.total).toBe(2);
      expect(result.summary.approved).toBe(1);
      expect(result.summary.rejected).toBe(1);
      expect(result.departments.length).toBe(2);
      expect(result.stages.length).toBeGreaterThan(0);
    });
  });
});
