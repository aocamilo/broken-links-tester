# Use the official Playwright base image
FROM mcr.microsoft.com/playwright:v1.39.0-focal

# Install Go
RUN apt-get update && \
  apt-get install -y golang-go && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Build UI
FROM node:18 AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm install
COPY ui/ ./
RUN npm run build

# Build Go application
FROM golang:1.24 AS go-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o broken-links-tester ./cmd/server

# Final image
FROM mcr.microsoft.com/playwright:v1.39.0-focal
RUN apt-get update && \
  apt-get install -y supervisor && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -u 1000 appuser

# Copy the application binary and assets
WORKDIR /app

# Copy Go binary
COPY --from=go-builder /app/broken-links-tester .
RUN chown appuser:appuser broken-links-tester

# Copy UI files and dependencies
WORKDIR /app/ui
COPY --from=ui-builder /app/ui/package*.json ./
COPY --from=ui-builder /app/ui/.vinxi ./vinxi
COPY --from=ui-builder /app/ui/.output ./.output
COPY --from=ui-builder /app/ui/node_modules ./node_modules
RUN chown -R appuser:appuser .

# Create supervisor configuration
WORKDIR /app
COPY supervisord.conf /etc/supervisord.conf

# Create logs directory
RUN mkdir -p /var/log && \
  chown -R appuser:appuser /var/log

# Switch to non-root user
USER appuser

# Expose ports
EXPOSE 8080 3000

# Run supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"] 