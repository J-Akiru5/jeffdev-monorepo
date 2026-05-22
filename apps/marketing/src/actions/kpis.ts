'use server';

import { getDb } from '@/lib/firebase';
import { revalidatePath } from 'next/cache';

export type Kpi = {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
};

const DEFAULT_KPIS: Kpi[] = [
  { id: 'waitlist-signups', label: 'Waitlist Signups', current: 0, target: 1500, unit: '' },
  { id: 'linkedin-followers', label: 'LinkedIn Followers', current: 0, target: 2000, unit: '' },
  { id: 'twitter-followers', label: 'Twitter Followers', current: 0, target: 3000, unit: '' },
  { id: 'youtube-subs', label: 'YouTube Subs', current: 0, target: 1000, unit: '' },
  { id: 'github-stars', label: 'GitHub Stars', current: 0, target: 1000, unit: '' },
  { id: 'mrr', label: 'MRR', current: 0, target: 1500, unit: '$' },
  { id: 'paying-customers', label: 'Pay Customers', current: 0, target: 75, unit: '' },
  { id: 'discord-members', label: 'Discord Members', current: 0, target: 500, unit: '' },
];

export async function getKpis(): Promise<Kpi[]> {
  try {
    const db = getDb();
    const snapshot = await db.collection('marketing-kpis').get();

    if (snapshot.empty) {
      return DEFAULT_KPIS;
    }

    const kpis: Kpi[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      kpis.push({
        id: doc.id,
        label: data.label || doc.id,
        current: data.current ?? 0,
        target: data.target ?? 0,
        unit: data.unit || '',
      });
    });

    return kpis.length > 0 ? kpis : DEFAULT_KPIS;
  } catch {
    return DEFAULT_KPIS;
  }
}

export async function updateKpi(
  id: string,
  updates: { current?: number; target?: number },
): Promise<void> {
  try {
    const db = getDb();
    const kpi = DEFAULT_KPIS.find((k) => k.id === id) || {
      label: id,
      unit: '',
      current: 0,
      target: 0,
    };

    const doc: Record<string, unknown> = {
      label: kpi.label,
      unit: kpi.unit,
      updatedAt: new Date().toISOString(),
    };

    if (updates.current !== undefined) doc.current = updates.current;
    if (updates.target !== undefined) doc.target = updates.target;

    await db.collection('marketing-kpis').doc(id).set(doc, { merge: true });
    revalidatePath('/');
  } catch (err) {
    console.error('[marketing] Failed to update KPI:', err);
    throw new Error('Failed to update KPI');
  }
}
