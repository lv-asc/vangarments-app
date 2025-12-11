#!/bin/bash
echo "Starting restart script..." > restart_debug.log
pkill -f "node"
echo "Killed old processes" >> restart_debug.log
npm run dev > dev.log 2>&1 &
echo "Started dev server" >> restart_debug.log
