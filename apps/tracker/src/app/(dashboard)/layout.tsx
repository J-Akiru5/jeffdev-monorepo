import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { ProjectProvider } from '@/contexts/project-context';

/**
 * Dashboard Layout
 * ----------------
 * Shell for all dashboard pages with sidebar and mobile nav.
 */

// Mock initial projects for now (will be fetched from Firestore)
const mockProjects = [
  { id: '1', name: 'My Tasks', color: '#06b6d4', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Academics', color: '#8b5cf6', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'Student Council', color: '#10b981', order: 2, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', name: 'USC', color: '#f59e0b', order: 3, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '5', name: 'SineAI Guild', color: '#ef4444', order: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider initialProjects={mockProjects}>
      <div className="min-h-screen bg-void">
        {/* Desktop Sidebar */}
        <Sidebar />

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content */}
        <div className="ml-0 transition-all duration-300 lg:ml-64">
          {/* Add padding bottom for mobile nav clearance */}
          <main className="min-h-screen p-4 pb-24 lg:p-6 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
    </ProjectProvider>
  );
}
