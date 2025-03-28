# Deployment Changes and Solutions

## Issues Addressed

### 1. Go Module Version Error

- **Problem**: Build failing due to Go version mismatch - code required 1.24.1, but Docker image used 1.21
- **Solution**: Updated Dockerfile to use `golang:1.24-alpine` and added `nixpacks.toml` configuration

### 2. Playwright Dependency Error

- **Problem**: Go server failing with error about missing Playwright node executable
- **Solution**:
  - Added graceful fallback to HTTP-based crawling when Playwright is unavailable
  - Created symbolic link to Node.js in the expected Playwright location
  - Added necessary dependencies for browser automation (chromium, firefox, libc6-compat)

### 3. Multi-Service Container Configuration

- **Problem**: Needed both TanStack Start server (for SSR) and Go API server running together
- **Solution**:
  - Implemented supervisord to manage multiple processes
  - Created a startup script with detailed debugging
  - Set up proper directory structure and file permissions
  - Added health check endpoints and logging

### 4. Container Networking

- **Problem**: Communication between frontend and backend services
- **Solution**:
  - Updated API client to use correct URLs for container environment
  - Exposed both ports (8080 for API, 3000 for UI)
  - Set up proper CORS headers and fallback paths

### 5. Static File Serving

- **Problem**: Static files from UI build needed to be accessible
- **Solution**:
  - Copied the static assets to the correct location
  - Added fallback index.html for the API server
  - Improved error handling and logging

## Architecture Overview

The final deployment architecture:

```
┌─────────────────────────────────────────┐
│             Docker Container            │
│                                         │
│  ┌─────────────┐       ┌─────────────┐  │
│  │             │       │             │  │
│  │  Go API     │◄─────►│  TanStack   │  │
│  │  Server     │       │  Start      │  │
│  │  (8080)     │       │  Server     │  │
│  │             │       │  (3000)     │  │
│  └─────────────┘       └─────────────┘  │
│          ▲                    ▲         │
│          │                    │         │
└──────────┼────────────────────┼─────────┘
           │                    │
           ▼                    ▼
      API Requests         UI Requests
```

## Railway Deployment

For Railway deployment:

1. Uses `nixpacks.toml` to specify necessary dependencies
2. Uses `railway.toml` to configure build and start processes
3. Uses `supervisord.conf` to manage multiple processes
4. Health check endpoint at `/api/health` ensures the service is monitored correctly

## Local Development

For local development:

1. Run Go API server: `go run cmd/server/main.go`
2. Run UI development server: `cd ui && npm run dev`
3. Access UI at http://localhost:3000 and API at http://localhost:8080
