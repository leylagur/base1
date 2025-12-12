import { EventStorage } from "./eventStorage";
import { EventMetadata } from "./types";

/**
 * Seeds a sample Free event for demonstration
 * Call this function once to create the sample event
 */
export function seedSampleEvent(): EventMetadata | null {
  // Check if sample event already exists
  const existingEvents = EventStorage.getAllEvents();
  const sampleExists = existingEvents.some(
    (e) => e.title === "Base ItugInova Jump Start Program Demo Day"
  );

  if (sampleExists) {
    return null; // Already exists
  }

  // Create sample event
  const sampleEvent = EventStorage.createEvent({
    title: "Base ItugInova Jump Start Program Demo Day",
    description: "Join us for an exciting demo day showcasing innovative projects built on Base. Meet the builders, see live demos, and network with the Base ecosystem. This event is part of the ItugInova Jump Start Program, designed to accelerate the next generation of on-chain applications.",
    location: "Base HQ, San Francisco (or Virtual via Base Camp)",
    datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    type: "FREE",
    organizerAddress: "0x0000000000000000000000000000000000000000" as `0x${string}`, // Placeholder
  });

  return sampleEvent;
}

/**
 * Initialize sample event on client side
 * Call this from a component or page
 */
export function initializeSampleEvent(): void {
  if (typeof window !== "undefined") {
    seedSampleEvent();
  }
}

