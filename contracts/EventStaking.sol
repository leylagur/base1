// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EventStaking
 * @dev Contract for managing event participation with USDC deposits
 */
contract EventStaking is Ownable {
    using SafeERC20 for IERC20;

    struct Event {
        uint256 id;
        address organizer;
        uint256 depositAmount; // in USDC smallest units
        uint256 startTime;
        bool settled;
        address[] participants;
        uint256 totalDeposits;
        uint256 checkedInCount;
    }

    struct ParticipantInfo {
        bool joined;
        bool checkedIn;
        bool payoutClaimed;
    }

    IERC20 public usdcToken;
    uint256 public nextEventId;
    
    mapping(uint256 => Event) public events;
    mapping(uint256 => mapping(address => ParticipantInfo)) public participantInfo;

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        uint256 depositAmount,
        uint256 startTime
    );

    event ParticipantJoined(
        uint256 indexed eventId,
        address indexed participant,
        uint256 depositAmount
    );

    event ParticipantCheckedIn(
        uint256 indexed eventId,
        address indexed participant
    );

    event EventSettled(
        uint256 indexed eventId,
        uint256 totalParticipants,
        uint256 checkedInCount
    );

    event PayoutClaimed(
        uint256 indexed eventId,
        address indexed participant,
        uint256 amount
    );

    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        nextEventId = 1;
    }

    /**
     * @dev Create a new event
     * @param depositAmount Amount in USDC smallest units (e.g., 5 USDC = 5 * 10^6)
     * @param startTime Unix timestamp for event start
     */
    function createEvent(
        uint256 depositAmount,
        uint256 startTime
    ) external returns (uint256) {
        require(depositAmount > 0, "Deposit amount must be greater than 0");
        require(startTime > block.timestamp, "Start time must be in the future");

        uint256 eventId = nextEventId++;
        
        events[eventId] = Event({
            id: eventId,
            organizer: msg.sender,
            depositAmount: depositAmount,
            startTime: startTime,
            settled: false,
            participants: new address[](0),
            totalDeposits: 0,
            checkedInCount: 0
        });

        emit EventCreated(eventId, msg.sender, depositAmount, startTime);
        return eventId;
    }

    /**
     * @dev Join an event by staking USDC
     * @param eventId The event ID to join
     */
    function joinEvent(uint256 eventId) external {
        Event storage eventData = events[eventId];
        require(eventData.id != 0, "Event does not exist");
        require(!eventData.settled, "Event already settled");
        require(block.timestamp < eventData.startTime, "Event has already started");
        require(
            !participantInfo[eventId][msg.sender].joined,
            "Already joined this event"
        );

        // Transfer USDC from participant to contract
        usdcToken.safeTransferFrom(
            msg.sender,
            address(this),
            eventData.depositAmount
        );

        // Update participant info
        participantInfo[eventId][msg.sender] = ParticipantInfo({
            joined: true,
            checkedIn: false,
            payoutClaimed: false
        });

        // Update event
        eventData.participants.push(msg.sender);
        eventData.totalDeposits += eventData.depositAmount;

        emit ParticipantJoined(eventId, msg.sender, eventData.depositAmount);
    }

    /**
     * @dev Check in to an event (can only be called by organizer or after start time)
     * @param eventId The event ID
     * @param participant Address of the participant checking in
     */
    function checkIn(
        uint256 eventId,
        address participant
    ) external {
        Event storage eventData = events[eventId];
        require(eventData.id != 0, "Event does not exist");
        require(
            msg.sender == eventData.organizer || block.timestamp >= eventData.startTime,
            "Not authorized or event not started"
        );
        require(
            participantInfo[eventId][participant].joined,
            "Participant not joined"
        );
        require(
            !participantInfo[eventId][participant].checkedIn,
            "Already checked in"
        );

        participantInfo[eventId][participant].checkedIn = true;
        eventData.checkedInCount++;

        emit ParticipantCheckedIn(eventId, participant);
    }

    /**
     * @dev Settle an event and distribute deposits
     * Only checked-in participants get their deposits back
     * Non-checked-in deposits are distributed to checked-in participants
     * @param eventId The event ID to settle
     */
    function settleEvent(uint256 eventId) external {
        Event storage eventData = events[eventId];
        require(eventData.id != 0, "Event does not exist");
        require(!eventData.settled, "Event already settled");
        require(
            block.timestamp >= eventData.startTime,
            "Event has not started yet"
        );

        eventData.settled = true;

        uint256 checkedInCount = eventData.checkedInCount;
        uint256 totalParticipants = eventData.participants.length;

        if (checkedInCount == 0) {
            // If no one checked in, organizer gets all deposits
            if (totalParticipants > 0) {
                usdcToken.safeTransfer(
                    eventData.organizer,
                    eventData.totalDeposits
                );
            }
        } else {
            // Calculate payout per checked-in participant
            uint256 payoutPerParticipant = eventData.totalDeposits / checkedInCount;
            uint256 remainder = eventData.totalDeposits % checkedInCount;

            // Distribute to checked-in participants
            for (uint256 i = 0; i < totalParticipants; i++) {
                address participant = eventData.participants[i];
                if (participantInfo[eventId][participant].checkedIn) {
                    uint256 payout = payoutPerParticipant;
                    if (i == 0 && remainder > 0) {
                        payout += remainder; // Give remainder to first participant
                    }
                    participantInfo[eventId][participant].payoutClaimed = true;
                    usdcToken.safeTransfer(participant, payout);
                }
            }
        }

        emit EventSettled(eventId, totalParticipants, checkedInCount);
    }

    /**
     * @dev Get event details
     */
    function getEvent(
        uint256 eventId
    ) external view returns (Event memory) {
        return events[eventId];
    }

    /**
     * @dev Get participant info for an event
     */
    function getParticipantInfo(
        uint256 eventId,
        address participant
    ) external view returns (ParticipantInfo memory) {
        return participantInfo[eventId][participant];
    }

    /**
     * @dev Get all participants for an event
     */
    function getEventParticipants(
        uint256 eventId
    ) external view returns (address[] memory) {
        return events[eventId].participants;
    }
}


