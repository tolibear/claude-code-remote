#!/bin/bash
#
# Headless Claude Setup Script
#
# This script helps you set up Claude Code on your VPS and configure
# the headless runner as a systemd service.
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Headless Claude Subscription - Setup                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}Warning: Running as root. Consider using a non-root user.${NC}"
fi

# Check for Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18+ first:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

# Check for npm
echo -e "${BLUE}Checking npm...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

# Check for git
echo -e "${BLUE}Checking git...${NC}"
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "${GREEN}✓ git found: $GIT_VERSION${NC}"
else
    echo -e "${RED}✗ git not found${NC}"
    echo "Please install git: sudo apt-get install git"
    exit 1
fi

# Check for Claude Code
echo ""
echo -e "${BLUE}Checking Claude Code CLI...${NC}"

CLAUDE_PATH=""
COMMON_PATHS=(
    "/usr/local/bin/claude"
    "/usr/bin/claude"
    "$HOME/.local/bin/claude"
    "$HOME/.claude/bin/claude"
)

for path in "${COMMON_PATHS[@]}"; do
    if [ -f "$path" ]; then
        CLAUDE_PATH="$path"
        break
    fi
done

if [ -n "$CLAUDE_PATH" ]; then
    echo -e "${GREEN}✓ Claude Code found: $CLAUDE_PATH${NC}"

    # Test if Claude is authenticated
    echo -e "${BLUE}Checking Claude authentication...${NC}"
    if $CLAUDE_PATH --version &> /dev/null; then
        echo -e "${GREEN}✓ Claude Code is working${NC}"
    else
        echo -e "${YELLOW}⚠ Claude Code may need authentication${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Claude Code CLI not found${NC}"
    echo ""
    echo "You need to install Claude Code. Two options:"
    echo ""
    echo "Option 1: Install via npm (recommended)"
    echo -e "  ${BLUE}npm install -g @anthropic-ai/claude-code${NC}"
    echo ""
    echo "Option 2: Use Hostinger's Claude VPS template"
    echo "  https://www.hostinger.com/vps/claude-code"
    echo ""

    read -p "Would you like to install Claude Code now via npm? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Installing Claude Code...${NC}"
        npm install -g @anthropic-ai/claude-code

        # Verify installation
        if command -v claude &> /dev/null; then
            CLAUDE_PATH=$(which claude)
            echo -e "${GREEN}✓ Claude Code installed: $CLAUDE_PATH${NC}"
        else
            echo -e "${RED}Installation may have failed. Please install manually.${NC}"
            exit 1
        fi
    else
        echo "Please install Claude Code and run this script again."
        exit 1
    fi
fi

# Check Claude authentication
echo ""
echo -e "${BLUE}Checking Claude authentication status...${NC}"

# Try to run a simple Claude command to check auth
if ! $CLAUDE_PATH -p "echo test" --max-turns 1 &> /dev/null; then
    echo -e "${YELLOW}⚠ Claude Code needs authentication${NC}"
    echo ""
    echo "Please authenticate Claude Code by running:"
    echo -e "  ${BLUE}claude${NC}"
    echo ""
    echo "This will open a browser for authentication."
    echo "After authenticating, run this setup script again."
    echo ""

    read -p "Would you like to authenticate now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $CLAUDE_PATH
        echo ""
        echo -e "${GREEN}If authentication succeeded, run this script again.${NC}"
        exit 0
    else
        exit 1
    fi
else
    echo -e "${GREEN}✓ Claude Code is authenticated${NC}"
fi

# Install npm dependencies
echo ""
echo -e "${BLUE}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo -e "${BLUE}Creating .env file...${NC}"
    cat > .env << EOF
# Headless Claude Configuration

# Directory containing your project (defaults to current directory)
# PROJECT_DIR=/path/to/your/project

# Path to Claude binary (auto-detected if not set)
# CLAUDE_PATH=$CLAUDE_PATH

# Timeout for each task in minutes (default: 30)
# CLAUDE_TIMEOUT_MINUTES=30

# Poll interval in milliseconds (default: 10000 = 10 seconds)
# POLL_INTERVAL_MS=10000

# Webhook trigger settings (if using webhook trigger)
# WEBHOOK_PORT=3000
# WEBHOOK_SECRET=your-secret-here

# GitHub trigger settings (if using GitHub issues trigger)
# GITHUB_TOKEN=your-github-token
# GITHUB_REPO=owner/repo
# GITHUB_LABEL=claude-ready
EOF
    echo -e "${GREEN}✓ Created .env file - edit it to configure your settings${NC}"
fi

# Ask about systemd service
echo ""
echo -e "${BLUE}Would you like to set up a systemd service?${NC}"
echo "This allows Claude to run automatically on boot."
read -p "Set up systemd service? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    CURRENT_DIR=$(pwd)
    CURRENT_USER=$(whoami)

    # Select trigger
    echo ""
    echo "Which trigger would you like to use?"
    echo "  1) File trigger (tasks.json)"
    echo "  2) Webhook trigger (HTTP server)"
    echo "  3) GitHub Issues trigger"
    read -p "Enter choice (1-3): " trigger_choice

    case $trigger_choice in
        1) TRIGGER="triggers/file-trigger.ts" ;;
        2) TRIGGER="triggers/webhook-trigger.ts" ;;
        3) TRIGGER="triggers/github-issues-trigger.ts" ;;
        *) TRIGGER="triggers/file-trigger.ts" ;;
    esac

    # Create systemd service file
    SERVICE_FILE="/etc/systemd/system/remote-ralph.service"

    sudo tee $SERVICE_FILE > /dev/null << EOF
[Unit]
Description=Headless Claude Subscription
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$CURRENT_DIR
ExecStart=$(which npx) tsx src/index.ts $TRIGGER
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    echo -e "${GREEN}✓ Created systemd service file${NC}"

    # Reload systemd
    sudo systemctl daemon-reload

    echo ""
    echo -e "${GREEN}Systemd service created!${NC}"
    echo ""
    echo "Commands:"
    echo "  sudo systemctl start remote-ralph    # Start the service"
    echo "  sudo systemctl stop remote-ralph     # Stop the service"
    echo "  sudo systemctl enable remote-ralph   # Start on boot"
    echo "  sudo systemctl status remote-ralph   # Check status"
    echo "  sudo journalctl -u remote-ralph -f   # View logs"
fi

# Done!
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Setup Complete!                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env to configure your settings"
echo "  2. Test with: npm start triggers/file-trigger.ts"
echo "  3. Add tasks to tasks.json (or use webhook/GitHub trigger)"
echo ""
echo "Documentation: https://github.com/your-username/remote-ralph-subscription"
echo ""
