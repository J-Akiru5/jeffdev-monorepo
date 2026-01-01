'use client';

/**
 * Admin Calendar Component
 * -------------------------
 * FullCalendar wrapper with dark theme styling.
 */

import { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import type { CalendarEvent, EventType } from '@/types/firestore';
import { getCalendarEvents } from '@/app/actions/calendar';
import { EventModal } from './event-modal';

// Event type color mapping
const eventColors: Record<EventType, string> = {
  deadline: '#ef4444', // red
  meeting: '#06b6d4', // cyan
  milestone: '#8b5cf6', // purple
  reminder: '#f59e0b', // amber
  holiday: '#10b981', // emerald
};

interface AdminCalendarProps {
  initialEvents?: CalendarEvent[];
}

export function AdminCalendar({ initialEvents = [] }: AdminCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Refresh events
  const refreshEvents = useCallback(async () => {
    const newEvents = await getCalendarEvents();
    setEvents(newEvents);
  }, []);

  // Handle date click/select
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.startStr);
    setSelectedEvent(null);
    setModalOpen(true);
  };

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find((e) => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setSelectedDate(null);
      setModalOpen(true);
    }
  };

  // Transform events to FullCalendar format
  const calendarEvents: EventInput[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    backgroundColor: event.color || eventColors[event.type],
    borderColor: event.color || eventColors[event.type],
    extendedProps: {
      description: event.description,
      type: event.type,
      projectSlug: event.projectSlug,
    },
  }));

  return (
    <div className="admin-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={calendarEvents}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        select={handleDateSelect}
        eventClick={handleEventClick}
        height="auto"
      />

      <EventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
          setSelectedDate(null);
        }}
        event={selectedEvent}
        defaultDate={selectedDate}
        onSave={refreshEvents}
      />

      {/* Custom Styles for Dark Theme */}
      <style jsx global>{`
        .admin-calendar {
          --fc-border-color: rgba(255, 255, 255, 0.08);
          --fc-button-bg-color: rgba(255, 255, 255, 0.05);
          --fc-button-border-color: rgba(255, 255, 255, 0.1);
          --fc-button-text-color: rgba(255, 255, 255, 0.8);
          --fc-button-hover-bg-color: rgba(255, 255, 255, 0.1);
          --fc-button-hover-border-color: rgba(255, 255, 255, 0.2);
          --fc-button-active-bg-color: rgba(6, 182, 212, 0.2);
          --fc-button-active-border-color: rgba(6, 182, 212, 0.4);
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255, 255, 255, 0.02);
          --fc-list-event-hover-bg-color: rgba(255, 255, 255, 0.05);
          --fc-today-bg-color: rgba(6, 182, 212, 0.05);
          --fc-event-border-color: transparent;
        }

        .admin-calendar .fc {
          font-family: inherit;
        }

        .admin-calendar .fc-toolbar-title {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .admin-calendar .fc-col-header-cell-cushion,
        .admin-calendar .fc-daygrid-day-number {
          color: rgba(255, 255, 255, 0.6);
        }

        .admin-calendar .fc-daygrid-day-number {
          font-size: 0.875rem;
        }

        .admin-calendar .fc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.75rem;
        }

        .admin-calendar .fc-daygrid-more-link {
          color: rgba(6, 182, 212, 0.8);
        }

        .admin-calendar .fc-day-today {
          background-color: rgba(6, 182, 212, 0.05) !important;
        }

        @media (max-width: 768px) {
          .admin-calendar .fc-header-toolbar {
            flex-direction: column;
            gap: 1rem;
          }
          
          .admin-calendar .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            width: 100%;
          }
          
          .admin-calendar .fc-toolbar-title {
            font-size: 1.1rem;
          }

          .admin-calendar .fc-button {
            padding: 0.4rem 0.8rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
