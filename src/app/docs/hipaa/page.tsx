import { Shield, Lock, Eye, FileText, Clock, Server, Mail, Download, CheckSquare } from "lucide-react";

export const metadata = { title: "HIPAA Compliance — EEGBase" };

const PROTECTIONS = [
  {
    icon: Lock,
    title: "Encryption at Rest",
    body: "All PHI is stored in a PostgreSQL database encrypted with AES-256. Automated backups are encrypted at rest using the same standard and stored in a separate region.",
  },
  {
    icon: Shield,
    title: "Encryption in Transit",
    body: "Every connection to EEGBase — browser, API, and webhook — is protected by TLS 1.3. Unencrypted HTTP connections are automatically redirected to HTTPS.",
  },
  {
    icon: Eye,
    title: "Role-Based Access Control",
    body: "Admin and Clinician roles are enforced at the application and database layers. Each clinic's data is fully isolated — no cross-clinic data access is possible by design.",
  },
  {
    icon: FileText,
    title: "Audit Logging",
    body: "Every access or modification to PHI is recorded with the authenticated user, the action taken, the affected record, a timestamp, and the originating IP address. Logs are append-only.",
  },
  {
    icon: Clock,
    title: "Automatic Session Expiry",
    body: "JWT session tokens expire after 30 days and are invalidated on sign-out. Inactive browser sessions are automatically terminated to prevent unauthorised access on shared devices.",
  },
  {
    icon: Server,
    title: "Self-Hosted Option",
    body: "EEGBase is open-source and can be deployed entirely on your own infrastructure. Your PHI never leaves your servers, giving you full control over data residency and retention.",
  },
];

const SUMMARY_ITEMS = [
  { label: "Data Encryption", detail: "AES-256 at rest · TLS 1.3 in transit" },
  { label: "Access Controls", detail: "Role-based · clinic-isolated" },
  { label: "Audit Logging", detail: "Every PHI access recorded" },
  { label: "BAA Available", detail: "For clinics on paid plans" },
];

interface ChecklistItem {
  text: string;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    title: "Infrastructure",
    items: [
      { text: "Self-host on your own server or VPS (not shared hosting)" },
      { text: "Enable disk encryption on the host volume" },
      { text: "Use TLS 1.2+ for all connections; redirect HTTP to HTTPS" },
    ],
  },
  {
    title: "Database",
    items: [
      { text: "PostgreSQL with row-level security enabled" },
      { text: "Database encrypted at rest" },
      { text: "Daily automated backups to encrypted storage" },
    ],
  },
  {
    title: "Access Controls",
    items: [
      { text: "Require MFA for all staff accounts" },
      { text: "Session timeout configured for 30 minutes idle" },
      { text: "Audit log enabled (Settings → Audit Log)" },
    ],
  },
  {
    title: "PHI Handling",
    items: [
      { text: "No PHI written to application logs" },
      { text: "S3 bucket (if used for backups) set to private, no public ACLs" },
      { text: "BAA signed with any cloud provider that handles PHI" },
    ],
  },
  {
    title: "EEGBase Settings",
    items: [
      { text: "Enable audit log — Settings → Audit Log" },
      { text: "Set session timeout to 30 minutes" },
      { text: "Configure webhook secret for REST ingestion API" },
    ],
  },
];

export default function HipaaPage() {
  return (
    <div className="max-w-3xl space-y-10 pb-12">

      {/* ── Hero ── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ background: "var(--brand)", color: "var(--text-inverse)" }}
          >
            <Shield size={20} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            HIPAA Compliance — EEGBase
          </h1>
        </div>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "var(--text-secondary)" }}>
          EEGBase is designed for HIPAA compliance. Use this checklist when setting up your deployment.
        </p>
      </div>

      {/* ── Summary card ── */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          At a Glance
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SUMMARY_ITEMS.map((item) => (
            <div
              key={item.label}
              className="rounded-lg p-3 flex flex-col gap-1"
              style={{ background: "var(--surface-sunken)" }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {item.label}
              </span>
              <span className="text-xs leading-snug" style={{ color: "var(--text-secondary)" }}>
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Deployment Checklist ── */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          Deployment Checklist
        </h2>
        <div className="flex flex-col gap-4">
          {CHECKLIST_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border p-5"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={15} style={{ color: "var(--brand)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {section.title}
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {section.items.map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: "var(--brand-subtle)" }}
                    >
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI / Claude note ── */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
          Note on AI Features
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          EEGBase does not store data on Anthropic servers. The AI summary feature (Claude) uses the
          API in a zero-retention mode — PHI is not used for model training.
        </p>
      </div>

      {/* ── Download BAA template ── */}
      <div
        className="rounded-xl border p-5 flex items-center justify-between gap-4"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
            BAA Template
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Download a standard Business Associate Agreement template to use with your cloud provider.
          </p>
        </div>
        <a
          href="/docs/baa-template.pdf"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-all"
          style={{
            background: "var(--brand)",
            color: "var(--text-inverse)",
            boxShadow: "0 1px 4px color-mix(in srgb, var(--brand) 35%, transparent)",
          }}
        >
          <Download size={14} />
          Download BAA template
        </a>
      </div>

      {/* ── How EEGBase Protects PHI ── */}
      <section>
        <h2
          className="text-sm font-semibold uppercase tracking-wider mb-4"
          style={{ color: "var(--text-tertiary)" }}
        >
          How EEGBase Protects PHI
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PROTECTIONS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border p-5 flex flex-col gap-3"
              style={{
                background: "var(--surface-raised)",
                borderColor: "var(--border-subtle)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-subtle)" }}
              >
                <Icon size={16} style={{ color: "var(--brand)" }} />
              </div>
              <div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BAA Section ── */}
      <section
        className="rounded-xl border p-6"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} style={{ color: "var(--text-secondary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Business Associate Agreement
          </h2>
        </div>
        <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text-secondary)" }}>
          A Business Associate Agreement (BAA) is required under HIPAA when a service provider
          handles PHI on behalf of a covered entity. EEGBase offers BAAs for all clinics on paid
          plans. To request a BAA, please contact us at{" "}
          <a
            href="mailto:hipaa@eegbase.io"
            className="font-medium hover:underline"
            style={{ color: "var(--brand)" }}
          >
            hipaa@eegbase.io
          </a>
          {" "}and we will respond within 2 business days.
        </p>
        <a
          href="mailto:hipaa@eegbase.io?subject=BAA%20Request%20-%20EEGBase"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all"
          style={{
            background: "var(--brand)",
            color: "var(--text-inverse)",
            boxShadow: "0 1px 4px color-mix(in srgb, var(--brand) 35%, transparent)",
          }}
        >
          <Mail size={15} />
          Request a BAA
        </a>
      </section>

      {/* ── Your Responsibilities ── */}
      <section
        className="rounded-xl border p-6"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Your Responsibilities
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          HIPAA compliance is a shared responsibility. As a covered entity using EEGBase, your
          clinic is responsible for:
        </p>
        <ul className="space-y-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          <li className="flex items-start gap-2">
            <span
              className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
            >
              1
            </span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>Strong password hygiene:</strong>{" "}
              Ensure all staff accounts use unique, strong passwords and that credentials are
              not shared between team members.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
            >
              2
            </span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>Device security:</strong>{" "}
              Ensure that devices used to access EEGBase (computers, tablets, phones) are
              protected with screen locks, up-to-date software, and are not shared with
              non-authorised individuals.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span
              className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
              style={{ background: "var(--brand-subtle)", color: "var(--brand)" }}
            >
              3
            </span>
            <span>
              <strong style={{ color: "var(--text-primary)" }}>Employee training:</strong>{" "}
              All staff with access to EEGBase must receive appropriate HIPAA training covering
              PHI handling, breach reporting obligations, and acceptable use policies.
            </span>
          </li>
        </ul>
      </section>

      {/* ── Security Incident Reporting ── */}
      <section
        className="rounded-xl border p-6"
        style={{
          background: "var(--surface-raised)",
          borderColor: "var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} style={{ color: "var(--danger)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Security Incident Reporting
          </h2>
        </div>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
          If you discover or suspect a security vulnerability or data breach involving EEGBase,
          please report it immediately to our security team. We aim to acknowledge all reports
          within 24 hours and provide a resolution timeline within 72 hours.
        </p>
        <a
          href="mailto:security@eegbase.io?subject=Security%20Incident%20Report"
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: "var(--brand)" }}
        >
          <Mail size={14} />
          security@eegbase.io
        </a>
      </section>

      {/* ── Footer note ── */}
      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        Last updated: January 2025. This page is informational only and does not constitute legal
        advice. Consult a qualified attorney to assess your specific HIPAA compliance obligations.
      </p>

    </div>
  );
}
