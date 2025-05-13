// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title message logger contract
/// @notice simple contract that logs message metadata
contract MessageLogger {
    // message metadata struct
    struct MessageMeta {
        address sender;
        bytes32 recipientHash;
        bytes32 messageHash; // ipfs cid hash
        uint256 timestamp;
    }

    // event for new messages
    event MessageSent(
        address indexed sender, 
        bytes32 indexed recipientHash, 
        bytes32 messageHash, 
        uint256 timestamp
    );

    /**
     * logs message metadata by emitting event
     * @param recipientHash hashed identifier of recipient
     * @param messageHash ipfs cid hash of encrypted message
     */
    function sendMessage(bytes32 recipientHash, bytes32 messageHash) public {
        emit MessageSent(
            msg.sender, 
            recipientHash, 
            messageHash, 
            block.timestamp
        );
    }
} 