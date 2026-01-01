'use client';

/**
 * GCash Proof Upload Component
 * -----------------------------
 * Shows QR code and allows proof of payment upload.
 */

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Upload, Copy, Check, Loader2 } from 'lucide-react';
import { recordPayment } from '@/app/actions/invoice';
import { getSignedUploadUrl } from '@/app/actions/upload';
import type { Invoice } from '@/types/invoice';

interface GcashProofUploadProps {
  invoice: Invoice;
  amount: number;
  onSuccess: () => void;
}

export function GcashProofUpload({ invoice, amount, onSuccess }: GcashProofUploadProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gcashNumber = process.env.NEXT_PUBLIC_GCASH_NUMBER || '09XXXXXXXXX';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(amount.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large (max 5MB)');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Get Presigned URL
      const result = await getSignedUploadUrl(
        file.name,
        file.type
      );

      if ('error' in result) {
        throw new Error(result.error);
      }

      const { url, fileUrl } = result;

      if (!url) {
        throw new Error('Failed to get upload URL');
      }

      // 2. Upload to R2 directly
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // 3. Success
      setProofUrl(fileUrl!);
      setUploading(false);
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || 'Failed to upload file');
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!proofUrl) {
      setError('Please upload proof of payment');
      return;
    }

    startTransition(async () => {
      const result = await recordPayment(invoice.id!, {
        amount,
        method: 'gcash',
        proofUrl,
        notes: `GCash payment - Pending verification`,
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to submit payment');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* QR Code */}
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-lg bg-white p-4">
          <Image
            src="/payments/gcash-qr.png"
            alt="GCash QR Code"
            width={200}
            height={200}
            className="h-48 w-48 object-contain"
          />
        </div>
        <p className="text-center text-sm text-white/50">
          Scan with GCash app to pay
        </p>
      </div>

      {/* Amount to Pay */}
      <div className="rounded-md border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/50">Amount to pay</p>
            <p className="text-2xl font-bold text-emerald-400">
              ₱{amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Amount
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-white/30">
          GCash Number: {gcashNumber}
        </p>
      </div>

      {/* Proof Upload */}
      <div>
        <label className="mb-2 block text-sm text-white/50">
          Upload Proof of Payment
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={uploading}
          />
          <div
            className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 transition-colors ${
              proofUrl
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-white/50" />
            ) : proofUrl ? (
              <>
                <Check className="h-8 w-8 text-emerald-400" />
                <p className="text-sm text-emerald-400">Proof uploaded</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-white/30" />
                <p className="text-sm text-white/50">
                  Click or drag to upload screenshot
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!proofUrl || isPending}
        className="w-full rounded-md bg-emerald-500/20 py-3 font-medium text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </span>
        ) : (
          'Submit Payment'
        )}
      </button>

      <p className="text-center text-xs text-white/30">
        Payment will be verified within 24 hours
      </p>
    </div>
  );
}
