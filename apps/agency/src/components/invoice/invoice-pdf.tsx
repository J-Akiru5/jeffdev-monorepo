'use client';

/**
 * Invoice PDF Template
 * ---------------------
 * Professional PDF invoice using @react-pdf/renderer.
 * Includes JeffDev Studio branding and payment details.
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { Invoice } from '@/types/invoice';

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#333',
    backgroundColor: '#fff',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: '#0891b2', // cyan-600
  },
  subBrand: {
    fontSize: 9,
    color: '#666',
    marginTop: 3,
  },
  invoiceTitle: {
    fontSize: 28,
    color: '#ddd',
    fontFamily: 'Helvetica-Bold',
  },
  invoiceNumber: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'right',
  },
  invoiceDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  
  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginVertical: 15,
  },
  
  // Client Info
  section: {
    marginVertical: 10,
  },
  label: {
    fontSize: 9,
    color: '#888',
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  text: {
    fontSize: 10,
    marginTop: 2,
    color: '#444',
  },
  
  // Two Column Layout
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '48%',
  },
  
  // Table
  table: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    padding: 10,
    fontSize: 10,
  },
  tableCellHeader: {
    padding: 10,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  colDescription: { width: '50%' },
  colQty: { width: '10%', textAlign: 'center' },
  colUnit: { width: '20%', textAlign: 'right' },
  colAmount: { width: '20%', textAlign: 'right' },
  
  // Totals
  totalsContainer: {
    alignSelf: 'flex-end',
    width: '45%',
    marginTop: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  discountRow: {
    color: '#dc2626', // red
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#333',
    marginTop: 5,
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0891b2',
  },
  
  // Payment Info
  paymentBox: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  paymentTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  paymentLabel: {
    fontSize: 9,
    color: '#666',
    width: 80,
  },
  paymentValue: {
    fontSize: 9,
    color: '#333',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: '#999',
    lineHeight: 1.5,
  },
  footerUrl: {
    fontSize: 8,
    color: '#0891b2',
    marginTop: 4,
  },
  
  // Status Badge
  statusBadge: {
    position: 'absolute',
    top: 40,
    right: 40,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: '4 8',
    borderRadius: 2,
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  statusPartial: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
});

// =============================================================================
// COMPONENT
// =============================================================================
interface InvoicePDFProps {
  invoice: Invoice;
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const currencySymbol = invoice.currency === 'PHP' ? '₱' : '$';
  
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
        {/* Status Badge */}
        {invoice.status === 'paid' && (
          <View style={[styles.statusBadge, styles.statusPaid]}>
            <Text>PAID</Text>
          </View>
        )}
        {invoice.status === 'partial' && (
          <View style={[styles.statusBadge, styles.statusPartial]}>
            <Text>PARTIAL</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>JEFFDEV STUDIO</Text>
            <Text style={styles.subBrand}>Dingle, Iloilo, Philippines</Text>
            <Text style={styles.subBrand}>contact@jeffdev.studio</Text>
            <Text style={styles.subBrand}>+63 951 916 7103</Text>
            <Text style={styles.subBrand}>DTI No: VLLP979818395984</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.refNo}</Text>
            <Text style={styles.invoiceDate}>
              Issued: {formatDate(invoice.issueDate)}
            </Text>
            <Text style={styles.invoiceDate}>
              Due: {formatDate(invoice.dueDate)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Client Info */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.value}>{invoice.clientName}</Text>
            {invoice.clientCompany && (
              <Text style={styles.text}>{invoice.clientCompany}</Text>
            )}
            {invoice.clientAddress && (
              <Text style={styles.text}>{invoice.clientAddress}</Text>
            )}
            <Text style={styles.text}>{invoice.clientEmail}</Text>
          </View>
          {invoice.projectTitle && (
            <View style={styles.col}>
              <Text style={styles.label}>Project</Text>
              <Text style={styles.value}>{invoice.projectTitle}</Text>
            </View>
          )}
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableCellHeader, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableCellHeader, styles.colUnit]}>
              Unit Price
            </Text>
            <Text style={[styles.tableCellHeader, styles.colAmount]}>
              Amount
            </Text>
          </View>

          {/* Rows */}
          {invoice.items.map((item, index) => (
            <View style={styles.tableRow} key={item.id || index}>
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colUnit]}>
                {formatAmount(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {formatAmount(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatAmount(invoice.subtotal)}</Text>
          </View>
          
          {invoice.discount && invoice.discount > 0 && (
            <View style={[styles.totalRow, styles.discountRow]}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-{formatAmount(invoice.discount)}</Text>
            </View>
          )}
          
          {invoice.tax && invoice.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({((invoice.taxRate || 0) * 100).toFixed(0)}%)
              </Text>
              <Text style={styles.totalValue}>{formatAmount(invoice.tax)}</Text>
            </View>
          )}
          
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total Due</Text>
            <Text style={styles.grandTotalValue}>
              {formatAmount(invoice.balanceDue)}
            </Text>
          </View>
          
          {invoice.paidAmount > 0 && invoice.balanceDue > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Paid</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>
                  {formatAmount(invoice.paidAmount)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Balance</Text>
                <Text style={[styles.totalValue, { color: '#dc2626' }]}>
                  {formatAmount(invoice.balanceDue)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Payment Details</Text>
          
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Bank:</Text>
            <Text style={styles.paymentValue}>Landbank of the Philippines</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account:</Text>
            <Text style={styles.paymentValue}>1936-2091-96</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Name:</Text>
            <Text style={styles.paymentValue}>Jeff Edrick Martinez</Text>
          </View>
          
          <View style={{ marginTop: 8 }}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>GCash:</Text>
              <Text style={styles.paymentValue}>+63 951 916 7103</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>PayPal:</Text>
              <Text style={styles.paymentValue}>contact@jeffdev.studio</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This document serves as a Statement of Account/Service Invoice for internal tracking.
            Official Receipt (OR) is currently unavailable as BIR registration is in process.
          </Text>
          <Text style={styles.footerText}>
            Thank you for your business!
          </Text>
          <Text style={styles.footerUrl}>www.jeffdev.studio</Text>
        </View>
      </Page>
    </Document>
  );
}
