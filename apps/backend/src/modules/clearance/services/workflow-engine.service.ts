import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClearanceStatus, ApprovalStatus, CertificateType, ExamEligibilityStatus, AuditAction } from '@prisma/client';
import * as crypto from 'crypto';

interface WorkflowStage {
  role: string;
  label: string;
  order: number;
}

const WORKFLOW_STAGES: WorkflowStage[] = [
  { role: 'FINANCE_OFFICER', label: 'Finance Clearance', order: 1 },
  { role: 'LIBRARY_OFFICER', label: 'Library Clearance', order: 2 },
  { role: 'LABORATORY_OFFICER', label: 'Laboratory Clearance', order: 3 },
  { role: 'SPORTS_OFFICER', label: 'Sports Clearance', order: 4 },
  { role: 'DEPARTMENT_OFFICER', label: 'Department Approval', order: 5 },
  { role: 'REGISTRAR', label: 'Registrar Approval', order: 6 },
];

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.clearanceRequest.findUnique({
      where: { id },
      include: {
        student: { include: { user: true, department: true, course: true } },
        semester: true,
        approvals: { include: { officer: { select: { firstName: true, lastName: true, role: true } } } },
      },
    });
  }

  async createClearanceWithWorkflow(studentId: string, semesterId: string) {
    const existing = await this.prisma.clearanceRequest.findUnique({
      where: { studentId_semesterId: { studentId, semesterId } },
    });
    if (existing) throw new BadRequestException('Clearance already exists for this semester');

    const clearance = await this.prisma.clearanceRequest.create({
      data: { studentId, semesterId, status: ClearanceStatus.PENDING },
    });

    for (const stage of WORKFLOW_STAGES) {
      const officers = await this.prisma.user.findMany({
        where: { role: stage.role as any, isActive: true },
        take: 1,
      });
      if (officers.length > 0) {
        await this.prisma.clearanceApproval.create({
          data: {
            clearanceRequestId: clearance.id,
            officerId: officers[0].id,
            status: ApprovalStatus.PENDING,
          },
        });
      }
    }
    return this.findById(clearance.id);
  }

  async approveStage(officerId: string, clearanceRequestId: string, remarks?: string) {
    const approval = await this.prisma.clearanceApproval.findUnique({
      where: { clearanceRequestId_officerId: { clearanceRequestId, officerId } },
    });
    if (!approval) throw new BadRequestException('No approval task found for this officer');
    if (approval.status !== ApprovalStatus.PENDING) throw new BadRequestException('Already processed');

    const updated = await this.prisma.clearanceApproval.update({
      where: { id: approval.id },
      data: { status: ApprovalStatus.APPROVED, remarks: remarks || null, approvedAt: new Date() },
    });
    await this.checkAndAdvanceWorkflow(clearanceRequestId);
    return updated;
  }

  async rejectStage(officerId: string, clearanceRequestId: string, remarks: string) {
    if (!remarks) throw new BadRequestException('Remarks required for rejection');
    const approval = await this.prisma.clearanceApproval.findUnique({
      where: { clearanceRequestId_officerId: { clearanceRequestId, officerId } },
    });
    if (!approval) throw new BadRequestException('No approval task found');

    const updated = await this.prisma.clearanceApproval.update({
      where: { id: approval.id },
      data: { status: ApprovalStatus.REJECTED, remarks, approvedAt: new Date() },
    });
    await this.prisma.clearanceRequest.update({
      where: { id: clearanceRequestId },
      data: { status: ClearanceStatus.REJECTED, completedAt: new Date() },
    });
    return updated;
  }

  async conditionallyApprove(officerId: string, clearanceRequestId: string, remarks: string) {
    const approval = await this.prisma.clearanceApproval.findUnique({
      where: { clearanceRequestId_officerId: { clearanceRequestId, officerId } },
    });
    if (!approval) throw new BadRequestException('No approval task found');
    return this.prisma.clearanceApproval.update({
      where: { id: approval.id },
      data: { status: ApprovalStatus.CONDITIONAL, remarks, approvedAt: new Date() },
    });
  }

  async getWorkflowTimeline(clearanceRequestId: string) {
    const clearance = await this.prisma.clearanceRequest.findUnique({
      where: { id: clearanceRequestId },
      include: {
        approvals: {
          include: { officer: { select: { firstName: true, lastName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        semester: { include: { academicYear: true } },
      },
    });
    if (!clearance) throw new BadRequestException('Clearance not found');

    const stages = WORKFLOW_STAGES.map((stage) => {
      const approval = clearance.approvals.find(a => a.officer.role === stage.role);
      return {
        stage: stage.label,
        role: stage.role,
        order: stage.order,
        status: approval?.status || 'LOCKED',
        officer: approval ? { name: approval.officer.firstName + ' ' + approval.officer.lastName, role: approval.officer.role } : null,
        remarks: approval?.remarks || null,
        approvedAt: approval?.approvedAt || null,
        isActive: approval?.status === ApprovalStatus.PENDING,
        isComplete: approval?.status === ApprovalStatus.APPROVED,
        isRejected: approval?.status === ApprovalStatus.REJECTED,
      };
    });

    return {
      id: clearance.id,
      status: clearance.status,
      student: clearance.student.user.firstName + ' ' + clearance.student.user.lastName,
      semester: clearance.semester?.name,
      submittedAt: clearance.submittedAt,
      completedAt: clearance.completedAt,
      stages,
      progress: {
        total: stages.length,
        completed: stages.filter(s => s.isComplete).length,
        rejected: stages.filter(s => s.isRejected).length,
        percentage: Math.round((stages.filter(s => s.isComplete).length / stages.length) * 100),
      },
    };
  }

  signData(data: string): string {
    const secret = process.env.QR_SECRET || 'clearpath-default-secret';
    return crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
  }

  verifySignature(data: string, signature: string): boolean {
    const expected = this.signData(data);
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  private async checkAndAdvanceWorkflow(clearanceRequestId: string) {
    const clearance = await this.prisma.clearanceRequest.findUnique({
      where: { id: clearanceRequestId },
      include: { approvals: true },
    });
    if (!clearance) return;

    const totalStages = clearance.approvals.length;
    const approvedCount = clearance.approvals.filter(a => a.status === ApprovalStatus.APPROVED).length;
    const rejectedCount = clearance.approvals.filter(a => a.status === ApprovalStatus.REJECTED).length;

    let newStatus: ClearanceStatus;
    if (rejectedCount > 0) {
      newStatus = ClearanceStatus.REJECTED;
    } else if (approvedCount === totalStages) {
      newStatus = ClearanceStatus.APPROVED;
      await this.generateClearanceCertificate(clearanceRequestId);
    } else if (approvedCount > 0) {
      newStatus = ClearanceStatus.IN_PROGRESS;
    } else {
      newStatus = ClearanceStatus.PENDING;
    }

    await this.prisma.clearanceRequest.update({
      where: { id: clearanceRequestId },
      data: { status: newStatus, completedAt: newStatus === ClearanceStatus.APPROVED ? new Date() : undefined },
    });

    if (newStatus === ClearanceStatus.APPROVED) {
      await this.setExamEligibility(clearance.studentId, clearance.semesterId);
    }
  }

  private async generateClearanceCertificate(clearanceRequestId: string) {
    const clearance = await this.prisma.clearanceRequest.findUnique({
      where: { id: clearanceRequestId },
      include: { student: { include: { user: true, department: true, course: true } }, semester: true },
    });
    if (!clearance) return;

    const certId = 'CERT-' + clearance.student.studentId + '-' + Date.now();
    const studentName = clearance.student.user.firstName + ' ' + clearance.student.user.lastName;
    const qrData = JSON.stringify({
      certId,
      studentId: clearance.student.studentId,
      studentName,
      department: clearance.student.department?.name || '',
      course: clearance.student.course?.name || '',
      semester: clearance.semester?.name || '',
      issuedAt: new Date().toISOString(),
    });
    const signature = this.signData(qrData);

    const certificate = await this.prisma.certificate.create({
      data: {
        certificateId: certId,
        studentId: clearance.student.userId,
        issuedById: clearance.student.userId,
        certificateType: CertificateType.CLEARANCE,
        title: 'Clearance Certificate',
        description: `Official clearance certificate for ${studentName} - ${clearance.semester?.name || ''}`,
        metadata: { qrData, signature, clearanceRequestId },
        qrCodeUrl: signature,
        isVerified: true,
      },
    });

    await this.prisma.qRCode.create({
      data: {
        code: signature,
        userId: clearance.student.userId,
        data: JSON.parse(qrData),
        purpose: 'clearance_certificate_verification',
        isActive: true,
      },
    });

    this.logger.log(`Clearance certificate generated: ${certId} for student ${clearance.student.studentId}`);
    return certificate;
  }

  private async setExamEligibility(studentId: string, semesterId: string) {
    await this.prisma.examEligibility.upsert({
      where: { studentId_semesterId: { studentId, semesterId } },
      update: {
        status: ExamEligibilityStatus.ELIGIBLE,
        verifiedAt: new Date(),
      },
      create: {
        studentId,
        semesterId,
        status: ExamEligibilityStatus.ELIGIBLE,
        verifiedAt: new Date(),
      },
    });
  }
}
