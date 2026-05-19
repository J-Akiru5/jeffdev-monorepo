'use client';

import React from 'react';
import {
  FileText,
  Wifi,
  Sun,
  Bot,
  AlertTriangle,
  Scale,
  ShieldCheck,
  CreditCard,
  Wrench,
  Ban,
  RefreshCw,
} from 'lucide-react';
import {
  LegalPageLayout,
  LegalSectionBlock,
  type LegalSection,
} from '@/components/legal/legal-page-layout';

export function TermsClient({ sections }: { sections: LegalSection[] }) {
  return (
    <LegalPageLayout
      title="Terms and Conditions"
      subtitle="This document outlines the terms governing your use of all services provided by Martinez Hybrid Technologies OPC. Please read carefully before subscribing to or engaging our services."
      lastUpdated="April 2026"
      sections={sections}
    >
      {/* 1. Introduction */}
      <LegalSectionBlock
        id="introduction"
        icon={<FileText className="h-4 w-4" strokeWidth={1.5} />}
        title="1. Introduction"
      >
        <p>
          These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement
          between you (&quot;Subscriber,&quot; &quot;Client,&quot; or &quot;User&quot;) and{' '}
          <strong>Martinez Hybrid Technologies OPC</strong> (&quot;the Company,&quot; &quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;), a One Person Corporation duly organized and existing
          under the laws of the Republic of the Philippines.
        </p>
        <p>
          The Company operates under the following registered trade names:
        </p>
        <ul>
          <li>
            <strong>Nexure Networks</strong> — Localized Micro-ISP &amp; Connectivity Solutions
          </li>
          <li>
            <strong>Joularix Solar</strong> — Smart Solar &amp; Renewable Energy Systems
          </li>
        </ul>
        <p>
          Our principal place of business is located in{' '}
          <strong>Dingle, Iloilo, Western Visayas, Philippines</strong>. By accessing, subscribing
          to, or utilizing any service offered by the Company, you acknowledge that you have read,
          understood, and agree to be bound by these Terms in their entirety.
        </p>
      </LegalSectionBlock>

      {/* 2. Definitions */}
      <LegalSectionBlock
        id="definitions"
        icon={<Scale className="h-4 w-4" strokeWidth={1.5} />}
        title="2. Definitions"
      >
        <ul>
          <li>
            <strong>&quot;Services&quot;</strong> refers to all telecommunications, internet
            connectivity, solar energy system design, installation, maintenance, and related services
            offered by the Company through its trade names.
          </li>
          <li>
            <strong>&quot;Subscriber&quot;</strong> refers to any individual or entity that has
            entered into a service agreement or subscription with the Company.
          </li>
          <li>
            <strong>&quot;NTC&quot;</strong> refers to the National Telecommunications Commission of
            the Republic of the Philippines.
          </li>
          <li>
            <strong>&quot;Upstream Provider&quot;</strong> refers to the Company&apos;s backbone
            internet service provider(s) from which bandwidth is sourced.
          </li>
          <li>
            <strong>&quot;Equipment&quot;</strong> refers to all hardware, including but not limited
            to routers, ONTs, solar panels, inverters, batteries, and mounting systems.
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 3. Nexure Networks */}
      <LegalSectionBlock
        id="nexure-services"
        icon={<Wifi className="h-4 w-4" strokeWidth={1.5} />}
        title="3. Nexure Networks — Internet Services"
      >
        <p>
          Nexure Networks provides localized Wi-Fi subscription services, residential and commercial
          internet installation, Local Area Network (LAN) deployment &amp; management, and related
          network consulting &amp; support services.
        </p>
        <h3>3.1 Regulatory Compliance</h3>
        <p>
          All telecommunications and internet-related services provided by Nexure Networks are
          <strong> strictly subject to the rules, regulations, permits, and licenses</strong> issued
          by the <strong>National Telecommunications Commission (NTC)</strong> and other relevant
          Philippine government agencies. The Company operates as an authorized network reseller and
          value-added service (VAS) provider in full compliance with applicable telecommunications
          law.
        </p>
        <h3>3.2 Service Standards</h3>
        <p>
          Nexure Networks endeavors to maintain a minimum uptime of 99.5% per calendar month,
          excluding scheduled maintenance windows and force majeure events. Advertised speeds
          represent &quot;up to&quot; values and are subject to network conditions, subscriber density,
          and upstream bandwidth availability.
        </p>
        <h3>3.3 Fair Use Policy</h3>
        <p>
          All subscription plans are subject to a Fair Use Policy. Subscribers shall not use the
          service for illegal activities, operate unauthorized commercial networks, or engage in
          activities that unreasonably degrade service quality for other users.
        </p>
      </LegalSectionBlock>

      {/* 4. Service Interruptions & Refunds */}
      <LegalSectionBlock
        id="nexure-interruption"
        icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.5} />}
        title="4. Service Interruptions & Refunds"
      >
        <p>
          The Company acknowledges that service interruptions may occur due to circumstances beyond
          our direct control, including but not limited to:
        </p>
        <ul>
          <li>Upstream network outages (fiber cuts, backbone provider failures)</li>
          <li>Natural disasters and severe weather events (typhoons, floods, earthquakes)</li>
          <li>Government-mandated shutdowns or power grid failures</li>
          <li>Force majeure events as defined under Philippine law</li>
        </ul>
        <h3>4.1 Pro-Rated Refund Policy</h3>
        <p>
          In the event of upstream network outages, including but not limited to fiber cuts from the
          main backbone provider, Nexure Networks shall provide affected subscribers with{' '}
          <strong>pro-rated refunds or billing rebates</strong> calculated based on the actual
          duration of the service interruption. Refunds shall be applied as credits to the
          subscriber&apos;s next billing cycle or, upon written request, returned via the original
          method of payment within thirty (30) business days.
        </p>
        <h3>4.2 Notification Protocol</h3>
        <p>
          The Company shall make reasonable efforts to notify subscribers of planned maintenance
          or known outages through SMS, email, or our official social media channels at least
          twenty-four (24) hours in advance when practicable.
        </p>
      </LegalSectionBlock>

      {/* 5. Joularix Solar */}
      <LegalSectionBlock
        id="joularix-services"
        icon={<Sun className="h-4 w-4" strokeWidth={1.5} />}
        title="5. Joularix Solar — Energy Services"
      >
        <p>
          Joularix Solar provides solar energy system design &amp; installation, renewable energy
          equipment sales (panels, inverters, batteries), residential and commercial energy
          consulting, and system maintenance &amp; support.
        </p>
        <h3>5.1 Labor &amp; Maintenance Services</h3>
        <p>
          Routine maintenance for installed solar systems is provided{' '}
          <strong>free of charge</strong> as explicitly outlined in the individual client contract
          executed between the Subscriber and the Company. The scope, frequency, and duration of
          complimentary maintenance shall be governed by the specific terms of each respective
          service agreement.
        </p>
        <h3>5.2 Installation Standards</h3>
        <p>
          All installations are conducted by qualified technicians in accordance with the Philippine
          Electrical Code (PEC) and applicable local building regulations. Upon completion, the
          Subscriber shall receive a system commissioning report, installation certificate, and all
          relevant warranty documentation.
        </p>
      </LegalSectionBlock>

      {/* 6. Hardware Warranty */}
      <LegalSectionBlock
        id="joularix-warranty"
        icon={<Wrench className="h-4 w-4" strokeWidth={1.5} />}
        title="6. Hardware Warranty Disclaimer"
      >
        <p>
          All physical equipment supplied by Joularix Solar — including but not limited to solar
          panels, inverters, batteries, charge controllers, and mounting systems — are{' '}
          <strong>
            strictly subject to the original supplier&apos;s and/or manufacturer&apos;s warranty
          </strong>{' '}
          terms, conditions, and limitations.
        </p>
        <p>
          <strong>
            Martinez Hybrid Technologies OPC (Joularix Solar) shall not be held financially
            liable for the cost of replacing defective factory hardware
          </strong>{' '}
          beyond the terms expressly provided by the original manufacturer&apos;s warranty. In the
          event of equipment defects or failures within the warranty period, the Company shall assist
          the Subscriber in filing warranty claims with the manufacturer and facilitate the repair or
          replacement process where possible. Labor costs for warranty-related replacements shall be
          governed by the individual client contract.
        </p>
        <p>
          Subscribers are advised to retain all original purchase receipts, warranty cards, and
          equipment serial numbers for warranty claim purposes.
        </p>
      </LegalSectionBlock>

      {/* 7. AI Support */}
      <LegalSectionBlock
        id="ai-support"
        icon={<Bot className="h-4 w-4" strokeWidth={1.5} />}
        title="7. AI-Powered Customer Support"
      >
        <p>
          The Company utilizes advanced <strong>Artificial Intelligence (AI) agents</strong> to
          provide automated customer support services available <strong>24 hours a day, 7 days a
          week</strong>. By using our support channels, you acknowledge and consent to the following:
        </p>
        <ul>
          <li>
            Customer support queries may be initially handled, triaged, and in some cases fully
            resolved by automated AI chatbot systems.
          </li>
          <li>
            AI systems may process your account information, service details, and query content to
            generate appropriate responses.
          </li>
          <li>
            Should the AI system be unable to resolve your concern, your query will be escalated to
            a human support representative during business hours.
          </li>
          <li>
            All data processed by AI systems is subject to our Privacy Policy and is handled in
            compliance with Republic Act No. 10173 (Data Privacy Act of 2012).
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 8. Payment & Billing */}
      <LegalSectionBlock
        id="payment-terms"
        icon={<CreditCard className="h-4 w-4" strokeWidth={1.5} />}
        title="8. Payment & Billing"
      >
        <p>
          Subscription fees, installation charges, and equipment costs shall be as stated in the
          individual service agreement or the applicable rate schedule published on our website.
        </p>
        <ul>
          <li>
            <strong>Due Date:</strong> Recurring subscription fees are due on the date specified in
            the service agreement, typically on a monthly basis.
          </li>
          <li>
            <strong>Late Payment:</strong> Accounts that remain unpaid for more than fifteen (15)
            days past the due date may be subject to temporary service suspension. A reconnection fee
            may apply.
          </li>
          <li>
            <strong>Payment Methods:</strong> The Company accepts payments through bank transfer,
            GCash, Maya, and other channels as specified during onboarding.
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 9. Limitation of Liability */}
      <LegalSectionBlock
        id="limitation"
        icon={<ShieldCheck className="h-4 w-4" strokeWidth={1.5} />}
        title="9. Limitation of Liability"
      >
        <p>
          To the maximum extent permitted by Philippine law, Martinez Hybrid Technologies OPC, its
          officers, employees, and agents shall not be liable for:
        </p>
        <ul>
          <li>
            Indirect, incidental, consequential, or punitive damages arising from the use of or
            inability to use our services.
          </li>
          <li>
            Loss of data, revenue, or profit resulting from service interruptions caused by force
            majeure, upstream provider failures, or governmental action.
          </li>
          <li>
            Damage to equipment caused by improper use, unauthorized modifications, or failure to
            comply with the prescribed maintenance schedule.
          </li>
        </ul>
        <p>
          The Company&apos;s total aggregate liability for any claim arising under these Terms shall
          not exceed the total amount paid by the Subscriber to the Company during the twelve (12)
          months immediately preceding the event giving rise to such claim.
        </p>
      </LegalSectionBlock>

      {/* 10. Termination */}
      <LegalSectionBlock
        id="termination"
        icon={<Ban className="h-4 w-4" strokeWidth={1.5} />}
        title="10. Termination"
      >
        <p>
          Either party may terminate the service agreement by providing written notice as specified
          in the individual contract. Upon termination:
        </p>
        <ul>
          <li>
            Outstanding balances shall become immediately due and payable.
          </li>
          <li>
            Company-owned equipment (routers, ONTs) must be returned within fifteen (15) days.
          </li>
          <li>
            The Company may terminate service immediately if the Subscriber breaches these Terms,
            engages in illegal activity, or fails to pay outstanding fees after due notice.
          </li>
        </ul>
      </LegalSectionBlock>

      {/* 11. Amendments */}
      <LegalSectionBlock
        id="amendments"
        icon={<RefreshCw className="h-4 w-4" strokeWidth={1.5} />}
        title="11. Amendments & Governing Law"
      >
        <p>
          The Company reserves the right to modify these Terms at any time. Subscribers will be
          notified of material changes via email or official communication channels at least thirty
          (30) days prior to the effective date. Continued use of our services after such
          notification constitutes acceptance of the amended Terms.
        </p>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the
          <strong> Republic of the Philippines</strong>. Any disputes arising from these Terms shall
          be resolved through amicable negotiation and, failing that, shall be submitted to the
          exclusive jurisdiction of the appropriate courts in Iloilo City, Philippines.
        </p>
        <p>
          For questions or concerns regarding these Terms, please contact us at{' '}
          <a href="mailto:martinezhybrid.opc@gmail.com">martinezhybrid.opc@gmail.com</a>.
        </p>
      </LegalSectionBlock>
    </LegalPageLayout>
  );
}
