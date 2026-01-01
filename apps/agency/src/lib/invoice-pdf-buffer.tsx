/**
 * Invoice PDF Buffer Generator
 * -----------------------------
 * Server-side PDF generation for email attachments.
 * Uses @react-pdf/renderer to generate PDF as Buffer.
 */

import { renderToBuffer } from '@react-pdf/renderer';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Invoice } from '@/types/invoice';

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  page: {
    padding: 0, // Reset padding given header spans full width
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
    backgroundColor: '#fff',
  },
  // Container for content below header
  content: {
    padding: 40,
  },
  // Glassmorphic-style Header Container
  headerContainer: {
    backgroundColor: '#f8fafc', // Slate-50
    padding: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // Slate-200
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  brand: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
    color: '#0f172a', // Slate-900
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#64748b', // Slate-500
    marginBottom: 12,
  },
  contactInfo: {
    fontSize: 9,
    color: '#475569', // Slate-600
    lineHeight: 1.4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#e2e8f0', // Very light slate text
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 8,
  },
  metaTable: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'flex-end',
  },
  metaLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginRight: 8,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 10,
    color: '#334155',
    fontFamily: 'Helvetica',
  },

  // Client Section
  billToSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionLabel: {
    fontSize: 9,
    color: '#94a3b8', // Slate-400
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clientName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  clientMeta: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4,
  },

  // Table
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    marginBottom: 8,
  },
  tableCellHeader: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  tableCell: {
    fontSize: 10,
    color: '#334155',
  },
  // Columns
  colDesc: { width: '50%', paddingLeft: 8 },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '20%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right', paddingRight: 8 },

  // Totals Area
  summarySection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    width: '50%',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    marginRight: 16,
    textAlign: 'right',
    flex: 1,
  },
  summaryValue: {
    fontSize: 10,
    color: '#334155',
    fontFamily: 'Helvetica-Bold',
    width: 80,
    textAlign: 'right',
  },
  totalDueRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#0f172a',
    paddingTop: 12,
    width: '50%',
    alignItems: 'center',
  },
  totalDueLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    marginRight: 16,
    flex: 1,
    textAlign: 'right',
  },
  totalDueValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#06b6d4', // Cyan accent
    width: 120,
    textAlign: 'right',
  },

  // Payment Info Box
  paymentBox: {
    marginTop: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  paymentLabel: {
    width: 100,
    fontSize: 10,
    color: '#64748b',
  },
  paymentValue: {
    fontSize: 10,
    color: '#0f172a',
    fontFamily: 'Helvetica-Bold',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    paddingTop: 20,
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 8,
    color: '#06b6d4',
    textDecoration: 'none',
  },

  // Status Badge
  statusBadge: {
    marginTop: 8, // Adjust position relative to header logic
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  statusText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

// =============================================================================
// PDF DOCUMENT COMPONENT
// =============================================================================
function InvoicePDFDocument({ invoice }: { invoice: Invoice }) {
  const currencyCode = invoice.currency; // PHP, USD
  const currencySymbol = currencyCode === 'PHP' ? '₱' : '$';

  const formatAmount = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Full-width "Glass" Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>JEFFDEV STUDIO</Text>
            <Text style={styles.brandSubtitle}>Web Development Services</Text>

            <View style={{ marginTop: 8 }}>
              <Text style={styles.contactInfo}>Dingle, Iloilo, Philippines</Text>
              <Text style={styles.contactInfo}>contact@jeffdev.studio</Text>
              <Text style={styles.contactInfo}>DTI: VLLP979818395984</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.title}>INVOICE</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Invoice No.</Text>
                <Text style={styles.metaValue}>{invoice.refNo}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Issue Date</Text>
                <Text style={styles.metaValue}>{formatDate(invoice.issueDate)}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Due Date</Text>
                <Text style={[styles.metaValue, { color: '#0f172a' }]}>
                  {formatDate(invoice.dueDate)}
                </Text>
              </View>
            </View>

            {/* Status Indicator */}
            {invoice.status === 'paid' && (
              <View style={[styles.statusBadge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.statusText, { color: '#166534' }]}>PAID</Text>
              </View>
            )}
            {invoice.status === 'overdue' && (
              <View style={[styles.statusBadge, { backgroundColor: '#fee2e2' }]}>
                <Text style={[styles.statusText, { color: '#991b1b' }]}>OVERDUE</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Bill To & Project Info */}
          <View style={styles.billToSection}>
            <Text style={styles.sectionLabel}>Billed To</Text>
            <Text style={styles.clientName}>{invoice.clientName}</Text>
            {invoice.clientCompany && (
              <Text style={styles.clientMeta}>{invoice.clientCompany}</Text>
            )}
            <Text style={styles.clientMeta}>{invoice.clientEmail}</Text>
            {invoice.clientAddress && (
              <Text style={styles.clientMeta}>{invoice.clientAddress}</Text>
            )}

            {invoice.projectTitle && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.sectionLabel, { marginBottom: 2 }]}>Project Reference</Text>
                <Text style={[styles.clientMeta, { fontFamily: 'Helvetica-Bold', color: '#334155' }]}>
                  {invoice.projectTitle}
                </Text>
              </View>
            )}
          </View>

          {/* Line Items Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, styles.colDesc]}>Description</Text>
              <Text style={[styles.tableCellHeader, styles.colQty]}>Qty</Text>
              <Text style={[styles.tableCellHeader, styles.colPrice]}>Unit Price</Text>
              <Text style={[styles.tableCellHeader, styles.colTotal]}>Amount</Text>
            </View>

            {invoice.items.map((item, index) => (
              <View style={styles.tableRow} key={item.id || index}>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>{formatAmount(item.unitPrice)}</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{formatAmount(item.amount)}</Text>
              </View>
            ))}
          </View>

          {/* Totals Section */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatAmount(invoice.subtotal)}</Text>
            </View>

            {invoice.discount && invoice.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                  -{formatAmount(invoice.discount)}
                </Text>
              </View>
            )}

            {(invoice.tax || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax ({(invoice.taxRate || 0) * 100}%)</Text>
                <Text style={styles.summaryValue}>{formatAmount(invoice.tax || 0)}</Text>
              </View>
            )}

            {(invoice.paidAmount || 0) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount Paid</Text>
                <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
                  -{formatAmount(invoice.paidAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalDueRow}>
              <Text style={styles.totalDueLabel}>Total {invoice.balanceDue > 0 ? 'Due' : 'Paid'}</Text>
              <Text style={styles.totalDueValue}>
                {invoice.balanceDue === 0 && invoice.paidAmount > 0
                  ? formatAmount(invoice.paidAmount) // Show Total Paid if fully paid
                  : formatAmount(invoice.balanceDue) // Show Balance Due
                }
                {' '}{currencyCode}
              </Text>
            </View>
          </View>

          {/* Payment Details */}
          {invoice.balanceDue > 0 && (
            <View style={styles.paymentBox}>
              <Text style={styles.paymentHeader}>Payment Instructions</Text>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Bank</Text>
                <Text style={styles.paymentValue}>Landbank of the Philippines</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Account No.</Text>
                <Text style={styles.paymentValue}>1936-2091-96</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Account Name</Text>
                <Text style={styles.paymentValue}>Jeff Edrick Martinez</Text>
              </View>
              <View style={{ height: 8 }} />
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>GCash</Text>
                <Text style={styles.paymentValue}>+63 951 916 7103</Text>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your business!</Text>
            <Text style={styles.footerText}>
              This document serves as an internal Statement of Account. Official Receipt (OR) unavailable pending BIR registration.
            </Text>
            <Text style={styles.footerLink}>www.jeffdev.studio</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// =============================================================================
// EXPORT: Generate PDF as Buffer
// =============================================================================
/**
 * Generate invoice PDF as Buffer for email attachment
 * @param invoice - Invoice data
 * @returns Promise<Buffer> - PDF file as Buffer
 */
export async function generateInvoicePDFBuffer(invoice: Invoice): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    <InvoicePDFDocument invoice={invoice} />
  );
  return pdfBuffer;
}
