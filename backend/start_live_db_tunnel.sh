#!/bin/bash
# Keep an SSH tunnel open to the live PostgreSQL database on the VPS
if pgrep -f "5433:127.0.0.1:5432" > /dev/null; then
    echo "Live database tunnel is already running on port 5433."
else
    ssh -f -N -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -L 5433:127.0.0.1:5432 root@72.62.251.242
    echo "Live database tunnel connected: localhost:5433 -> 72.62.251.242:5432"
fi

