"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Event, EventMetadata } from "@/lib/types";
import { EventStorage } from "@/lib/eventStorage";
import { initializeSampleEvent } from "@/lib/seedSampleEvent";

export default function EventsPage() {
  const [events, setEvents] = useState<(EventMetadata & { onChainData?: Event })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Initialize sample event if it doesn't exist
        initializeSampleEvent();
        
        // Load all event metadata from storage
        const allMetadata = EventStorage.getAllEvents();
        
        // For STAKE events with onChainEventId, try to fetch on-chain data
        const eventsWithData = await Promise.all(
          allMetadata.map(async (metadata) => {
            if (metadata.type === "STAKE" && metadata.onChainEventId) {
              try {
                // Try to fetch on-chain event data
                // Note: This would need to be done via a read contract call
                // For now, we'll just return the metadata
                return { ...metadata };
              } catch (error) {
                console.error("Error fetching on-chain data:", error);
                return metadata;
              }
            }
            return metadata;
          })
        );

        // Sort by datetime (upcoming first)
        eventsWithData.sort((a, b) => 
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        setEvents(eventsWithData);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-light text-white tracking-tight mb-2">Events</h1>
            <p className="text-gray-300 font-light">Browse and join upcoming events</p>
          </div>
          <Link
            href="/events/create"
            className="bg-white text-purple-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-lg"
          >
            Create Event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-16 text-center border border-white/10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white text-xl mb-3 font-light">No events yet</p>
            <p className="text-gray-300 mb-8 font-light">
              Be the first to create an event and start building your community
            </p>
            <Link
              href="/events/create"
              className="inline-block bg-white text-purple-900 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-lg"
            >
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const eventDate = new Date(event.datetime);
              const isPast = eventDate < new Date();
              
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          event.type === "STAKE"
                            ? "bg-purple-500/20 text-purple-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}>
                          {event.type === "STAKE" ? "noFlake" : "Free"}
                        </span>
                        {isPast && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                            Past
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-medium text-white tracking-tight mb-1">
                        {event.title}
                      </h3>
                    </div>
                    <svg className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-400 text-sm font-light mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-300 text-sm font-light">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{eventDate.toLocaleDateString()} {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-gray-300 text-sm font-light">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}

                    {event.type === "STAKE" && event.depositAmountUSDC && (
                      <div className="flex items-center gap-2 text-purple-300 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{event.depositAmountUSDC} USDC stake</span>
                      </div>
                    )}

                    {event.type === "FREE" && (
                      <div className="flex items-center gap-2 text-blue-300 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Free RSVP</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

