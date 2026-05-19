'use client';

import React from 'react';
import {
  ShieldCheck,
  Database,
  UserCheck,
  Bot,
  Users,
  Lock,
  Globe,
  FileWarning,
  Mail,
  Scale,
} from 'lucide-react';
import {
  LegalPageLayout,
  LegalSectionBlock,
  type LegalSection,
} from '@/components/legal/legal-page-layout';

export function PrivacyClient({ sections }: { sections: LegalSection[] }) {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="Martinez Hybrid Technologies OPC is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and safeguard your information in compliance with Republic Act No. 10173 — the Data Privacy Act of 2012."
      lastUpdated="April 2026"
      sections={sections}
    >
      {/* 1. Overview */}
      <LegalSectionBlock
        id="overview"
        icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.5} />}
        title="1. Overview"
      >
        <p>
          This Privacy Policy applies to all personal data collected and processed by{' '}
          <strong>Martinez Hybrid Technologies OPC</strong> (&quot;the Company,&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) through its trade names{' '}
          <strong>Nexure Networks</strong> and <strong>Joularix Solar</strong>, whether collected
          online through our website, mobile applications, and digital platforms, or offline through
          physical forms, in-person interactions, and service installations.
        </p>
        <p>
          This policy is drafted in strict compliance with{' '}
          <strong>Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, its Implementing Rules
          and Regulations (IRR), and all relevant issuances of the National Privacy Commission (NPC)
          of the Philippines.
        </p>
      </LegalSectionBlock>

      {/* 2. Data Collection */}
      <LegalSectionBlock
        id="data-collection"
        icon={<Database className="h-4 w-4" strokeWidth={1.5} />}
        title="2. Data Collection"
      >
        <p>
          We collect the following categories of personal data to provide, maintain, and improve our
          services:
        </p>
        <h3>2.1 Identity &amp; KYC Information</h3>
        <ul>
          <li>Full legal name, date of birth, and nationality</li>
          <li>
            Government-issued identification documents (e.g., Philippine National ID, Driver&apos;s
            License, PhilSys ID) — collected for Know Your Customer (KYC) verification
          </li>
          <li>Photograph or digital image for identity verification</li>
        </ul>
        <h3>2.2 Contact Information</h3>
        <ul>
          <li>Email address and mobile phone number</li>
          <li>
            Physical address — including complete installation address for service deployment
            (barangay, municipality, province)
          </li>
        </ul>
        <h3>2.3 Financial &amp; Billing Data</h3>
        <ul>
          <li>Billing address and payment history</li>
          <li>
            Payment method details (GCash number, bank account — partial digits only; we do not
            store full payment credentials)
          </li>
          <li>Invoice and transaction records</li>
        </ul>
        <h3>2.4 Technical &amp; Usage Data</h3>
        <ul>
          <li>Network usage statistics, bandwidth consumption, and connection logs</li>
          <li>
            Solar system performance data (energy generation, consumption patterns, inverter
            telemetry)
          </li>
          <li>Device information and browser metadata when using our online platforms</li>
        </ul>
      </LegalSectionBlock>

      {/* 3. Purpose of Processing */}
      <LegalSectionBlock
        id="purpose"
        icon={<Globe className="h-4 w-4" strokeWidth={1.5} />}
        title="3. Purpose of Processing"
      >
        <p>
          We process your personal data for the following lawful purposes in accordance with{' '}
          <strong>Section 12 of RA 10173</strong>:
        </p>
        <ul>
          <li>
            <strong>Service Delivery:</strong> Processing subscriptions, deploying installations,
            and providing technical support.
          </li>
          <li>
            <strong>Billing &amp; Payments:</strong> Generating invoices, processing payments, and
            issuing refunds or credits.
          </li>
          <li>
            <strong>Regulatory Compliance:</strong> Meeting the requirements of the NTC, Bureau of
            Internal Revenue (BIR), and other government agencies.
          </li>
          <li>
            <strong>Communication:</strong> Sending service updates, maintenance notifications, and
            promotional offers (with opt-out available).
          </li>
          <li>
            <strong>System Improvement:</strong> Analyzing aggregated usage data to optimize network
            performance and solar system efficiency.
          </li>
          <li>
            <strong>Security:</strong> Detecting and preventing fraud, unauthorized access, and
            service abuse.
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 4. Data Protection Officer */}
      <LegalSectionBlock
        id="dpo"
        icon={<UserCheck className="h-4 w-4" strokeWidth={1.5} />}
        title="4. Data Protection Officer"
      >
        <p>
          In compliance with Section 21 of RA 10173, the Company has designated the following Data
          Protection Officer (DPO):
        </p>
        <div className="my-4 p-5 rounded-lg bg-blue-50/80 border border-blue-100">
          <p className="text-slate-800 font-semibold mb-2">Data Protection Officer</p>
          <ul className="space-y-1 text-[14px]">
            <li>
              <strong>Name:</strong> Jeff Martinez
            </li>
            <li>
              <strong>Certification:</strong> Certified Data Protection Officer, Department of
              Information and Communications Technology (DICT)
            </li>
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:martinezhybrid.opc@gmail.com">martinezhybrid.opc@gmail.com</a>
            </li>
          </ul>
        </div>
        <p>
          For any privacy-related concerns, inquiries, or requests to exercise your rights as a data
          subject, please contact our DPO directly at the email address provided above.
        </p>
      </LegalSectionBlock>

      {/* 5. AI & Automated Processing */}
      <LegalSectionBlock
        id="ai-processing"
        icon={<Bot className="h-4 w-4" strokeWidth={1.5} />}
        title="5. Automated Processing &amp; AI Disclosure"
      >
        <p>
          The Company utilizes advanced <strong>Artificial Intelligence (AI) chatbots and email
          agents</strong> to provide <strong>24/7 customer support</strong>. We believe in full
          transparency regarding the use of automated systems in processing your data:
        </p>
        <h3>5.1 AI Systems in Use</h3>
        <ul>
          <li>
            <strong>AI Chatbot:</strong> Handles initial customer inquiries, account status checks,
            billing queries, and basic troubleshooting through our website and messaging platforms.
          </li>
          <li>
            <strong>AI Email Agent:</strong> Processes incoming support emails, categorizes tickets,
            and provides automated responses for common issues.
          </li>
        </ul>
        <h3>5.2 Data Protection in AI Processing</h3>
        <ul>
          <li>
            All data processed by AI systems is <strong>heavily encrypted</strong> both in transit
            (TLS 1.3) and at rest (AES-256 encryption).
          </li>
          <li>
            AI-processed data is <strong>retained only for the duration necessary</strong> to resolve
            the specific customer query or support ticket, after which it is securely purged.
          </li>
          <li>
            <strong>Your data is never sold, licensed, or shared with third parties</strong> for
            marketing, advertising, or any purpose outside of direct service delivery.
          </li>
          <li>
            AI systems do not make fully automated decisions with legal effects on data subjects
            without human review, in compliance with Section 18 of RA 10173.
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 6. Data Security */}
      <LegalSectionBlock
        id="data-security"
        icon={<Lock className="h-4 w-4" strokeWidth={1.5} />}
        title="6. Data Security Measures"
      >
        <p>
          We implement reasonable and appropriate organizational, physical, and technical security
          measures to protect your personal data against unauthorized access, alteration, disclosure,
          or destruction:
        </p>
        <ul>
          <li>
            <strong>Encryption:</strong> Data is encrypted in transit and at rest using
            industry-standard encryption protocols.
          </li>
          <li>
            <strong>Access Controls:</strong> Personal data is accessible only to authorized
            personnel on a need-to-know basis, protected by role-based access control (RBAC).
          </li>
          <li>
            <strong>Regular Audits:</strong> We conduct periodic security assessments and
            vulnerability testing of our systems.
          </li>
          <li>
            <strong>Breach Protocol:</strong> In the event of a data breach, we shall notify the
            National Privacy Commission (NPC) and affected data subjects within seventy-two (72)
            hours, as required by the NPC Circular 16-03.
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 7. Your Rights */}
      <LegalSectionBlock
        id="user-rights"
        icon={<Users className="h-4 w-4" strokeWidth={1.5} />}
        title="7. Your Rights as a Data Subject"
      >
        <p>
          Under <strong>Republic Act No. 10173</strong>, you are entitled to the following rights:
        </p>
        <ol>
          <li>
            <strong>Right to be Informed</strong> — You have the right to be informed whether your
            personal data shall be, are being, or have been processed, including the existence of
            automated decision-making and profiling.
          </li>
          <li>
            <strong>Right to Object</strong> — You have the right to object to the processing of
            your personal data, including processing for direct marketing, automated processing, or
            profiling.
          </li>
          <li>
            <strong>Right to Access</strong> — You have the right to reasonable access to, upon
            demand, your personal data being processed and information regarding the manner by which
            such data were processed.
          </li>
          <li>
            <strong>Right to Rectification</strong> — You have the right to dispute the inaccuracy
            or error in your personal data and have us correct it immediately and accordingly.
          </li>
          <li>
            <strong>Right to Erasure or Blocking</strong> — You have the right to suspend, withdraw,
            or order the blocking, removal, or destruction of your personal data from our filing
            system.
          </li>
          <li>
            <strong>Right to Damages</strong> — You have the right to be indemnified for any damages
            sustained due to such inaccurate, incomplete, outdated, false, unlawfully obtained, or
            unauthorized use of personal data.
          </li>
          <li>
            <strong>Right to Data Portability</strong> — You have the right to obtain a copy of your
            data in a structured, commonly-used, and machine-readable format.
          </li>
        </ol>
        <p>
          To exercise any of these rights, please submit a written request to our Data Protection
          Officer at <a href="mailto:martinezhybrid.opc@gmail.com">martinezhybrid.opc@gmail.com</a>.
          We will respond within fifteen (15) business days.
        </p>
      </LegalSectionBlock>

      {/* 8. Data Sharing */}
      <LegalSectionBlock
        id="data-sharing"
        icon={<Globe className="h-4 w-4" strokeWidth={1.5} />}
        title="8. Data Sharing &amp; Third Parties"
      >
        <p>
          We may share your personal data with the following parties strictly on a need-to-know basis
          and in accordance with appropriate data sharing agreements:
        </p>
        <ul>
          <li>
            <strong>Upstream Service Providers:</strong> Backbone internet providers for connection
            provisioning and troubleshooting.
          </li>
          <li>
            <strong>Equipment Manufacturers:</strong> For warranty claims and product support.
          </li>
          <li>
            <strong>Government Agencies:</strong> As required by law (NTC, BIR, NPC).
          </li>
          <li>
            <strong>Payment Processors:</strong> GCash, Maya, and banking partners for payment
            facilitation.
          </li>
        </ul>
        <p>
          We <strong>do not sell, rent, or trade</strong> your personal data to any third party for
          commercial purposes.
        </p>
      </LegalSectionBlock>

      {/* 9. Data Retention */}
      <LegalSectionBlock
        id="data-retention"
        icon={<FileWarning className="h-4 w-4" strokeWidth={1.5} />}
        title="9. Data Retention"
      >
        <p>
          Personal data shall be retained only for as long as necessary to fulfill the purposes for
          which it was collected, or as required by applicable laws and regulations:
        </p>
        <ul>
          <li>
            <strong>Active Subscriber Data:</strong> Retained for the duration of the service
            agreement plus five (5) years for tax and regulatory compliance.
          </li>
          <li>
            <strong>KYC Documents:</strong> Retained as required by NTC regulations and
            anti-money laundering laws.
          </li>
          <li>
            <strong>Support Tickets &amp; AI Logs:</strong> Retained for twelve (12) months after
            resolution, then securely purged.
          </li>
          <li>
            <strong>Website Analytics:</strong> Aggregated and anonymized data may be retained
            indefinitely for service improvement.
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 10. Contact & Complaints */}
      <LegalSectionBlock
        id="contact"
        icon={<Mail className="h-4 w-4" strokeWidth={1.5} />}
        title="10. Contact &amp; Complaints"
      >
        <p>
          If you have questions, concerns, or complaints regarding the processing of your personal
          data, you may contact:
        </p>
        <div className="my-4 p-5 rounded-lg bg-slate-50 border border-slate-200">
          <p className="text-slate-800 font-semibold mb-2">Martinez Hybrid Technologies OPC</p>
          <ul className="space-y-1 text-[14px]">
            <li>
              <strong>DPO:</strong> Jeff Martinez
            </li>
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:martinezhybrid.opc@gmail.com">martinezhybrid.opc@gmail.com</a>
            </li>
            <li>
              <strong>Address:</strong> Dingle, Iloilo, Western Visayas, Philippines
            </li>
          </ul>
        </div>
        <p>
          If you believe that your data privacy rights have been violated and the Company has failed
          to adequately address your concern, you may file a complaint with the{' '}
          <strong>National Privacy Commission (NPC)</strong>:
        </p>
        <ul>
          <li>
            Website:{' '}
            <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer">
              www.privacy.gov.ph
            </a>
          </li>
          <li>
            Email:{' '}
            <a href="mailto:complaints@privacy.gov.ph">complaints@privacy.gov.ph</a>
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 11. Amendments */}
      <LegalSectionBlock
        id="amendments"
        icon={<Scale className="h-4 w-4" strokeWidth={1.5} />}
        title="11. Amendments to this Policy"
      >
        <p>
          We reserve the right to update or modify this Privacy Policy at any time. Any material
          changes will be communicated through email notification or a prominent notice on our
          website at least thirty (30) days prior to taking effect.
        </p>
        <p>
          Continued use of our services after such notification shall constitute your acceptance of
          the revised Privacy Policy. We recommend reviewing this page periodically for updates.
        </p>
        <p>
          This Privacy Policy was last reviewed and updated on <strong>April 1, 2026</strong>.
        </p>
      </LegalSectionBlock>
    </LegalPageLayout>
  );
}
