#!/bin/bash
# Start Kimchi proxy server - keeps running in background

PORT=${KIMCHI_PROXY_PORT:-3000}
LOG="/tmp/kimchi-proxy.log"
PID_FILE="/tmp/kimchi-proxy.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Kimchi proxy already running (PID: $PID)"
        exit 0
    fi
fi

# Check by port
if curl -s -o /dev/null "http://localhost:$PORT/health" 2>/dev/null; then
    echo "Kimchi proxy already running on port $PORT"
    exit 0
fi

# Start server
cd "$(dirname "$0")"
nohup node server.js --port "$PORT" > "$LOG" 2>&1 &
echo $! > "$PID_FILE"

# Wait for startup
for i in $(seq 1 20); do
    if curl -s -o /dev/null "http://localhost:$PORT/health" 2>/dev/null; then
        echo "Kimchi proxy started (PID: $(cat $PID_FILE))"
        exit 0
    fi
    sleep 0.5
done

echo "Failed to start proxy"
exit 1
