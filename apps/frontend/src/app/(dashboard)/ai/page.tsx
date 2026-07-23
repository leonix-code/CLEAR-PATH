import { AIChat } from "@/components/ai/ai-chat";

export default function AIPage() {
  return (
    <div className="p-6">
      <div className="text-center max-w-2xl mx-auto py-12">
        <h1 className="text-3xl font-bold gradient-text mb-4">AI Assistant</h1>
        <p className="text-foreground-secondary mb-8">
          Get instant answers about clearance requests, workflow stages, exam eligibility, and more.
          Click the AI Assistant button in the bottom-right corner to start chatting.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {[
            { title: "Clearance Help", desc: "Understand the clearance process and submission steps" },
            { title: "Workflow Guide", desc: "Learn about the 6-stage approval workflow" },
            { title: "Status Tracking", desc: "Check where you are in the clearance process" },
            { title: "Certificate Info", desc: "Download and verify your clearance certificate" },
            { title: "Exam Eligibility", desc: "Check if you're eligible for examinations" },
            { title: "Report Analytics", desc: "Generate and export system reports" },
          ].map((item, i) => (
            <div key={i} className="glass-card p-4 hover:-translate-y-1 transition-all">
              <h3 className="font-medium text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-foreground-secondary">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <AIChat />
    </div>
  );
}
