"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits, decodeEventLog } from "viem";
import { EVENT_STAKING_ADDRESS, EVENT_STAKING_ABI, USDC_ADDRESS, USDC_ABI } from "@/lib/contracts";
import { useReadContract } from "wagmi";
import { EventStorage } from "@/lib/eventStorage";
import { EventType, ParticipantFieldConfig, ParticipantFieldId, ParticipantFieldType } from "@/lib/types";
import Link from "next/link";

type Step = "plan-selection" | "event-details" | "participant-fields";

export default function CreateEventPage() {
  const router = useRouter();
  const account = useAccount();
  const { address, isConnected, status, connector } = account;
  
  // Debug: Log account state to find why isConnected is false
  useEffect(() => {
    console.log("🔍 useAccount debug:", {
      address,
      isConnected,
      status, // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
      connector: connector?.name,
      connectorId: connector?.id,
      fullAccount: account
    });
  }, [address, isConnected, status, connector, account]);
  const [step, setStep] = useState<Step>("plan-selection");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    datetime: "",
    type: null as EventType | null,
    depositAmount: "5",
    participantFields: [] as ParticipantFieldConfig[],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS && USDC_ADDRESS.length > 0 ? (USDC_ADDRESS as `0x${string}`) : undefined,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address && USDC_ADDRESS && USDC_ADDRESS.length > 0 ? [address] : undefined,
  });

  // Create event transaction
  const {
    data: hash,
    writeContract,
    isPending: isCreating,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handlePlanSelect = (planType: EventType) => {
    setFormData({ ...formData, type: planType });
    setStep("event-details");
  };


  const addParticipantField = (fieldId: ParticipantFieldId, label: string, type: ParticipantFieldType, required: boolean) => {
    setFormData({
      ...formData,
      participantFields: [
        ...formData.participantFields,
        { id: fieldId, label, type, required }
      ]
    });
  };

  const removeParticipantField = (index: number) => {
    setFormData({
      ...formData,
      participantFields: formData.participantFields.filter((_, i) => i !== index)
    });
  };

  const updateParticipantField = (index: number, updates: Partial<ParticipantFieldConfig>) => {
    setFormData({
      ...formData,
      participantFields: formData.participantFields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    });
  };

  const handleEventDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.title.trim()) {
      setError("Event title is required");
      return;
    }

    if (!formData.type) {
      setError("Please select an event type");
      return;
    }

    const startTime = Math.floor(new Date(formData.datetime).getTime() / 1000);
    if (startTime <= Math.floor(Date.now() / 1000)) {
      setError("Event time must be in the future");
      return;
    }

    // Move to participant fields step
    setStep("participant-fields");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isConnected) {
      setError("Please connect your wallet");
      return;
    }

    if (!formData.title.trim()) {
      setError("Event title is required");
      return;
    }

    if (!formData.type) {
      setError("Please select an event type");
      return;
    }

    const startTime = Math.floor(new Date(formData.datetime).getTime() / 1000);
    if (startTime <= Math.floor(Date.now() / 1000)) {
      setError("Event time must be in the future");
      return;
    }

    try {
      if (formData.type === "STAKE") {
        // STAKE event - requires on-chain creation
        const depositAmount = parseFloat(formData.depositAmount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
          setError("Invalid deposit amount");
      return;
    }

    if (!EVENT_STAKING_ADDRESS || EVENT_STAKING_ADDRESS.length === 0) {
      setError("Contract address not configured. Please set NEXT_PUBLIC_EVENT_STAKING_ADDRESS in your .env.local file.");
      return;
    }

      // Convert deposit amount to USDC units (6 decimals)
      const depositAmountWei = parseUnits(formData.depositAmount, 6);

      writeContract({
        address: EVENT_STAKING_ADDRESS as `0x${string}`,
        abi: EVENT_STAKING_ABI,
        functionName: "createEvent",
        args: [depositAmountWei, BigInt(startTime)],
      });
      } else {
        // FREE event - just store metadata
        const eventMetadata = EventStorage.createEvent({
          title: formData.title,
          description: formData.description || undefined,
          location: formData.location || undefined,
          datetime: new Date(formData.datetime).toISOString(),
          type: "FREE",
          organizerAddress: address as `0x${string}`,
          participantFields: formData.participantFields.length > 0 ? formData.participantFields : undefined,
        });

        setSuccess(`Free event "${eventMetadata.title}" created successfully!`);
        setTimeout(() => {
          router.push(`/events/${eventMetadata.id}`);
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    }
  };

  // Handle on-chain event creation success
  useEffect(() => {
    if (isSuccess && formData.type === "STAKE" && receipt && address) {
      // Parse EventCreated event from transaction receipt
      try {
        const eventCreatedLog = receipt.logs.find((log: { address?: string; topics?: string[] }) => {
          return log.address?.toLowerCase() === EVENT_STAKING_ADDRESS?.toLowerCase() &&
                 log.topics && log.topics.length >= 2;
        });

        if (eventCreatedLog && EVENT_STAKING_ADDRESS) {
          try {
            // Try to decode the event log
            const decoded = decodeEventLog({
              abi: EVENT_STAKING_ABI,
              data: eventCreatedLog.data,
              topics: eventCreatedLog.topics,
            });

            if (decoded.eventName === "EventCreated") {
              const onChainEventId = (decoded.args as { eventId?: bigint }).eventId?.toString();

              // Create metadata and link it
              const eventMetadata = EventStorage.createEvent({
                title: formData.title,
                description: formData.description || undefined,
                location: formData.location || undefined,
                datetime: new Date(formData.datetime).toISOString(),
                type: "STAKE",
                depositAmountUSDC: formData.depositAmount,
                organizerAddress: address as `0x${string}`,
                onChainEventId,
                participantFields: formData.participantFields.length > 0 ? formData.participantFields : undefined,
              });

              setSuccess(`Event "${eventMetadata.title}" created successfully!`);
              setTimeout(() => {
                router.push(`/events/${eventMetadata.id}`);
              }, 1500);
              return;
            }
          } catch {
            // If decoding fails, try extracting from topics directly
            if (eventCreatedLog.topics && eventCreatedLog.topics.length >= 2 && address) {
              const eventIdHex = eventCreatedLog.topics[1];
              if (eventIdHex && typeof eventIdHex === 'string') {
                const onChainEventId = BigInt(eventIdHex).toString();

                const eventMetadata = EventStorage.createEvent({
                  title: formData.title,
                  description: formData.description || undefined,
                  location: formData.location || undefined,
                  datetime: new Date(formData.datetime).toISOString(),
                  type: "STAKE",
                  depositAmountUSDC: formData.depositAmount,
                  organizerAddress: address as `0x${string}`,
                  onChainEventId,
                  participantFields: formData.participantFields.length > 0 ? formData.participantFields : undefined,
                });

                setSuccess(`Event "${eventMetadata.title}" created successfully!`);
                setTimeout(() => {
                  router.push(`/events/${eventMetadata.id}`);
                }, 1500);
                return;
              }
            }
          }
        }

        // Fallback: create metadata without linking
        if (address) {
          const eventMetadata = EventStorage.createEvent({
            title: formData.title,
            description: formData.description || undefined,
            location: formData.location || undefined,
            datetime: new Date(formData.datetime).toISOString(),
            type: "STAKE",
            depositAmountUSDC: formData.depositAmount,
            organizerAddress: address as `0x${string}`,
            participantFields: formData.participantFields.length > 0 ? formData.participantFields : undefined,
          });
          setSuccess(`Event "${eventMetadata.title}" created!`);
          setTimeout(() => {
            router.push("/events");
          }, 2000);
        }
      } catch (error) {
        console.error("Error parsing event creation:", error);
        // Still create metadata
        if (address) {
          const eventMetadata = EventStorage.createEvent({
            title: formData.title,
            description: formData.description || undefined,
            location: formData.location || undefined,
            datetime: new Date(formData.datetime).toISOString(),
            type: "STAKE",
            depositAmountUSDC: formData.depositAmount,
            organizerAddress: address as `0x${string}`,
            participantFields: formData.participantFields.length > 0 ? formData.participantFields : undefined,
          });
          setSuccess(`Event "${eventMetadata.title}" created!`);
          setTimeout(() => {
            router.push("/events");
          }, 2000);
        }
      }
    }
  }, [isSuccess, receipt, formData, address, router]);

  // Plan Selection Step
  if (step === "plan-selection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <Link
            href="/events"
            className="text-white/60 hover:text-white mb-8 inline-flex items-center gap-2 font-light transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-light text-white mb-4 tracking-tight">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto">
              Select how you want to organize your event on Base
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Free Plan */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-10 border-2 border-white/10 hover:border-blue-400/40 transition-all group">
              <div className="mb-8">
                <div className="w-16 h-16 bg-blue-500/20 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-light text-white mb-3 tracking-tight">Free Plan</h2>
                <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-4">
                  Powered by Base
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Zero commitment</strong> — Simple <strong>RSVP (Confirmation of Attendance)</strong> system for casual meetups
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Base-native</strong> — Built on Base blockchain for the crypto community
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Perfect for</strong> — Demo days, community meetups, networking events
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Zero Fees & Instant Setup</strong> — Event details are kept simple and off the main network, ensuring instant creation with no gas fees (gas-free).
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePlanSelect("FREE")}
                className="w-full bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-400/40 text-white px-8 py-4 rounded-xl font-medium transition-all group-hover:border-blue-400/60"
              >
                Choose Free Plan
              </button>
            </div>

            {/* No Flake Plan */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-10 border-2 border-white/10 hover:border-purple-400/40 transition-all group">
              <div className="mb-8">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl mb-6 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-light text-white mb-3 tracking-tight">noFlake Plan</h2>
                <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium mb-4">
                  Staking Required
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                  <p className="text-purple-200 text-sm font-light leading-relaxed">
                    <strong className="text-white">How it works:</strong> Participants stake USDC when they RSVP. If they don&apos;t show up, their stake is forfeited and distributed to attendees who did show up. This ensures commitment and rewards reliability.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Stake to commit</strong> — Participants lock USDC to confirm attendance
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">No-show forfeit</strong> — If someone doesn&apos;t show up, their stake supports the bill for others
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Attendees split the pot</strong> — Those who show up get their stake back plus a share of no-show deposits
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-gray-300 font-light leading-relaxed">
                    <strong className="text-white">Perfect for High-Commitment Events</strong> — Use it with friends, clubs, or exclusive groups for paid dinners, ticketed events, and more!
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePlanSelect("STAKE")}
                className="w-full bg-purple-500/20 hover:bg-purple-500/30 border-2 border-purple-400/40 text-white px-8 py-4 rounded-xl font-medium transition-all group-hover:border-purple-400/60"
              >
                Choose noFlake Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Event Details Form Step
  if (step === "event-details") {
    return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-12 max-w-2xl">
        <div className="mb-8">
          <button
            onClick={() => setStep("plan-selection")}
            className="text-white/60 hover:text-white mb-6 inline-flex items-center gap-2 font-light transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Plan Selection
          </button>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                formData.type === "FREE"
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-purple-500/20 text-purple-300"
              }`}>
                {formData.type === "FREE" ? "Free Plan" : "noFlake Plan"}
              </span>
            </div>
            <h1 className="text-5xl font-light text-white mb-3 tracking-tight">Event Details</h1>
            <p className="text-gray-300 font-light">
              {formData.type === "FREE" 
                ? "Fill in the details for your free event on Base"
                : "Fill in the details for your staking event"}
            </p>
          </div>
        </div>

        {!isConnected && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-8">
            <p className="text-yellow-200 font-light">
              Please connect your wallet to create an event
            </p>
          </div>
        )}

        {usdcBalance !== undefined && formData.type === "STAKE" && (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 mb-8 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-gray-300 font-light text-sm">Your USDC Balance</span>
              <span className="text-white font-medium">{formatUnits(usdcBalance as bigint, 6)} USDC</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-8">
            <p className="text-green-200 font-light">{success}</p>
          </div>
        )}

        <form onSubmit={handleEventDetailsSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-3 text-sm tracking-tight">
              Event Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all font-light"
              placeholder="e.g., Base Community Meetup"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-3 text-sm tracking-tight">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all font-light resize-none"
              rows={5}
              placeholder="Describe your event, location details, and what participants can expect..."
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-3 text-sm tracking-tight">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all font-light"
              placeholder="e.g., Base HQ, San Francisco"
              required
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-3 text-sm tracking-tight">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.datetime}
              onChange={(e) =>
                setFormData({ ...formData, datetime: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all font-light"
              required
            />
          </div>

          {formData.type === "STAKE" && (
          <div>
            <label className="block text-white font-medium mb-3 text-sm tracking-tight">
              Deposit Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.depositAmount}
              onChange={(e) =>
                setFormData({ ...formData, depositAmount: e.target.value })
              }
              className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all font-light"
              placeholder="5.00"
                required={formData.type === "STAKE"}
            />
              <p className="text-gray-400 text-xs mt-2 font-light">
                Amount participants must stake to join. If they don&apos;t show up, this supports the bill for others.
              </p>
          </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <p className="text-red-200 font-light">{error}</p>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-white text-purple-900 px-6 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-lg"
            >
              Next: Configure Participant Fields
            </button>
            <button
              type="button"
              onClick={() => setStep("plan-selection")}
              className="px-6 py-3.5 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  }

  // Participant Fields Configuration Step
  if (step === "participant-fields") {
    const predefinedFields: { id: ParticipantFieldId; label: string; type: ParticipantFieldType }[] = [
      { id: "name", label: "Full Name", type: "text" },
      { id: "email", label: "Email", type: "email" },
      { id: "phone", label: "Phone Number", type: "phone" },
      { id: "walletAddress", label: "Wallet Address", type: "wallet" },
      { id: "telegram", label: "Telegram", type: "social" },
      { id: "farcaster", label: "Farcaster", type: "social" },
      { id: "note", label: "Additional Notes", type: "textarea" },
    ];

    const addPredefinedField = (fieldId: ParticipantFieldId) => {
      const field = predefinedFields.find(f => f.id === fieldId);
      if (field && !formData.participantFields.find(f => f.id === fieldId)) {
        addParticipantField(fieldId, field.label, field.type, false);
      }
    };

    const addCustomField = () => {
      const customId = `custom_${Date.now()}` as ParticipantFieldId;
      addParticipantField(customId, "Custom Field", "text", false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-6 py-12 max-w-3xl">
          <div className="mb-8">
            <button
              onClick={() => setStep("event-details")}
              className="text-white/60 hover:text-white mb-6 inline-flex items-center gap-2 font-light transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Event Details
            </button>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  formData.type === "FREE"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-purple-500/20 text-purple-300"
                }`}>
                  {formData.type === "FREE" ? "Free Plan" : "noFlake Plan"}
                </span>
              </div>
              <h1 className="text-5xl font-light text-white mb-3 tracking-tight">Participant Information</h1>
              <p className="text-gray-300 font-light">
                Configure what information you want to collect from participants when they join your event
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
            <h2 className="text-2xl font-light text-white mb-6 tracking-tight">Predefined Fields</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {predefinedFields.map((field) => {
                const isAdded = formData.participantFields.some(f => f.id === field.id);
                return (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => !isAdded && addPredefinedField(field.id)}
                    disabled={isAdded}
                    className={`px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      isAdded
                        ? "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                    }`}
                  >
                    {field.label}
                    {isAdded && " ✓"}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={addCustomField}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-sm font-medium"
            >
              + Add Custom Field
            </button>
          </div>

          {formData.participantFields.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/10">
              <h2 className="text-2xl font-light text-white mb-6 tracking-tight">Configured Fields</h2>
              <div className="space-y-4">
                {formData.participantFields.map((field, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-5 border border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateParticipantField(index, { label: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/20 transition-all font-light mb-3"
                          placeholder="Field label"
                        />
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-gray-300 text-sm font-light">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateParticipantField(index, { required: e.target.checked })}
                              className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
                            />
                            Required
                          </label>
                          <span className="text-gray-400 text-xs font-light">
                            Type: {field.type}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParticipantField(index)}
                        className="ml-4 p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.participantFields.length === 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8 text-center">
              <p className="text-blue-200 font-light">
                No fields configured. Participants will only need to RSVP without providing additional information.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
              <p className="text-red-200 font-light">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={(formData.type === "STAKE" && (isCreating || isConfirming || !isConnected)) || !!success}
                className="flex-1 bg-white text-purple-900 px-6 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {formData.type === "STAKE" && (isCreating || isConfirming)
                  ? "Creating..."
                  : success
                  ? "Created!"
                  : "Create Event"}
              </button>
              <button
                type="button"
                onClick={() => setStep("event-details")}
                className="px-6 py-3.5 rounded-xl font-medium bg-white/5 text-white hover:bg-white/10 transition-all border border-white/10"
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // This should not be reached, but TypeScript needs it
  return null;
}
