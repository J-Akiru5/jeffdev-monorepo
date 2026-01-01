'use client';

/**
 * Event Modal Component
 * ----------------------
 * Create/Edit calendar event modal.
 */

import { useState, useEffect, useTransition } from 'react';
import { X, Trash2 } from 'lucide-react';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/app/actions/calendar';
import type { CalendarEvent, EventType } from '@/types/firestore';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  defaultDate: string | null;
  onSave: () => void;
}

const eventTypes: { value: EventType; label: string; color: string }[] = [
  { value: 'deadline', label: 'Deadline', color: '#ef4444' },
  { value: 'meeting', label: 'Meeting', color: '#06b6d4' },
  { value: 'milestone', label: 'Milestone', color: '#8b5cf6' },
  { value: 'reminder', label: 'Reminder', color: '#f59e0b' },
  { value: 'holiday', label: 'Holiday', color: '#10b981' },
];

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  onSave,
}: EventModalProps) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('meeting');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [allDay, setAllDay] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (event) {
        setTitle(event.title);
        setDescription(event.description || '');
        setType(event.type);
        setStart(event.start.split('T')[0]);
        setEnd(event.end?.split('T')[0] || '');
        setAllDay(event.allDay ?? true);
      } else {
        setTitle('');
        setDescription('');
        setType('meeting');
        setStart(defaultDate?.split('T')[0] || new Date().toISOString().split('T')[0]);
        setEnd('');
        setAllDay(true);
      }
    }
  }, [isOpen, event, defaultDate]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      start,
      end: end || undefined,
      allDay,
    };

    startTransition(async () => {
      if (event?.id) {
        await updateCalendarEvent(event.id, data);
      } else {
        await createCalendarEvent(data);
      }
      onSave();
      onClose();
    });
  };

  const handleDelete = () => {
    if (!event?.id || !confirm('Delete this event?')) return;

    startTransition(async () => {
      await deleteCalendarEvent(event.id!);
      onSave();
      onClose();
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-md border border-white/10 bg-[#0a0a0a] p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {event ? 'Edit Event' : 'New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm text-white/50">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event title..."
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-white/20"
              autoFocus
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-1 block text-sm text-white/50">Type</label>
            <div className="flex flex-wrap gap-2">
              {eventTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`rounded-sm px-3 py-1 text-sm transition-all ${
                    type === t.value
                      ? 'text-white'
                      : 'text-white/50 hover:text-white'
                  }`}
                  style={{
                    backgroundColor:
                      type === t.value ? `${t.color}30` : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${type === t.value ? t.color : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm text-white/50">Start</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-white/50">End</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/20"
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            <span className="text-sm text-white/70">All day event</span>
          </label>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm text-white/50">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description..."
              rows={3}
              className="w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none focus:border-white/20"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          {event ? (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex items-center gap-2 text-sm text-red-400 transition-colors hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-white/50 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !title.trim()}
              className="rounded-md bg-cyan-500/20 px-4 py-2 text-sm text-cyan-400 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : event ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
