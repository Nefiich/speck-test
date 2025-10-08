"use client";

import { useState, useEffect } from "react";
import {
  getCalendarEventsFromDB,
  syncCalendarEvents,
  CalendarEvent,
} from "../utils/calendarApi";

type TimeRange = "1" | "7" | "30";

export default function CalendarEvents() {
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresReauth, setRequiresReauth] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("7");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const timeRangeOptions = [
    { value: "1" as TimeRange, label: "Today", description: "Next 24 hours" },
    { value: "7" as TimeRange, label: "7 Days", description: "Next 7 days" },
    { value: "30" as TimeRange, label: "30 Days", description: "Next 30 days" },
  ];

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      setRequiresReauth(false);
      // Always fetch 30 days of events
      const calendarEvents = await getCalendarEventsFromDB(30);
      setAllEvents(calendarEvents);
    } catch (err) {
      console.error("Error fetching calendar events:", err);

      if (err instanceof Error && err.message.includes("re-authenticate")) {
        setRequiresReauth(true);
        setError(
          "Your Google authentication has expired. Please log out and log back in to refresh your calendar access."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to fetch calendar events"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncMessage(null);
      setError(null);

      const result = await syncCalendarEvents();
      setSyncMessage(`${result.message} (${result.synced} events)`);

      await fetchEvents();
    } catch (err) {
      console.error("Error syncing calendar events:", err);

      if (err instanceof Error && err.message.includes("re-authenticate")) {
        setRequiresReauth(true);
        setError(
          "Google authentication has expired. Log out and log back in to refresh your calendar access."
        );
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to sync calendar events"
        );
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
  };

  const handleReauth = () => {
    window.location.href = "/api/auth/google";
  };

  // Filter events based on selected time range
  const getFilteredEvents = () => {
    const now = new Date();
    const daysAhead = parseInt(selectedRange);

    let endDate: Date;
    let startDate: Date;

    if (daysAhead === 1) {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(now.getDate() + daysAhead);
    }

    const filtered = allEvents.filter((event: any) => {
      const startDateStr =
        event.start_datetime || event.start?.dateTime || event.start?.date;
      if (!startDateStr) {
        console.log("Event filtered out: no start date", event);
        return false;
      }

      const eventDate = new Date(startDateStr);
      const isInRange = eventDate >= startDate && eventDate <= endDate;

      if (!isInRange) {
        console.log("Event filtered out by date range:", {
          event: event.name || event.summary,
          eventDate: eventDate.toISOString(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isInRange,
        });
      }

      return isInRange;
    });

    console.log("Filtered events result:", {
      filteredCount: filtered.length,
      events: filtered.map((e: any) => ({
        name: e.name || e.summary,
        start_datetime: e.start_datetime || e.start?.dateTime,
      })),
    });

    return filtered;
  };

  const formatEventDate = (event: any) => {
    const startDateStr =
      event.start_datetime || event.start?.dateTime || event.start?.date;
    const endDateStr =
      event.end_datetime || event.end?.dateTime || event.end?.date;

    if (!startDateStr) return "No date";

    const start = new Date(startDateStr);
    const end = new Date(endDateStr || startDateStr);

    if (!endDateStr || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }

    const isSameDay = start.toDateString() === end.toDateString();

    if (isSameDay) {
      return `${start.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })} ${start.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })} - ${end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    return `${start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} ${start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} - ${end.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })} ${end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const groupEventsByDate = (events: any[]) => {
    const grouped: { [key: string]: any[] } = {};

    const shouldGroupByWeek = selectedRange === "30";

    events.forEach((event) => {
      const startDate =
        event.start_datetime || event.start?.dateTime || event.start?.date;
      if (!startDate) return;

      const date = new Date(startDate);
      let dateKey: string;

      if (shouldGroupByWeek) {
        const startOfWeek = new Date(date);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        dateKey = `Week of ${startOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      } else {
        dateKey = date.toDateString();
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    if (shouldGroupByWeek) {
      const sortedWeeks = Object.keys(grouped).sort((a, b) => {
        const dateA = new Date(a.replace("Week of ", ""));
        const dateB = new Date(b.replace("Week of ", ""));
        return dateA.getTime() - dateB.getTime();
      });

      return sortedWeeks.map((weekKey) => ({
        date: weekKey,
        isWeek: true,
        events: grouped[weekKey].sort((a, b) => {
          const aTime = a.start_datetime || a.start?.dateTime || a.start?.date;
          const bTime = b.start_datetime || b.start?.dateTime || b.start?.date;
          return new Date(aTime!).getTime() - new Date(bTime!).getTime();
        }),
      }));
    } else {
      const sortedDates = Object.keys(grouped).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      return sortedDates.map((dateKey) => ({
        date: dateKey,
        isWeek: false,
        events: grouped[dateKey].sort((a, b) => {
          const aTime = a.start_datetime || a.start?.dateTime || a.start?.date;
          const bTime = b.start_datetime || b.start?.dateTime || b.start?.date;
          return new Date(aTime!).getTime() - new Date(bTime!).getTime();
        }),
      }));
    }
  };

  const getCurrentRangeLabel = () => {
    const option = timeRangeOptions.find((opt) => opt.value === selectedRange);
    return option?.description || "Next 30 days";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
          Calendar Events
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Loading events...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Calendar Events
        </h2>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          {requiresReauth && (
            <button
              onClick={handleReauth}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Re-authenticate with Google
            </button>
          )}
        </div>
      </div>
    );
  }

  // Get filtered events based on selected range
  const filteredEvents = getFilteredEvents();
  const groupedEvents = groupEventsByDate(filteredEvents);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Calendar Events
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-md transition-colors"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Syncing...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Sync Events
              </>
            )}
          </button>

          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRangeChange(option.value)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedRange === option.value
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {syncMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-sm text-green-700 dark:text-green-300">
            {syncMessage}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Showing events for {getCurrentRangeLabel().toLowerCase()} (filtered from{" "}
        {allEvents.length} total events)
      </p>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No events found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You don't have any events in the selected time range. Try syncing
            your calendar first.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map((group: any) => {
            let dateLabel: string;
            let isToday = false;

            if (group.isWeek) {
              dateLabel = group.date;
            } else {
              const groupDate = new Date(group.date);
              isToday = groupDate.toDateString() === new Date().toDateString();
              const isTomorrow =
                groupDate.toDateString() ===
                new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

              dateLabel = groupDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              });

              if (isToday) {
                dateLabel = `Today, ${dateLabel}`;
              } else if (isTomorrow) {
                dateLabel = `Tomorrow, ${dateLabel}`;
              }
            }

            return (
              <div key={group.date} className="space-y-3">
                <div className="flex items-center">
                  <h4
                    className={`text-lg font-semibold ${
                      isToday
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {dateLabel}
                  </h4>
                  <div className="ml-3 flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    {group.events.length} event
                    {group.events.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3 ml-4">
                  {group.isWeek
                    ? (() => {
                        const eventsByDay: { [key: string]: any[] } = {};

                        group.events.forEach((event: any) => {
                          const startDate =
                            event.start_datetime ||
                            event.start?.dateTime ||
                            event.start?.date;
                          if (startDate) {
                            const date = new Date(startDate);
                            const dayKey = date.toDateString();
                            if (!eventsByDay[dayKey]) {
                              eventsByDay[dayKey] = [];
                            }
                            eventsByDay[dayKey].push(event);
                          }
                        });

                        const sortedDays = Object.keys(eventsByDay).sort(
                          (a, b) =>
                            new Date(a).getTime() - new Date(b).getTime()
                        );

                        return sortedDays.map((dayKey) => {
                          const dayDate = new Date(dayKey);
                          const isDayToday =
                            dayDate.toDateString() ===
                            new Date().toDateString();
                          const isDayTomorrow =
                            dayDate.toDateString() ===
                            new Date(
                              Date.now() + 24 * 60 * 60 * 1000
                            ).toDateString();

                          let dayLabel = dayDate.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          });

                          if (isDayToday) {
                            dayLabel = `Today, ${dayLabel}`;
                          } else if (isDayTomorrow) {
                            dayLabel = `Tomorrow, ${dayLabel}`;
                          }

                          return (
                            <div key={dayKey} className="mb-4">
                              <h5
                                className={`text-sm font-medium mb-2 ${
                                  isDayToday
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {dayLabel} ({eventsByDay[dayKey].length} event
                                {eventsByDay[dayKey].length !== 1 ? "s" : ""})
                              </h5>
                              <div className="space-y-2 ml-4">
                                {eventsByDay[dayKey].map((event: any) => (
                                  <div
                                    key={event.google_event_id || event.id}
                                    className="p-3 rounded-lg border transition-colors duration-200 hover:shadow-md bg-gray-50 dark:bg-gray-600 border-gray-200 dark:border-gray-500"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                                          {event.name || event.summary}
                                        </h6>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                          {formatEventDate(event)}
                                        </p>
                                        {event.location && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                            <svg
                                              className="h-3 w-3 mr-1"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                              />
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                              />
                                            </svg>
                                            {event.location}
                                          </p>
                                        )}
                                      </div>
                                      {event.html_link && (
                                        <div className="ml-2 flex-shrink-0">
                                          <a
                                            href={event.html_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                          >
                                            View
                                            <svg
                                              className="ml-1 h-3 w-3"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                              />
                                            </svg>
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()
                    : group.events.map((event: any) => {
                        return (
                          <div
                            key={event.google_event_id || event.id}
                            className="p-4 rounded-lg border transition-colors duration-200 hover:shadow-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-75"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 dark:text-white">
                                  {event.name || event.summary}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {formatEventDate(event)}
                                </p>
                                {event.location && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                    <svg
                                      className="h-4 w-4 mr-1"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    {event.location}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <div className="ml-4 flex-shrink-0">
                                {event.html_link && (
                                  <a
                                    href={event.html_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
