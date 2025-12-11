#!/bin/bash
echo "Starting debug script at $(date)" > start_debug.log
PWD=$(pwd)
echo "Current dir: $PWD" >> start_debug.log
echo "User: $(whoami)" >> start_debug.log
echo "Node: $(node -v)" >> start_debug.log
echo "NPM: $(npm -v)" >> start_debug.log

echo "Checking node_modules..." >> start_debug.log
if [ ! -d "node_modules" ]; then
  echo "node_modules missing, installing..." >> start_debug.log
  npm install >> start_debug.log 2>&1
else
  echo "node_modules exists" >> start_debug.log
fi

echo "Starting server..." >> start_debug.log
nohup npm run dev > server.log 2>&1 &
PID=$!
echo "Server process started with PID: $PID" >> start_debug.log
sleep 2
ps -p $PID >> start_debug.log
echo "Script finished" >> start_debug.log
