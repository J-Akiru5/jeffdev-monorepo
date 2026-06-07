"use client";

/**
 * TourGuide
 * ---------
 * First-run tour for new Manage app users using Driver.js.
 * Guides users through the key UI sections: sidebar, top nav, dashboard, etc.
 * Shows a welcome banner on first visit; users can start the tour or dismiss.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { Compass, X } from "lucide-react";

const STORAGE_KEY = "manage_tour_completed";

export function TourGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Only show the tour card on the dashboard page, where most tour targets exist
  const isDashboard = pathname === "/dashboard";

  const startTour = useCallback(() => {
    // Navigate to dashboard first if not already there, then start tour
    if (pathname !== "/dashboard") {
      router.push("/dashboard");
      // The tour will be started after navigation completes
      // by storing a flag in sessionStorage
      sessionStorage.setItem("pending_tour", "true");
      return;
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      steps: [
        {
          element: "[data-tour='top-navbar']",
          popover: {
            title: "Welcome to Prism Manage",
            description:
              "This is your command center for managing tasks, projects, and teams. Use the search bar or press ⌘K to open the command palette — search for tasks, navigate views, switch workspaces, all from one place.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: "[data-tour='workspace-switcher']",
          popover: {
            title: "Workspace Switcher",
            description:
              "Switch between your workspaces here. Personal for individual tasks, or Syntaxure Labs for team collaboration with departments.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='sidebar-views']",
          popover: {
            title: "Navigation Sidebar",
            description:
              "Quickly navigate between Dashboard, Tasks, Calendar, and Kanban views. The sidebar adapts based on your current workspace and role.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "[data-tour='mode-toggle']",
          popover: {
            title: "Focus & Workspace Mode",
            description:
              "Toggle between Focus mode (personal task management) and Workspace mode (team collaboration with departments). Switch based on what you're working on.",
            side: "right",
            align: "center",
          },
        },
        {
          element: "[data-tour='dashboard-stats']",
          popover: {
            title: "At a Glance Metrics",
            description:
              "See your workspace stats — department count, team members, total tasks, and completed work. All updated in real-time.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "[data-tour='dashboard-departments']",
          popover: {
            title: "Departments Overview",
            description:
              "Browse departments in your workspace. Click any department to see its tasks. Each department has its own color and member count.",
            side: "top",
            align: "start",
          },
        },
        {
          element: "[data-tour='quick-add-task']",
          popover: {
            title: "Quick Add Task",
            description:
              "Create a new task instantly from anywhere. Use this button or press the shortcut to capture ideas before they slip away.",
            side: "bottom",
            align: "end",
          },
        },
        {
          element: "[data-tour='sidebar-bottom']",
          popover: {
            title: "You're All Set! 🚀",
            description:
              "You now know the essentials. Start by creating a task or exploring your dashboard. You can restart this tour anytime from the sidebar help menu.",
            side: "top",
            align: "center",
          },
        },
      ],
    });

    driverObj.drive();
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, [pathname, router]);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const pendingTour = sessionStorage.getItem("pending_tour");

    if (pendingTour && isDashboard) {
      // User clicked "Start Tour" from another page and was redirected here
      sessionStorage.removeItem("pending_tour");
      // Use small delay to let the dashboard page fully render
      const timer = setTimeout(() => {
        startTour();
      }, 800);
      return () => clearTimeout(timer);
    }

    if (!completed && isDashboard) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isDashboard, startTour]);

  const dismissTour = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in lg:bottom-6 lg:left-72">
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-gradient-to-br from-[#0d1b1e] to-[#0a0a0a] shadow-2xl shadow-cyan-500/10">
        {/* Glow accent */}
        <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-cyan-400 to-cyan-600" />

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15">
                <Compass className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Welcome to Manage
                </h3>
                <p className="mt-0.5 text-xs text-white/50">
                  Take a quick tour to learn the key features and shortcuts.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={startTour}
                    className="rounded-md bg-cyan-500 px-3.5 py-1.5 text-xs font-semibold text-black transition-all hover:bg-cyan-400 active:scale-95"
                  >
                    Start Tour
                  </button>
                  <button
                    onClick={dismissTour}
                    className="text-xs text-white/40 transition-colors hover:text-white/60 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={dismissTour}
              className="shrink-0 rounded-full p-1 text-white/20 transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
