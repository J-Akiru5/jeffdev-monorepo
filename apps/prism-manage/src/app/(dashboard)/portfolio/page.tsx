/**
 * Portfolio list (/portfolio)
 * ---------------------------
 * Server page: fetches the dashboard payload once (projects + stats + partner
 * register) and hands it to the client view. Filtering, card rendering and the
 * create dialog all happen client-side; amounts are redacted for non-founders
 * inside `getPortfolioData`.
 */

import { getPortfolioData } from "@/app/actions/portfolio";
import { PortfolioView } from "@/components/portfolio/portfolio-view";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const data = await getPortfolioData();

  return <PortfolioView data={data} />;
}
