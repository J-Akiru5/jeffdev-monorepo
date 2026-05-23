import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = process.env.GA_PROPERTY_ID; // Need to add this to .env

// Initialize client with Firebase Service Account credentials
// This works because Firebase & GA4 are usually in the same Google Cloud Project
const analyticsClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export interface AnalyticsMetrics {
  activeUsers24h: string;
  uniqueVisitors7d: string;
  screenPageViews24h: string;
  topCountry: string;
}

export async function getAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  if (!propertyId) {
    console.warn('GA_PROPERTY_ID is missing');
    return {
      activeUsers24h: '—',
      uniqueVisitors7d: '—',
      screenPageViews24h: '—',
      topCountry: '—',
    };
  }

  try {
    // Run report for last 24h
    const [response24h] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '1daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
      ],
    });

    // Run report for last 7 days (Unique Visitors)
    const [response7d] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'totalUsers' },
      ],
    });

    // Run report for Top Country (Traffic Source)
    const [responseCountry] = await analyticsClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'country' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
      limit: 1,
    });

    const activeUsers24h = response24h.rows?.[0]?.metricValues?.[0]?.value || '0';
    const screenPageViews24h = response24h.rows?.[0]?.metricValues?.[1]?.value || '0';
    const uniqueVisitors7d = response7d.rows?.[0]?.metricValues?.[0]?.value || '0';
    const topCountry = responseCountry.rows?.[0]?.dimensionValues?.[0]?.value || 'Unknown';

    return {
      activeUsers24h,
      screenPageViews24h,
      uniqueVisitors7d,
      topCountry,
    };
  } catch (error) {
    console.error('Failed to fetch GA data:', error);
    return {
      activeUsers24h: 'Error',
      uniqueVisitors7d: 'Error',
      screenPageViews24h: 'Error',
      topCountry: 'Error',
    };
  }
}
