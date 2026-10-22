/**
 * Route-level loading state for the portfolio segment — same spinner the tasks
 * page and the operations hub use while server data resolves.
 */

export default function PortfolioLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
      </div>
    </div>
  );
}
