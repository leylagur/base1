import { EventMetadata} from "./types";

const STORAGE_KEY = "noflake_events";

/**
 * Simple localStorage-based event storage for MVP
 * In production, this would be replaced with a backend API or database
 */
export class EventStorage {
  private static getEvents(): EventMetadata[] {
    if (typeof window === "undefined") return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading events from storage:", error);
      return [];
    }
  }

  private static saveEvents(events: EventMetadata[]): void {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      console.error("Error saving events to storage:", error);
    }
  }

  static createEvent(metadata: Omit<EventMetadata, "id" | "createdAt">): EventMetadata {
    const events = this.getEvents();
    const newEvent: EventMetadata = {
      ...metadata,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    events.push(newEvent);
    this.saveEvents(events);
    return newEvent;
  }

  static getEvent(id: string): EventMetadata | null {
    const events = this.getEvents();
    return events.find((e) => e.id === id) || null;
  }

  static getAllEvents(): EventMetadata[] {
    return this.getEvents();
  }

  static updateEvent(id: string, updates: Partial<EventMetadata>): EventMetadata | null {
    const events = this.getEvents();
    const index = events.findIndex((e) => e.id === id);
    
    if (index === -1) return null;
    
    events[index] = { ...events[index], ...updates };
    this.saveEvents(events);
    return events[index];
  }

  static linkOnChainEvent(metadataId: string, onChainEventId: string): void {
    this.updateEvent(metadataId, { onChainEventId });
  }

  static deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const filtered = events.filter((e) => e.id !== id);
    
    if (filtered.length === events.length) return false;
    
    this.saveEvents(filtered);
    return true;
  }
}

