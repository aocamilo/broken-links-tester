# Build UI
FROM node:18-alpine AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm install
COPY ui/ ./
RUN npm run build

# Build Go application
FROM golang:1.24-alpine AS go-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o broken-links-tester ./cmd/server

# Final image
FROM node:18-alpine
RUN apk --no-cache add ca-certificates supervisor

# Install additional packages
RUN apk add --no-cache chromium firefox libc6-compat nss

# Create a symbolic link to node in the expected location
RUN mkdir -p /root/.cache/ms-playwright-go/1.50.1
RUN ln -s $(which node) /root/.cache/ms-playwright-go/1.50.1/node

# Copy the application binary and assets
WORKDIR /app

# Copy Go binary
COPY --from=go-builder /app/broken-links-tester .

# Copy UI files and dependencies
WORKDIR /app/ui
COPY --from=ui-builder /app/ui/package*.json ./
COPY --from=ui-builder /app/ui/.vinxi ./vinxi
COPY --from=ui-builder /app/ui/.output ./.output
COPY --from=ui-builder /app/ui/node_modules ./node_modules

# Create supervisor configuration
WORKDIR /app
COPY supervisord.conf /etc/supervisord.conf

# Create logs directory
RUN mkdir -p /var/log

# Make executables
RUN chmod +x broken-links-tester

# Expose ports
EXPOSE 8080 3000

# Run supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"] 