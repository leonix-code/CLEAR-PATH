import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClearanceStatus, ApprovalStatus, UserRole } from '@prisma/client';

/**
 * REDESIGN (FIX H1/H2): approvals are scoped to a WORKFLOW DEFINITION of required
 * STEPS (one per department/role), NOT one row per officer in the university.
 * Each step is satisfied by ANY authorized officer of that role/department.
 */
@Injectable()
export class ClearanceService {
  private readonly logger = new Logger(ClearanceService.name);
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, semesterId: string) {
    return this.prisma.$transaction(async (tx) => {         // FIX H2: atomic
      const existing = await tx.clearanceRequest.findUnique({
        where: { studentId_semesterId: { studentId, semesterId } },
      });
      if (existing) throw new BadRequestException('Clearance request already exists for this semester');

      const student = await tx.student.findUnique({ where: { id: studentId } });
      if (!student) throw new NotFoundException('Student not found');

      // Resolve required steps from an active WorkflowDefinition (per course/level),
      // falling back to the default required roles.
      const steps = await tx.workflowStep.findMany({
        where: { definition: { isActive: true } },
        orderBy: { order: 'asc' },
      });
      const required = steps.length ? steps : DEFAULT_STEPS;

      const request = await tx.clearanceRequest.create({
        data: { studentId, semesterId, status: ClearanceStatus.PENDING },
      });

      await tx.clearanceApproval.createMany({       // FIX H1/H2: one row per STEP, bulk insert
        data: required.map((s: any) => ({
          clearanceRequestId: request.id,
          requiredRole: s.requiredRole ?? s.role,
          departmentId: s.departmentId ?? student.departmentId,
          order: s.order ?? 0,
          status: ApprovalStatus.PENDING,
        })),
      });
      return request;
    });
  }

  /** Any officer holding the step's role may act on it. Enforces role + optional sequencing. */
  async act(officer: { id: string; role: UserRole }, approvalId: string, decision: 'APPROVE' | 'REJECT', remarks?: string) {
    return this.prisma.$transaction(async (tx) => {
      const approval = await tx.clearanceApproval.findUnique({ where: { id: approvalId } });
      if (!approval) throw new NotFoundException('Approval step not found');
      if (approval.requiredRole !== officer.role) throw new BadRequestException('Not authorized for this step');
      if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('Step already decided');

      // Sequential mode: block if an earlier-order step is still pending.
      const earlierPending = await tx.clearanceApproval.count({
        where: { clearanceRequestId: approval.clearanceRequestId, order: { lt: approval.order }, status: ApprovalStatus.PENDING },
      });
      if (earlierPending > 0) throw new BadRequestException('Earlier approval step still pending');

      await tx.clearanceApproval.update({
        where: { id: approvalId },
        data: {
          status: decision === 'APPROVE' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
          officerId: officer.id, remarks, approvedAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: { userId: officer.id, action: decision === 'APPROVE' ? 'APPROVE' : 'REJECT', entity: 'ClearanceApproval', entityId: approvalId, newValue: { remarks } },
      });
      await this.recompute(tx, approval.clearanceRequestId);
      return { id: approvalId, decision };
    });
  }

  private async recompute(tx: any, requestId: string) {
    const approvals = await tx.clearanceApproval.findMany({ where: { clearanceRequestId: requestId } });
    const total = approvals.length;
    const approved = approvals.filter((a: any) => a.status === ApprovalStatus.APPROVED).length;
    const rejected = approvals.filter((a: any) => a.status === ApprovalStatus.REJECTED).length;
    let status: ClearanceStatus;
    if (rejected > 0) status = ClearanceStatus.REJECTED;
    else if (approved === total) status = ClearanceStatus.APPROVED;
    else if (approved > 0) status = ClearanceStatus.IN_PROGRESS;
    else status = ClearanceStatus.PENDING;
    await tx.clearanceRequest.update({
      where: { id: requestId },
      data: { status, completedAt: status === ClearanceStatus.APPROVED ? new Date() : null },
    });
  }
}

const DEFAULT_STEPS = [
  { requiredRole: 'FINANCE_OFFICER', order: 1 },
  { requiredRole: 'LIBRARY_OFFICER', order: 2 },
  { requiredRole: 'LABORATORY_OFFICER', order: 3 },
  { requiredRole: 'SPORTS_OFFICER', order: 4 },
  { requiredRole: 'DEPARTMENT_OFFICER', order: 5 },
];
