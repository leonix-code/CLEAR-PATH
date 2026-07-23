import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ClearanceStatus } from '@prisma/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
}

interface KnowledgeEntry {
  id: string;
  keywords: string[];
  answer: string;
  category: string;
  priority: number;
  followUps?: string[];
}

export interface SearchResult {
  type: 'clearance' | 'student' | 'department' | 'certificate' | 'notification';
  id: string;
  title: string;
  description: string;
  url: string;
  score: number;
}

export interface Recommendation {
  id: string;
  type: 'action' | 'insight' | 'alert' | 'suggestion';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  link?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  private readonly knowledgeBase: KnowledgeEntry[] = [
    {
      id: 'kb-clearance-overview',
      keywords: ['clearance', 'overview', 'what is', 'process'],
      category: 'clearance',
      priority: 10,
      answer: 'Clearance is the process of getting approvals from all relevant departments before examinations. It includes 6 sequential stages: Finance Officer, Library Officer, Laboratory Officer, Sports Officer, Department Officer, and Registrar. Each stage must be approved before moving to the next. Once fully cleared, you receive a certificate with a unique QR code and are marked as exam-eligible.',
      followUps: ['How do I submit a clearance request?', 'What documents do I need?', 'How long does clearance take?'],
    },
    {
      id: 'kb-submit-clearance',
      keywords: ['submit', 'apply', 'new clearance', 'create', 'request'],
      category: 'clearance',
      priority: 8,
      answer: 'To submit a clearance request, navigate to your Student Dashboard and click "Submit New Clearance". The system will create a clearance request and assign approval tasks to each officer in the workflow order. You can track progress in real-time from your dashboard.',
      followUps: ['What happens after I submit?', 'Can I edit my submission?', 'What if I make a mistake?'],
    },
    {
      id: 'kb-workflow',
      keywords: ['workflow', 'stages', 'approval chain', 'sequence', 'order', 'steps'],
      category: 'workflow',
      priority: 9,
      answer: 'The clearance workflow follows this sequential order: 1️⃣ Finance Officer – verifies fees and financial obligations 2️⃣ Library Officer – confirms library book returns 3️⃣ Laboratory Officer – checks lab equipment returns 4️⃣ Sports Officer – verifies sports equipment and dues 5️⃣ Department Officer – academic departmental approval 6️⃣ Registrar – final confirmation and certificate issuance. Each officer must approve before the next can act.',
      followUps: ['Which officer should I contact?', 'What if an officer rejects?', 'Can I skip a stage?'],
    },
    {
      id: 'kb-certificate',
      keywords: ['certificate', 'download', 'print', 'clearance certificate', 'digital'],
      category: 'certificate',
      priority: 7,
      answer: 'Your clearance certificate is automatically generated when all 6 stages are approved. It includes a unique HMAC-signed QR code for tamper-proof verification. You can download the certificate from your Student Dashboard or the Certificates section. The QR code can be scanned by invigilators for instant verification.',
      followUps: ['How do I verify my certificate?', 'What if my certificate QR is damaged?', 'Can I get a printed copy?'],
    },
    {
      id: 'kb-rejected',
      keywords: ['rejected', 'rejection', 'denied', 'failed', 'resubmit', 'appeal'],
      category: 'clearance',
      priority: 6,
      answer: 'If your clearance is rejected, the officer who rejected it will provide a reason in the remarks. To resolve this: 1) Check the rejection remarks to understand the issue 2) Address the specific requirements mentioned 3) Contact the rejecting officer if you need clarification 4) Resubmit your clearance request. Common reasons include unpaid fees, unreturned library books, or missing lab equipment.',
      followUps: ['How do I contact the officer?', 'Can I appeal a rejection?', 'How long do I have to fix issues?'],
    },
    {
      id: 'kb-exam-eligibility',
      keywords: ['exam', 'eligible', 'eligibility', 'sit for exam', 'examination', 'test'],
      category: 'eligibility',
      priority: 8,
      answer: 'Exam eligibility is automatically granted when all 6 clearance stages are approved. The system updates your eligibility status instantly. You can check your current eligibility status from your dashboard. If your clearance is in progress, you are not yet eligible for exams. Fully cleared students automatically appear on the invigilator\'s eligible list.',
      followUps: ['What if I am not eligible?', 'How do I check my eligibility?', 'When does eligibility expire?'],
    },
    {
      id: 'kb-reports',
      keywords: ['report', 'analytics', 'statistics', 'data', 'export', 'charts'],
      category: 'reports',
      priority: 5,
      answer: 'The Reports page provides comprehensive analytics including clearance trends over time, department-wise comparisons, approval rate distributions, and student statistics. You can export data in CSV, Excel, or PDF format. Charts include area trends, bar comparisons, pie distributions, and donut charts. Use the date range filter to focus on specific periods.',
      followUps: ['How do I export a report?', 'What data is available?', 'Can I schedule automatic reports?'],
    },
    {
      id: 'kb-qr-verification',
      keywords: ['qr', 'verify', 'scan', 'scanning', 'anti-tamper', 'security'],
      category: 'verification',
      priority: 6,
      answer: 'ClearPath uses HMAC-SHA256 signed QR codes for tamper-proof verification. Each certificate has a unique QR code containing encrypted clearance data. Invigilators can scan QR codes using the Invigilator Dashboard camera scanner for instant verification. The system also supports manual ID verification and offline mode for areas with low connectivity.',
      followUps: ['How does offline verification work?', 'What if QR scan fails?', 'Is the QR code secure?'],
    },
    {
      id: 'kb-finance',
      keywords: ['finance', 'fees', 'payment', 'financial', 'tuition'],
      category: 'clearance',
      priority: 5,
      answer: 'The Finance Officer checks that all financial obligations are met. This includes tuition fees, library fines, lab fees, and any other outstanding charges. Make sure all fees are paid before submitting your clearance request. Contact the Finance Office if you have questions about specific charges.',
      followUps: ['How do I pay my fees?', 'What if I cannot afford fees?', 'Can I get a payment plan?'],
    },
    {
      id: 'kb-library',
      keywords: ['library', 'books', 'return', 'library clearance', 'overdue'],
      category: 'clearance',
      priority: 5,
      answer: 'The Library Officer verifies that all library books and materials have been returned and no fines are outstanding. Return all borrowed books and pay any overdue fines before the Library clearance stage. The library maintains a record of all borrowed items and their due dates.',
      followUps: ['How do I check my library status?', 'What if I lost a book?', 'What are the library fines?'],
    },
    {
      id: 'kb-sports',
      keywords: ['sports', 'games', 'sports equipment', 'sports dues'],
      category: 'clearance',
      priority: 4,
      answer: 'The Sports Officer verifies the return of all sports equipment and payment of any sports-related dues. This includes jerseys, sports gear, and facility usage fees. Return all borrowed equipment and clear any outstanding sports obligations.',
      followUps: ['What sports equipment needs returning?', 'How much are sports dues?'],
    },
    {
      id: 'kb-department',
      keywords: ['department', 'academic', 'supervisor', 'project', 'thesis'],
      category: 'clearance',
      priority: 5,
      answer: 'The Department Officer provides academic clearance, verifying that all departmental requirements are met. This includes project submissions, thesis requirements, and any department-specific obligations. Contact your department office for specific requirements.',
      followUps: ['What are department requirements?', 'Who is my department officer?'],
    },
    {
      id: 'kb-registrar',
      keywords: ['registrar', 'final approval', 'certificate issuance'],
      category: 'clearance',
      priority: 5,
      answer: 'The Registrar provides the final stage of approval. After all other officers have approved, the Registrar confirms the clearance and triggers certificate generation. Once the Registrar approves, your certificate is automatically generated and exam eligibility is granted.',
      followUps: ['How long does Registrar approval take?', 'Can I expedite the process?'],
    },
    {
      id: 'kb-offline',
      keywords: ['offline', 'no internet', 'offline mode', 'offline verification'],
      category: 'technical',
      priority: 4,
      answer: 'ClearPath supports full offline operation through its Progressive Web App (PWA). Invigilators can verify students without internet using IndexedDB caching. Data syncs automatically when connectivity is restored. The app uses background sync to queue operations and replay them when online.',
      followUps: ['How do I enable offline mode?', 'Is my data safe offline?', 'How does sync work?'],
    },
    {
      id: 'kb-roles',
      keywords: ['role', 'permission', 'access', 'user role', 'rbac'],
      category: 'system',
      priority: 4,
      answer: 'ClearPath supports multiple user roles: Super Admin, Administrator, Registrar, Finance Officer, Department Officer, Library Officer, Laboratory Officer, Sports Officer, Hostel Officer, Lecturer, Student, Parent, and ICT Support. Each role has specific permissions and access to different features and dashboards.',
      followUps: ['What can my role do?', 'How do I change roles?', 'Can I have multiple roles?'],
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async chat(userId: string, messages: ChatMessage[]): Promise<{
    reply: string;
    intent: string;
    confidence: number;
    followUps: string[];
    metadata?: Record<string, any>;
  }> {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) {
      return {
        reply: 'Hello! I\'m your ClearPath AI assistant. How can I help you today?',
        intent: 'greeting',
        confidence: 1,
        followUps: [
          'How do I submit a clearance request?',
          'What is my clearance status?',
          'Which officers need to approve my clearance?',
          'How do I download my certificate?',
        ],
      };
    }

    const query = lastUserMessage.content.toLowerCase();
    const { intent, confidence } = this.detectIntent(query);

    if (intent === 'status' || intent === 'my_clearance') {
      return this.handleStatusQuery(userId, query);
    }

    if (intent === 'statistics' || intent === 'analytics') {
      return this.handleAnalyticsQuery();
    }

    if (intent === 'recommendations') {
      return this.handleRecommendationsQuery(userId);
    }

    // Search knowledge base
    const bestMatch = this.findBestKnowledgeMatch(query);
    if (bestMatch && bestMatch.confidence > 0.3) {
      return {
        reply: bestMatch.entry.answer,
        intent: bestMatch.entry.category,
        confidence: bestMatch.confidence,
        followUps: bestMatch.entry.followUps || [],
        metadata: { category: bestMatch.entry.category },
      };
    }

    // Fallback
    return {
      reply: 'I\'m here to help you with ClearPath! You can ask me about:\n\n' +
        '📋 **Clearance** – Submit, track, and understand the clearance process\n' +
        '🔍 **Status** – Check your clearance progress and exam eligibility\n' +
        '📄 **Certificates** – Download and verify clearance certificates\n' +
        '📊 **Reports** – Generate analytics and export data\n' +
        '❓ **Workflow** – Learn about the 6-stage approval chain\n\n' +
        'What would you like to know more about?',
      intent: 'fallback',
      confidence: 0.1,
      followUps: [
        'Tell me about clearance',
        'What is my clearance status?',
        'How do I submit a clearance?',
        'Show me clearance statistics',
      ],
    };
  }

  async naturalLanguageSearch(
    userId: string,
    query: string,
    filters?: { type?: string; departmentId?: string; status?: string },
  ): Promise<SearchResult[]> {
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    // Search students
    if (!filters?.type || filters.type === 'student') {
      const students = await this.prisma.student.findMany({
        where: {
          OR: [
            { studentId: { contains: q, mode: 'insensitive' } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
          ],
          ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
        },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        take: 10,
      });

      students.forEach(s => {
        results.push({
          type: 'student',
          id: s.id,
          title: `${s.user.firstName} ${s.user.lastName}`,
          description: `Student ID: ${s.studentId} | Email: ${s.user.email}`,
          url: `/dashboard?student=${s.id}`,
          score: 90,
        });
      });
    }

    // Search clearances
    if (!filters?.type || filters.type === 'clearance') {
      const clearances = await this.prisma.clearanceRequest.findMany({
        where: {
          ...(filters?.status ? { status: filters.status as ClearanceStatus } : {}),
          student: {
            OR: [
              { studentId: { contains: q, mode: 'insensitive' } },
              { user: { firstName: { contains: q, mode: 'insensitive' } } },
              { user: { lastName: { contains: q, mode: 'insensitive' } } },
            ],
          },
        },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
        take: 10,
      });

      clearances.forEach(c => {
        results.push({
          type: 'clearance',
          id: c.id,
          title: `Clearance - ${c.student.user.firstName} ${c.student.user.lastName}`,
          description: `Status: ${c.status} | Submitted: ${c.createdAt.toISOString().split('T')[0]}`,
          url: `/dashboard?clearance=${c.id}`,
          score: 85,
        });
      });
    }

    // Search departments
    if (!filters?.type || filters.type === 'department') {
      const departments = await this.prisma.department.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { code: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      });

      departments.forEach(d => {
        results.push({
          type: 'department',
          id: d.id,
          title: d.name,
          description: `Code: ${d.code}`,
          url: `/dashboard`,
          score: 70,
        });
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  async getRecommendations(userId: string): Promise<Recommendation[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    include: {
      student: {
        include: {
          clearanceRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
    },
    });

    const recommendations: Recommendation[] = [];

    if (user?.role === 'STUDENT' && user.student) {
      const latestClearance = (user.student as any).clearanceRequests?.[0];

      if (!latestClearance) {
        recommendations.push({
          id: 'rec-submit-clearance',
          type: 'action',
          title: 'Submit Clearance Request',
          description: 'You haven\'t submitted a clearance request yet. Start the process to become exam-eligible.',
          priority: 'high',
          link: '/dashboard',
        });
      } else if (latestClearance.status === 'PENDING' || latestClearance.status === 'IN_PROGRESS') {
        const approvals = await this.prisma.clearanceApproval.findMany({
          where: { clearanceRequestId: latestClearance.id },
          include: { officer: { select: { firstName: true, lastName: true, role: true } } },
        });

        const pendingStage = approvals.find(a => a.status === 'PENDING');
        if (pendingStage) {
          recommendations.push({
            id: 'rec-pending-stage',
            type: 'insight',
            title: `Awaiting ${pendingStage.officer.role.replace('_', ' ')} Approval`,
            description: `Your clearance is with ${pendingStage.officer.firstName} ${pendingStage.officer.lastName}. Check if all requirements for this stage are met.`,
            priority: 'high',
            link: '/dashboard',
          });
        }
      } else if (latestClearance.status === 'APPROVED') {
        recommendations.push({
          id: 'rec-download-cert',
          type: 'action',
          title: 'Download Your Clearance Certificate',
          description: 'Congratulations! You are fully cleared. Download your certificate with QR code for verification.',
          priority: 'medium',
          link: '/dashboard',
        });
      } else if (latestClearance.status === 'REJECTED') {
        const rejectedApproval = await this.prisma.clearanceApproval.findFirst({
          where: { clearanceRequestId: latestClearance.id, status: 'REJECTED' },
        });
        recommendations.push({
          id: 'rec-fix-rejection',
          type: 'alert',
          title: 'Clearance Rejected – Action Required',
          description: `Your clearance was rejected. Reason: ${rejectedApproval?.remarks || 'No details provided'}. Contact the relevant officer to resolve this.`,
          priority: 'high',
          link: '/dashboard',
        });
      }

      // Exam eligibility
      if (latestClearance?.status === 'APPROVED') {
        recommendations.push({
          id: 'rec-exam-ready',
          type: 'suggestion',
          title: 'You Are Exam Eligible',
          description: 'All clearance stages are approved. You are eligible to sit for your examinations. Check the exam schedule.',
          priority: 'medium',
        });
      }
    }

    // General recommendations based on user role
    if (user?.role === 'ADMINISTRATOR' || user?.role === 'SUPERVISOR') {
      const pendingClearances = await this.prisma.clearanceRequest.count({
        where: { status: 'PENDING' },
      });
      if (pendingClearances > 0) {
        recommendations.push({
          id: 'rec-pending-count',
          type: 'insight',
          title: `${pendingClearances} Pending Clearances`,
          description: 'There are clearance requests awaiting processing. Review and assign officers as needed.',
          priority: 'medium',
          link: '/dashboard',
        });
      }
    }

    return recommendations;
  }

  async getPredictiveAnalytics() {
    const now = new Date();

    // Calculate clearance completion trends for prediction
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const completedClearances = await this.prisma.clearanceRequest.findMany({
      where: {
        status: 'APPROVED',
        completedAt: { gte: thirtyDaysAgo },
      },
      select: { completedAt: true, createdAt: true },
    });

    const avgCompletionTime = completedClearances.length > 0
      ? completedClearances.reduce((sum, c) => {
          const diff = (c.completedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + diff;
        }, 0) / completedClearances.length
      : 0;

    // Current pending clearance volume
    const pendingCount = await this.prisma.clearanceRequest.count({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
    });

    // Predicted completions for next 7 days (based on average velocity)
    const dailyRate = completedClearances.length / 30;
    const predictedNext7Days = Math.round(dailyRate * 7);

    // Department-wise distribution
    const departmentStats = await this.getDepartmentPrediction();

    // Stage bottleneck detection
    const stageBottlenecks = await this.detectBottlenecks();

    // Semester comparison
    const currentSemester = await this.prisma.semester.findFirst({
      where: { isActive: true },
    });
    const currentClearances = currentSemester
      ? await this.prisma.clearanceRequest.count({
          where: { semesterId: currentSemester.id },
        })
      : 0;

    return {
      summary: {
        totalCompleted: completedClearances.length,
        avgCompletionDays: Math.round(avgCompletionTime * 10) / 10,
        pendingVolume: pendingCount,
        predictedCompletions7Days: predictedNext7Days,
        currentThroughput: `${Math.round(dailyRate * 10) / 10}/day`,
      },
      predictions: {
        nextWeekCompletion: predictedNext7Days,
        estimatedPeakDay: this.estimatePeakDay(completedClearances),
        bottleneckProbability: pendingCount > 50 ? 'high' : pendingCount > 20 ? 'medium' : 'low',
        completionTrend: avgCompletionTime > 5 ? 'increasing' : avgCompletionTime < 2 ? 'decreasing' : 'stable',
      },
      bottlenecks: stageBottlenecks,
      departments: departmentStats,
      currentVolume: {
        semester: currentSemester?.name || 'N/A',
        clearances: currentClearances,
      },
      trending: {
        dailyRate: Math.round(dailyRate * 10) / 10,
        weekOverWeek: this.calculateWeekOverWeek(completedClearances),
      },
    };
  }

  async getSmartReports(filters: {
    type?: string;
    departmentId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};
    if (filters.departmentId) where.student = { departmentId: filters.departmentId };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const clearances = await this.prisma.clearanceRequest.findMany({
      where,
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } }, department: true } },
        approvals: { include: { officer: { select: { firstName: true, lastName: true, role: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalClearances = clearances.length;
    const approved = clearances.filter(c => c.status === 'APPROVED').length;
    const rejected = clearances.filter(c => c.status === 'REJECTED').length;
    const pending = clearances.filter(c => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;

    // Stage completion analysis
    const stageAnalysis = this.analyzeStageCompletion(clearances);

    // Department distribution
    const departmentMap = new Map<string, { total: number; approved: number; rejected: number }>();
    clearances.forEach(c => {
      const deptName = c.student.department?.name || 'Unknown';
      const dept = departmentMap.get(deptName) || { total: 0, approved: 0, rejected: 0 };
      dept.total++;
      if (c.status === 'APPROVED') dept.approved++;
      if (c.status === 'REJECTED') dept.rejected++;
      departmentMap.set(deptName, dept);
    });

    return {
      summary: {
        total: totalClearances,
        approved,
        rejected,
        pending,
        approvalRate: totalClearances > 0 ? Math.round((approved / totalClearances) * 100) : 0,
        rejectionRate: totalClearances > 0 ? Math.round((rejected / totalClearances) * 100) : 0,
      },
      stages: stageAnalysis,
      departments: Array.from(departmentMap.entries()).map(([name, data]) => ({
        name,
        ...data,
        rate: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0,
      })),
      clearanceData: clearances.map(c => ({
        id: c.id,
        student: `${c.student.user.firstName} ${c.student.user.lastName}`,
        department: c.student.department?.name || 'N/A',
        status: c.status,
        submittedAt: c.createdAt,
        completedAt: c.completedAt,
        stagesCompleted: c.approvals.filter(a => a.status === 'APPROVED').length,
        totalStages: c.approvals.length,
        progress: Math.round((c.approvals.filter(a => a.status === 'APPROVED').length / Math.max(c.approvals.length, 1)) * 100),
      })),
    };
  }

  // Private helper methods

  private detectIntent(query: string): { intent: string; confidence: number } {
    const patterns: [RegExp, string, number][] = [
      [/(?:my\s+)?(?:clearance\s+)?status/i, 'status', 0.9],
      [/how (?:do|can|to).*(?:submit|apply|request)/i, 'how_to_submit', 0.85],
      [/what (?:is|are).*clearance/i, 'clearance_overview', 0.85],
      [/how.*(?:workflow|stage|approve|process)/i, 'workflow', 0.8],
      [/download|print|get.*certificate/i, 'certificate', 0.8],
      [/reject|denied|fail|resubmit/i, 'rejected', 0.85],
      [/exam.*eligible|eligible.*exam|can.*sit/i, 'eligibility', 0.9],
      [/statistics|report|analytics|chart|graph/i, 'analytics', 0.8],
      [/recommend|suggest|advise|what should/i, 'recommendations', 0.7],
      [/finance|fee|payment/i, 'finance', 0.85],
      [/library|book/i, 'library', 0.85],
      [/sport|game|athletic/i, 'sports', 0.8],
      [/laboratory|lab/i, 'laboratory', 0.8],
      [/department|academic/i, 'department', 0.75],
      [/registrar|final|complete/i, 'registrar', 0.75],
      [/qr|scan|verify|verification/i, 'qr', 0.8],
      [/offline|no internet|connect/i, 'offline', 0.8],
      [/role|permission|access/i, 'roles', 0.7],
      [/hello|hi|hey|greetings/i, 'greeting', 0.95],
    ];

    for (const [regex, intent, confidence] of patterns) {
      if (regex.test(query)) return { intent, confidence };
    }

    return { intent: 'general', confidence: 0.3 };
  }

  private findBestKnowledgeMatch(query: string): { entry: KnowledgeEntry; confidence: number } | null {
    let bestMatch: { entry: KnowledgeEntry; confidence: number } | null = null;

    for (const entry of this.knowledgeBase) {
      let score = 0;
      for (const keyword of entry.keywords) {
        if (query.includes(keyword)) {
          score += 1;
        }
      }

      if (score > 0) {
        const confidence = score / entry.keywords.length;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { entry, confidence };
        }
      }
    }

    return bestMatch;
  }

  private async handleStatusQuery(userId: string, query: string): Promise<{
    reply: string;
    intent: string;
    confidence: number;
    followUps: string[];
    metadata?: Record<string, any>;
  }> {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        clearanceRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            approvals: { include: { officer: { select: { firstName: true, lastName: true, role: true } } } },
          },
        },
      },
    });

    if (!student || (student as any).clearanceRequests?.length === 0) {
      return {
        reply: 'You haven\'t submitted any clearance requests yet. Would you like to submit one now? You can do so from your Student Dashboard.',
        intent: 'status',
        confidence: 0.9,
        followUps: ['How do I submit a clearance?', 'What do I need to prepare?', 'Show me my dashboard'],
      };
    }

    const clearance = (student as any).clearanceRequests[0];
    const approvedCount = clearance.approvals.filter((a: any) => a.status === 'APPROVED').length;
    const totalStages = clearance.approvals.length;
    const progress = Math.round((approvedCount / totalStages) * 100);

    const statusEmoji: Record<string, string> = {
      PENDING: '⏳',
      IN_PROGRESS: '🔄',
      APPROVED: '✅',
      REJECTED: '❌',
    };

    let reply = `${statusEmoji[clearance.status] || '📋'} **Your Clearance Status:** ${clearance.status.replace('_', ' ')}\n\n`;
    reply += `**Progress:** ${approvedCount}/${totalStages} stages approved (${progress}%)\n\n`;
    reply += `**Stage Details:**\n`;

    for (const approval of clearance.approvals) {
      const statusIcon = approval.status === 'APPROVED' ? '✅' : approval.status === 'REJECTED' ? '❌' : approval.status === 'CONDITIONAL' ? '⚠️' : '⏳';
      reply += `${statusIcon} **${approval.officer.role.replace('_', ' ')}**`;
      if (approval.status !== 'PENDING') {
        reply += ` – ${approval.officer.firstName} ${approval.officer.lastName}`;
      }
      if (approval.remarks) {
        reply += `\n   _Remarks: ${approval.remarks}_`;
      }
      reply += '\n';
    }

    if (clearance.status === 'REJECTED') {
      reply += '\n⚠️ Your clearance was rejected. Check the remarks above and contact the relevant officer.';
    } else if (clearance.status === 'APPROVED') {
      reply += '\n🎉 Congratulations! You are fully cleared and exam-eligible! Download your certificate.';
    }

    return {
      reply,
      intent: 'status',
      confidence: 0.95,
      followUps: ['What happens next?', 'Download my certificate', 'Check exam eligibility'],
      metadata: {
        clearanceId: clearance.id,
        status: clearance.status,
        progress,
      },
    };
  }

  private async handleAnalyticsQuery(): Promise<{
    reply: string;
    intent: string;
    confidence: number;
    followUps: string[];
    metadata?: Record<string, any>;
  }> {
    const total = await this.prisma.clearanceRequest.count();
    const approved = await this.prisma.clearanceRequest.count({ where: { status: 'APPROVED' } });
    const rejected = await this.prisma.clearanceRequest.count({ where: { status: 'REJECTED' } });
    const pending = await this.prisma.clearanceRequest.count({ where: { status: 'PENDING' } });
    const inProgress = await this.prisma.clearanceRequest.count({ where: { status: 'IN_PROGRESS' } });

    const rate = total > 0 ? Math.round((approved / total) * 100) : 0;

    const reply =
      `📊 **Clearance System Analytics**\n\n` +
      `**Overview**\n` +
      `• Total Clearances: ${total}\n` +
      `• Approved: ${approved} (${rate}%)\n` +
      `• Rejected: ${rejected}\n` +
      `• In Progress: ${inProgress}\n` +
      `• Pending: ${pending}\n\n` +
      `The system is processing clearances efficiently. Check the Reports page for detailed charts and trends.`;

    return {
      reply,
      intent: 'analytics',
      confidence: 0.9,
      followUps: ['Show me department statistics', 'Export clearance report', 'View clearance trends'],
      metadata: { total, approved, rejected, pending, inProgress, rate },
    };
  }

  private async handleRecommendationsQuery(userId: string): Promise<{
    reply: string;
    intent: string;
    confidence: number;
    followUps: string[];
    metadata?: Record<string, any>;
  }> {
    const recommendations = await this.getRecommendations(userId);

    if (recommendations.length === 0) {
      return {
        reply: 'Everything looks good! Here are some things you can explore:\n\n' +
          '• 📋 Submit a new clearance request\n' +
          '• 📊 View system reports and analytics\n' +
          '• 📄 Download certificates\n' +
          '• 🔍 Search for students or departments',
        intent: 'recommendations',
        confidence: 0.8,
        followUps: ['Show me clearance status', 'View reports', 'Help with workflow'],
      };
    }

    let reply = '💡 **Recommendations for You**\n\n';
    for (const rec of recommendations) {
      const icon = rec.type === 'action' ? '👉' : rec.type === 'alert' ? '⚠️' : rec.type === 'insight' ? '💡' : '📌';
      const priorityLabel = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      reply += `${icon} **${rec.title}**\n`;
      reply += `   ${rec.description}\n\n`;
    }

    return {
      reply,
      intent: 'recommendations',
      confidence: 0.85,
      followUps: ['Clear my recommendations', 'Show me clearance status', 'Help with next steps'],
      metadata: { count: recommendations.length, recommendations },
    };
  }

  private async getDepartmentPrediction(): Promise<any[]> {
    const departments = await this.prisma.department.findMany({
      include: {
        students: {
          include: {
            clearanceRequests: {
              where: { status: 'APPROVED' },
              select: { id: true },
            },
          },
        },
      },
    });

    return departments.map(d => ({
      name: d.name,
      code: d.code,
      totalStudents: d.students.length,
      clearedStudents: d.students.filter((s: any) => s.clearanceRequests?.length > 0).length,
      pendingStudents: d.students.length - d.students.filter((s: any) => s.clearanceRequests?.length > 0).length,
      clearanceRate: d.students.length > 0
        ? Math.round((d.students.filter((s: any) => s.clearanceRequests?.length > 0).length / d.students.length) * 100)
        : 0,
    }));
  }

  private async detectBottlenecks(): Promise<any[]> {
    const stages = ['FINANCE_OFFICER', 'LIBRARY_OFFICER', 'LABORATORY_OFFICER', 'SPORTS_OFFICER', 'DEPARTMENT_OFFICER', 'REGISTRAR'];
    const bottlenecks: any[] = [];

    for (const stage of stages) {
      const pendingCount = await this.prisma.clearanceApproval.count({
        where: {
          officer: { role: stage as any },
          status: 'PENDING',
        },
      });

      const avgProcessingTime = await this.getAvgProcessingTime(stage);

      bottlenecks.push({
        stage: stage.replace('_', ' '),
        pendingCount,
        avgProcessingHours: Math.round(avgProcessingTime * 10) / 10,
        isBottleneck: pendingCount > 10 || avgProcessingTime > 48,
      });
    }

    return bottlenecks;
  }

  private async getAvgProcessingTime(role: string): Promise<number> {
    const approvals = await this.prisma.clearanceApproval.findMany({
      where: {
        officer: { role: role as any },
        status: { in: ['APPROVED', 'REJECTED'] },
        approvedAt: { not: null },
      },
      select: { createdAt: true, approvedAt: true },
      take: 50,
      orderBy: { approvedAt: 'desc' },
    });

    if (approvals.length === 0) return 0;

    const totalHours = approvals.reduce((sum, a) => {
      const diff = (a.approvedAt!.getTime() - a.createdAt.getTime()) / (1000 * 60 * 60);
      return sum + diff;
    }, 0);

    return totalHours / approvals.length;
  }

  private estimatePeakDay(completedClearances: { completedAt: Date | null }[]): string {
    const dayCount: Record<string, number> = {};
    completedClearances.forEach(c => {
      if (c.completedAt) {
        const day = c.completedAt.toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
      }
    });

    let peakDay = 'Monday';
    let maxCount = 0;
    for (const [day, count] of Object.entries(dayCount)) {
      if (count > maxCount) {
        maxCount = count;
        peakDay = day;
      }
    }

    return peakDay;
  }

  private calculateWeekOverWeek(completedClearances: { completedAt: Date | null }[]): number {
    const now = new Date();
    const thisWeek = completedClearances.filter(c => {
      if (!c.completedAt) return false;
      const diff = (now.getTime() - c.completedAt.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    }).length;

    const lastWeek = completedClearances.filter(c => {
      if (!c.completedAt) return false;
      const diff = (now.getTime() - c.completedAt.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 7 && diff <= 14;
    }).length;

    if (lastWeek === 0) return 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }

  private analyzeStageCompletion(clearances: any[]) {
    const stageMap = new Map<string, { total: number; approved: number; rejected: number; avgTime: number }>();

    clearances.forEach(c => {
      c.approvals?.forEach((a: any) => {
        const stageName = a.officer.role.replace(/_/g, ' ');
        const existing = stageMap.get(stageName) || { total: 0, approved: 0, rejected: 0, avgTime: 0 };
        existing.total++;
        if (a.status === 'APPROVED') existing.approved++;
        if (a.status === 'REJECTED') existing.rejected++;
        stageMap.set(stageName, existing);
      });
    });

    return Array.from(stageMap.entries()).map(([name, data]) => ({
      stage: name,
      ...data,
      approvalRate: data.total > 0 ? Math.round((data.approved / data.total) * 100) : 0,
    }));
  }
}
