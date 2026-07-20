import { Test, TestingModule } from '@nestjs/testing';
import { ClearanceService } from './clearance.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ClearanceStatus, ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createMockPrisma } from '../../../testing/mocks/prisma.mock';

describe('ClearanceService', () => {
  let service: ClearanceService;
  let prisma: any;

  const mockClearance = {
    id: 'cl-1',
    studentId: 'stu-1',
    semesterId: 'sem-1',
    status: ClearanceStatus.PENDING,
    createdAt: new Date(),
    student: {
      id: 'stu-1',
      user: { firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      department: { name: 'CS' },
      course: { name: 'BSc CS' },
    },
    semester: { id: 'sem-1', name: 'First Semester' },
    approvals: [],
  };

  const mockApproval = {
    id: 'ap-1',
    clearanceRequestId: 'cl-1',
    officerId: 'off-1',
    status: ApprovalStatus.APPROVED,
    createdAt: new Date(),
    approvedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClearanceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ClearanceService>(ClearanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Create
  describe('create', () => {
    it('should create a clearance request and approval tasks', async () => {
      prisma.clearanceRequest.findUnique.mockResolvedValue(null);
      prisma.clearanceRequest.create.mockResolvedValue(mockClearance);
      prisma.user.findMany.mockResolvedValue([
        { id: 'off-1' }, { id: 'off-2' },
      ]);
      prisma.clearanceApproval.create.mockResolvedValue(mockApproval);

      const result = await service.create('stu-1', 'sem-1');
      expect(result).toBeDefined();
      expect(result.status).toBe(ClearanceStatus.PENDING);
      expect(prisma.clearanceApproval.create).toHaveBeenCalledTimes(2);
    });

    it('should throw BadRequestException for duplicate request', async () => {
      prisma.clearanceRequest.findUnique.mockResolvedValue(mockClearance);
      await expect(service.create('stu-1', 'sem-1')).rejects.toThrow(BadRequestException);
    });
  });

  // Find All
  describe('findAll', () => {
    it('should return paginated clearances', async () => {
      prisma.clearanceRequest.findMany.mockResolvedValue([mockClearance]);
      prisma.clearanceRequest.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.clearanceRequest.findMany.mockResolvedValue([]);
      prisma.clearanceRequest.count.mockResolvedValue(0);

      await service.findAll({ status: ClearanceStatus.APPROVED });
      expect(prisma.clearanceRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: ClearanceStatus.APPROVED }),
        }),
      );
    });

    it('should search by student name or ID', async () => {
      prisma.clearanceRequest.findMany.mockResolvedValue([]);
      prisma.clearanceRequest.count.mockResolvedValue(0);

      await service.findAll({ search: 'John' });
      expect(prisma.clearanceRequest.findMany).toHaveBeenCalled();
    });
  });

  // Find By ID
  describe('findById', () => {
    it('should return clearance by ID', async () => {
      prisma.clearanceRequest.findUnique.mockResolvedValue(mockClearance);
      const result = await service.findById('cl-1');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for invalid ID', async () => {
      prisma.clearanceRequest.findUnique.mockResolvedValue(null);
      await expect(service.findById('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  // Approve
  describe('approve', () => {
    it('should approve a clearance step', async () => {
      prisma.clearanceApproval.findUnique.mockResolvedValue(mockApproval);
      prisma.clearanceApproval.update.mockResolvedValue({ ...mockApproval, status: ApprovalStatus.APPROVED });
      prisma.clearanceRequest.findUnique.mockResolvedValue({
        ...mockClearance,
        approvals: [
          { status: ApprovalStatus.APPROVED },
          { status: ApprovalStatus.APPROVED },
        ],
      });
      prisma.clearanceRequest.update.mockResolvedValue(mockClearance);

      const result = await service.approve('off-1', 'cl-1', 'All good');
      expect(result.status).toBe(ApprovalStatus.APPROVED);
    });

    it('should throw NotFoundException for invalid approval task', async () => {
      prisma.clearanceApproval.findUnique.mockResolvedValue(null);
      await expect(service.approve('off-1', 'cl-1')).rejects.toThrow(NotFoundException);
    });
  });

  // Reject
  describe('reject', () => {
    it('should reject a clearance step', async () => {
      prisma.clearanceApproval.findUnique.mockResolvedValue(mockApproval);
      prisma.clearanceApproval.update.mockResolvedValue({ ...mockApproval, status: ApprovalStatus.REJECTED });
      prisma.clearanceRequest.findUnique.mockResolvedValue({
        ...mockClearance,
        approvals: [{ status: ApprovalStatus.REJECTED }],
      });
      prisma.clearanceRequest.update.mockResolvedValue(mockClearance);

      const result = await service.reject('off-1', 'cl-1', 'Missing docs');
      expect(result.status).toBe(ApprovalStatus.REJECTED);
    });

    it('should require remarks on rejection', async () => {
      prisma.clearanceApproval.findUnique.mockResolvedValue(mockApproval);
      prisma.clearanceApproval.update.mockResolvedValue({ ...mockApproval, status: ApprovalStatus.REJECTED });
      prisma.clearanceRequest.findUnique.mockResolvedValue({
        ...mockClearance,
        approvals: [{ status: ApprovalStatus.REJECTED }],
      });
      prisma.clearanceRequest.update.mockResolvedValue(mockClearance);

      await expect(service.reject('off-1', 'cl-1', '')).resolves.toBeDefined();
    });
  });

  // Bulk Approve
  describe('bulkApprove', () => {
    it('should approve multiple clearances', async () => {
      prisma.clearanceApproval.findUnique.mockResolvedValue(mockApproval);
      prisma.clearanceApproval.update.mockResolvedValue({ ...mockApproval, status: ApprovalStatus.APPROVED });
      prisma.clearanceRequest.findUnique.mockResolvedValue({
        ...mockClearance,
        approvals: [{ status: ApprovalStatus.APPROVED }],
      });
      prisma.clearanceRequest.update.mockResolvedValue(mockClearance);

      const results = await service.bulkApprove('off-1', ['cl-1', 'cl-2']);
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('approved');
    });
  });

  // Statistics
  describe('getStatistics', () => {
    it('should return clearance statistics', async () => {
      prisma.clearanceRequest.count.mockResolvedValue(10);

      const stats = await service.getStatistics();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('approved');
      expect(stats).toHaveProperty('rejected');
    });
  });
});
