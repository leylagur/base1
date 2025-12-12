"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { formatUnits } from "viem";
import { EVENT_STAKING_ADDRESS, EVENT_STAKING_ABI, USDC_ADDRESS, USDC_ABI } from "@/lib/contracts";
import { Event, ParticipantInfo, EventMetadata } from "@/lib/types";
import { EventStorage } from "@/lib/eventStorage";
import Link from "next/link";

// Simple RSVP storage for FREE events
const RSVP_STORAGE_KEY = "noflake_rsvps";

function getRSVPs(eventId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RSVP_STORAGE_KEY);
    const allRSVPs = stored ? JSON.parse(stored) : {};
    return allRSVPs[eventId] || [];
  } catch {
    return [];
  }
}

function addRSVP(eventId: string, address: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(RSVP_STORAGE_KEY);
    const allRSVPs = stored ? JSON.parse(stored) : {};
    if (!allRSVPs[eventId]) {
      allRSVPs[eventId] = [];
    }
    if (!allRSVPs[eventId].includes(address)) {
      allRSVPs[eventId].push(address);
    }
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(allRSVPs));
  } catch (error) {
    console.error("Error saving RSVP:", error);
  }
}

export default function EventDetailPage() {
  const params = useParams();
  const eventIdParam = params.id as string;
  const { address, isConnected } = useAccount();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [eventMetadata, setEventMetadata] = useState<EventMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvps, setRsvps] = useState<string[]>([]);
  const [isRSVPing, setIsRSVPing] = useState(false);

  // Check if this is a metadata-based event (FREE) or on-chain event (STAKE)
  const isMetadataEvent = eventIdParam.startsWith("event_");
  const isOnChainEvent = !isNaN(Number(eventIdParam)) && !isMetadataEvent;

  // For on-chain events, read event data
  const { data: eventData, refetch: refetchEvent } = useReadContract({
    address: EVENT_STAKING_ADDRESS && EVENT_STAKING_ADDRESS.length > 0 && isOnChainEvent ? (EVENT_STAKING_ADDRESS as `0x${string}`) : undefined,
    abi: EVENT_STAKING_ABI,
    functionName: "getEvent",
    args: EVENT_STAKING_ADDRESS && EVENT_STAKING_ADDRESS.length > 0 && isOnChainEvent ? [BigInt(eventIdParam)] : undefined,
  });

  // Read participant info for on-chain events
  const { data: participantInfo, refetch: refetchParticipant } = useReadContract({
    address: EVENT_STAKING_ADDRESS && EVENT_STAKING_ADDRESS.length > 0 && isOnChainEvent ? (EVENT_STAKING_ADDRESS as `0x${string}`) : undefined,
    abi: EVENT_STAKING_ABI,
    functionName: "getParticipantInfo",
    args: address && EVENT_STAKING_ADDRESS && EVENT_STAKING_ADDRESS.length > 0 && isOnChainEvent ? [BigInt(eventIdParam), address] : undefined,
  });

  // Read USDC balance and allowance for STAKE events
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS && USDC_ADDRESS.length > 0 && isOnChainEvent ? (USDC_ADDRESS as `0x${string}`) : undefined,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address && USDC_ADDRESS && USDC_ADDRESS.length > 0 && isOnChainEvent ? [address] : undefined,
  });

  const { data: usdcAllowance } = useReadContract({
    address: USDC_ADDRESS && USDC_ADDRESS.length > 0 && isOnChainEvent ? (USDC_ADDRESS as `0x${string}`) : undefined,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address && USDC_ADDRESS && USDC_ADDRESS.length > 0 && EVENT_STAKING_ADDRESS && EVENT_STAKING_ADDRESS.length > 0 && isOnChainEvent ? [address, EVENT_STAKING_ADDRESS as `0x${string}`] : undefined,
  });

  // Join event (STAKE events only)
  const {
    data: joinHash,
    writeContract: joinEvent,
    isPending: isJoining,
  } = useWriteContract();

  const { isLoading: isJoinConfirming, isSuccess: isJoinSuccess } = useWaitForTransactionReceipt({
    hash: joinHash,
  });

  useEffect(() => {
    if (isJoinSuccess) {
      setSuccess("Successfully joined event!");
      refetchEvent();
      refetchParticipant();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJoinSuccess]);

  // Approve USDC
  const {
    data: approveHash,
    writeContract: approveUSDC,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  useEffect(() => {
    if (isApproveSuccess) {
      setSuccess("USDC approved! You can now join the event.");
    }
  }, [isApproveSuccess]);

  // Check in
  const {
    data: checkInHash,
    writeContract: checkIn,
    isPending: isCheckingIn,
  } = useWriteContract();

  const { isLoading: isCheckInConfirming, isSuccess: isCheckInSuccess } = useWaitForTransactionReceipt({
    hash: checkInHash,
  });

  useEffect(() => {
    if (isCheckInSuccess) {
      setSuccess("Successfully checked in!");
      refetchEvent();
      refetchParticipant();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckInSuccess]);

  // Load event metadata
  useEffect(() => {
    if (isMetadataEvent) {
      const metadata = EventStorage.getEvent(eventIdParam);
      if (metadata) {
        setEventMetadata(metadata);
        setRsvps(getRSVPs(eventIdParam));
      } else {
        setError("Event not found");
      }
      setLoading(false);
    } else if (isOnChainEvent) {
      // For on-chain events, we'll try to find metadata by onChainEventId
      const allEvents = EventStorage.getAllEvents();
      const metadata = allEvents.find(e => e.onChainEventId === eventIdParam);
      if (metadata) {
        setEventMetadata(metadata);
      }
      setLoading(false);
    }
  }, [eventIdParam, isMetadataEvent, isOnChainEvent]);

  const handleJoin = async () => {
    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!eventData) {
      setError("Event data not loaded");
      return;
    }

    const event = eventData as unknown as Event;
    const depositAmount = event.depositAmount as bigint;
    const balance = usdcBalance as bigint;
    const allowance = usdcAllowance as bigint;

    if (balance < depositAmount) {
      setError(`Insufficient USDC balance. Need ${formatUnits(depositAmount, 6)} USDC`);
      return;
    }

    if (!USDC_ADDRESS || USDC_ADDRESS.length === 0 || !EVENT_STAKING_ADDRESS || EVENT_STAKING_ADDRESS.length === 0) {
      setError("Contract addresses not configured");
      return;
    }

    if (allowance < depositAmount) {
      approveUSDC({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: "approve",
        args: [EVENT_STAKING_ADDRESS as `0x${string}`, depositAmount],
      });
      return;
    }

    joinEvent({
      address: EVENT_STAKING_ADDRESS as `0x${string}`,
      abi: EVENT_STAKING_ABI,
      functionName: "joinEvent",
      args: [BigInt(eventIdParam)],
    });
  };

  const handleRSVP = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet to RSVP");
      return;
    }

    if (!eventMetadata) {
      setError("Event not found");
      return;
    }

    if (rsvps.includes(address)) {
      setError("You've already RSVP'd to this event");
      return;
    }

    setIsRSVPing(true);
    try {
      addRSVP(eventMetadata.id, address);
      setRsvps([...rsvps, address]);
      setSuccess("Successfully RSVP'd! See you there!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to RSVP");
    } finally {
      setIsRSVPing(false);
    }
  };

  const handleCheckIn = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (!EVENT_STAKING_ADDRESS || EVENT_STAKING_ADDRESS.length === 0) {
      setError("Contract address not configured");
      return;
    }

    checkIn({
      address: EVENT_STAKING_ADDRESS as `0x${string}`,
      abi: EVENT_STAKING_ABI,
      functionName: "checkIn",
      args: [BigInt(eventIdParam), address],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading event...</p>
      </div>
    );
  }

  // For FREE events, show metadata-based UI
  if (eventMetadata && eventMetadata.type === "FREE") {
    const eventDate = new Date(eventMetadata.datetime);
    const isPast = eventDate < new Date();
    const hasRSVPd = address && rsvps.includes(address);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <Link
            href="/events"
            className="text-white/60 hover:text-white mb-8 inline-flex items-center gap-2 font-light transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 mb-8 border border-white/10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                    Free Plan
                  </span>
                  {isPast && (
                    <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400">
                      Past Event
                    </span>
                  )}
                </div>
                <h1 className="text-5xl font-light text-white mb-4 tracking-tight">
                  {eventMetadata.title}
                </h1>
              </div>
            </div>

            {eventMetadata.description && (
              <p className="text-gray-300 text-lg font-light mb-8 leading-relaxed">
                {eventMetadata.description}
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Date & Time</div>
                  <div className="text-white font-light">
                    {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                {eventMetadata.location && (
                  <div>
                    <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Location</div>
                    <div className="text-white font-light">{eventMetadata.location}</div>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Organizer</div>
                  <div className="text-white font-light">{eventMetadata.organizerAddress.slice(0, 6)}...{eventMetadata.organizerAddress.slice(-4)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">RSVPs</div>
                  <div className="text-white font-medium text-lg">{rsvps.length}</div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
              <p className="text-red-200 font-light">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6">
              <p className="text-green-200 font-light">{success}</p>
            </div>
          )}

          {isConnected && !isPast && (
            <div className="space-y-4">
              {!hasRSVPd ? (
                <button
                  onClick={handleRSVP}
                  disabled={isRSVPing}
                  className="w-full bg-white text-purple-900 px-6 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isRSVPing ? "RSVPing..." : "RSVP to Event"}
                </button>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                  <p className="text-green-200 font-light">You&apos;ve RSVP&apos;d to this event!</p>
                </div>
              )}
            </div>
          )}

          {!isConnected && !isPast && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <p className="text-white/80 font-light text-center">
                Please connect your wallet to RSVP to this event
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For STAKE events, show on-chain data
  if (!eventData && isOnChainEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-6 max-w-md">
          <p className="text-yellow-200 text-center">
            Event not found or contract addresses not configured.
          </p>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading event...</p>
      </div>
    );
  }

  const event = eventData as unknown as Event;
  const participant = participantInfo as unknown as ParticipantInfo | undefined;
  const depositAmount = formatUnits(event.depositAmount as bigint, 6);
  const needsApproval = usdcAllowance && event.depositAmount && (usdcAllowance as bigint) < (event.depositAmount as bigint);
  const canJoin = !participant?.joined && !event.settled && BigInt(Math.floor(Date.now() / 1000)) < (event.startTime as bigint);
  const canCheckIn = participant?.joined && !participant.checkedIn && BigInt(Math.floor(Date.now() / 1000)) >= (event.startTime as bigint);
  const eventDate = eventMetadata?.datetime ? new Date(eventMetadata.datetime) : new Date(Number(event.startTime) * 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link
          href="/events"
          className="text-white/60 hover:text-white mb-8 inline-flex items-center gap-2 font-light transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-10 mb-8 border border-white/10">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500/20 text-purple-300">
                  noFlake Plan
                </span>
                {event.settled && (
                  <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400">
                    Settled
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-light text-white mb-4 tracking-tight">
                {eventMetadata?.title || `Event #${Number(event.id)}`}
              </h1>
              {eventMetadata?.description && (
                <p className="text-gray-300 text-lg font-light mb-6 leading-relaxed">
                  {eventMetadata.description}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Organizer</div>
                <div className="text-white font-light">{event.organizer.slice(0, 6)}...{event.organizer.slice(-4)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Deposit Amount</div>
                <div className="text-white font-medium text-lg">{depositAmount} USDC</div>
                <p className="text-gray-400 text-xs mt-1 font-light">
                  If you don&apos;t show up, your stake supports the bill for others
                </p>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Date & Time</div>
                <div className="text-white font-light">
                  {eventDate.toLocaleDateString()} at {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {eventMetadata?.location && (
                <div>
                  <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Location</div>
                  <div className="text-white font-light">{eventMetadata.location}</div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Participants</div>
                <div className="text-white font-medium text-lg">{Number(event.participants.length)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Checked In</div>
                <div className="text-white font-medium text-lg">{Number(event.checkedInCount)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Total Deposits</div>
                <div className="text-white font-medium text-lg">{formatUnits(event.totalDeposits as bigint, 6)} USDC</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-light mb-1 uppercase tracking-wider">Status</div>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  event.settled
                    ? "bg-gray-500/20 text-gray-300"
                    : "bg-green-500/20 text-green-300"
                }`}>
                  {event.settled ? "Settled" : "Active"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {participant && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-light text-white mb-6 tracking-tight">Your Status</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-gray-400 text-xs font-light mb-2 uppercase tracking-wider">Joined</div>
                <div className={`text-sm font-medium ${participant.joined ? "text-green-400" : "text-gray-500"}`}>
                  {participant.joined ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-light mb-2 uppercase tracking-wider">Checked In</div>
                <div className={`text-sm font-medium ${participant.checkedIn ? "text-green-400" : "text-gray-500"}`}>
                  {participant.checkedIn ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-light mb-2 uppercase tracking-wider">Payout Claimed</div>
                <div className={`text-sm font-medium ${participant.payoutClaimed ? "text-green-400" : "text-gray-500"}`}>
                  {participant.payoutClaimed ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
            <p className="text-red-200 font-light">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-6">
            <p className="text-green-200 font-light">{success}</p>
          </div>
        )}

        {isConnected && (
          <div className="space-y-4">
            {canJoin && (
              <button
                onClick={handleJoin}
                disabled={isJoining || isJoinConfirming || isApproving || isApproveConfirming}
                className="w-full bg-white text-purple-900 px-6 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {needsApproval
                  ? isApproving || isApproveConfirming
                    ? "Approving USDC..."
                    : "Approve USDC First"
                  : isJoining || isJoinConfirming
                  ? "Joining..."
                  : `Join Event (Stake ${depositAmount} USDC)`}
              </button>
            )}

            {canCheckIn && (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn || isCheckInConfirming}
                className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isCheckingIn || isCheckInConfirming
                  ? "Checking In..."
                  : "Check In"}
              </button>
            )}
          </div>
        )}

        {!isConnected && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <p className="text-white/80 font-light text-center">
              Please connect your wallet to interact with this event
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
