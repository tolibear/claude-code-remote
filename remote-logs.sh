#!/bin/bash
#
# Stream logs from remote Claude Code server
#
# INSTRUCTIONS: After server setup, Claude will update these values:
#

# === UPDATE THESE AFTER SETUP ===
SSH_KEY=""           # e.g., ~/.ssh/id_rsa or ~/keys/server.pem
SERVER=""            # e.g., ubuntu@123.45.67.89
LOG_FILE=""          # e.g., /home/ubuntu/claude.log
# ================================

if [ -z "$SSH_KEY" ] || [ -z "$SERVER" ] || [ -z "$LOG_FILE" ]; then
    echo "Error: remote-logs.sh not configured yet."
    echo ""
    echo "Ask Claude to update this file with your server details:"
    echo "  SSH_KEY, SERVER, and LOG_FILE"
    exit 1
fi

echo "Streaming logs from $SERVER..."
echo "Press Ctrl+C to stop"
echo ""

ssh -i "$SSH_KEY" "$SERVER" "tail -f $LOG_FILE"
