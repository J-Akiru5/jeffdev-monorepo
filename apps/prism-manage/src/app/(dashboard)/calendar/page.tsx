'use client';

/**
 * Calendar Page
 * -------------
 * FullCalendar view showing tasks with due dates and synced events.
 */

import { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useProjects } from '@/contexts/project-context';
import type { Task } from '@/lib/schemas';

// Mock tasks with due dates
const mockTasks: Task[] = [
  { id: '1', projectId: '1', title: 'Review quarterly reports', completed: false, starred: true, dueDate: '2026-01-20', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', projectId: '1', title: 'Schedule team meeting', completed: false, starred: false, dueDate: '2026-01-22', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', projectId: '2', title: 'Ppt Ma\'am Osano', completed: false, starred: false, dueDate: '2026-01-21', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '8', projectId: '3', title: 'Token Ma\'am Ding', completed: false, starred: false, dueDate: '2026-01-23', order: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '13', projectId: '5', title: 'Monthly Regular Meeting', completed: false, starred: false, dueDate: '2026-01-25', dueTime: '14:00', order: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function CalendarPage() {
  const { projects } = useProjects();

  // Convert tasks to FullCalendar events
  const events = useMemo(() => {
    return mockTasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const project = projects.find((p) => p.id === task.projectId);
        return {
          id: task.id,
          title: task.title,
          start: task.dueTime
            ? `${task.dueDate}T${task.dueTime}`
            : task.dueDate,
          allDay: !task.dueTime,
          backgroundColor: project?.color || '#06b6d4',
          borderColor: project?.color || '#06b6d4',
          extendedProps: {
            projectId: task.projectId,
            projectName: project?.name,
            completed: task.completed,
            starred: task.starred,
          },
        };
      });
  }, [projects]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>
        <p className="mt-1 text-sm text-white/40">
          View your tasks and events in calendar format
        </p>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          weekends={true}
          height="auto"
          eventClick={(info) => {
            console.log('Event clicked:', info.event);
          }}
          dateClick={(info) => {
            console.log('Date clicked:', info.dateStr);
          }}
        />
      </div>

      {/* Sync Status (Placeholder) */}
      <div className="mt-6 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div>
          <h3 className="text-sm font-medium text-white">Google Calendar Sync</h3>
          <p className="text-xs text-white/40">Connect to sync your events</p>
        </div>
        <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20">
          Connect Calendar
        </button>
      </div>
    </div>
  );
}
