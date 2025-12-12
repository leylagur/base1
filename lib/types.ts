export type EventType = "FREE" | "STAKE";

export type ParticipantFieldId =
  | "name"
  | "email"
  | "phone"
  | "walletAddress"
  | "telegram"
  | "farcaster"
  | "note"
  | `custom_${string}`;

export type ParticipantFieldType = "text" | "textarea" | "email" | "phone" | "wallet" | "social";

export interface ParticipantFieldConfig {
  id: ParticipantFieldId;
  label: string;         // e.g. "Full Name", "Email", "Wallet Address"
  required: boolean;     // true = must be filled by participant
  type: ParticipantFieldType;
}

export interface EventMetadata {
  id: string;
  title: string;
  description?: string;
  location?: string;
  datetime: string;
  type: EventType;
  depositAmountUSDC?: string;
  organizerAddress: `0x${string}`;
  createdAt: string;
  onChainEventId?: string; // Links to on-chain event ID if STAKE type
  participantFields?: ParticipantFieldConfig[]; // Fields to collect from participants
}

export interface Event {
  id: bigint;
  organizer: string;
  depositAmount: bigint;
  startTime: bigint;
  settled: boolean;
  participants: string[];
  totalDeposits: bigint;
  checkedInCount: bigint;
}

export interface ParticipantInfo {
  joined: boolean;
  checkedIn: boolean;
  payoutClaimed: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  datetime: string;
  type: EventType;
  depositAmount: string;
}


