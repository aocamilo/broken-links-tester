#!/bin/sh

# Debug info
echo "Starting Go server from $(pwd)"
echo "Listing directory contents:"
ls -la

# Check if the binary exists and is executable
if [ ! -f "/app/broken-links-tester" ]; then
  echo "ERROR: Go binary not found at /app/broken-links-tester"
  exit 1
fi

if [ ! -x "/app/broken-links-tester" ]; then
  echo "Making Go binary executable"
  chmod +x /app/broken-links-tester
fi

# Check if UI dist directory exists
if [ ! -d "/app/ui/dist" ]; then
  echo "ERROR: UI dist directory not found at /app/ui/dist"
  echo "Creating directory"
  mkdir -p /app/ui/dist
fi

# Create a blank index.html if it doesn't exist
if [ ! -f "/app/ui/dist/index.html" ]; then
  echo "Creating dummy index.html"
  echo "<html><body><h1>UI Server is running at port 3000</h1></body></html>" > /app/ui/dist/index.html
fi

# Execute the Go server with output
echo "Executing Go server binary"
exec /app/broken-links-tester 