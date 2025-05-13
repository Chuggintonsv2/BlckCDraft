// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Message Logger Contract
/// @notice A simple contract that logs encrypted message metadata
contract MessageLogger {
    // Struct to represent message metadata
    struct MessageMeta {
        address sender;
        bytes32 recipientHash;
        bytes32 messageHash; // IPFS CID hash
        uint256 timestamp;
    }

    // Event emitted when a new message is sent
    event MessageSent(
        address indexed sender, 
        bytes32 indexed recipientHash, 
        bytes32 messageHash, 
        uint256 timestamp
    );

    /**
     * @notice Logs a message metadata by emitting an event
     * @param recipientHash The hashed public key/identifier of the recipient
     * @param messageHash The IPFS CID hash of the encrypted message
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