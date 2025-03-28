#!/bin/sh

# Echo current directory and list files for debugging
echo "Starting Go server with the following configuration:"
echo "Current directory: $(pwd)"

# Check if UI directories exist
echo "Checking UI directories:"
if [ -d "./ui/dist" ]; then
  echo "UI directory ./ui/dist exists"
  ls -la ./ui/dist
else
  echo "UI directory ./ui/dist does not exist"
fi

if [ -d "./ui/.output/public" ]; then
  echo "UI directory ./ui/.output/public exists"
  ls -la ./ui/.output/public
else
  echo "UI directory ./ui/.output/public does not exist"
fi

# Start the Go server
echo "Starting Go server..."
exec /app/broken-links-tester 