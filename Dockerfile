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
# Copy the static assets from the UI build
COPY --from=ui-builder /app/ui/.vinxi/build/client/_build /app/ui/dist
RUN CGO_ENABLED=0 GOOS=linux go build -o broken-links-tester ./cmd/server

# Final image
FROM node:18-alpine
RUN apk --no-cache add ca-certificates

# Install supervisor to manage multiple processes
RUN apk add --no-cache supervisor

# Prepare for Playwright
RUN mkdir -p /root/.cache/ms-playwright-go/1.50.1
# Create a symbolic link to node in the expected location
RUN ln -s $(which node) /root/.cache/ms-playwright-go/1.50.1/node

# Install additional dependencies for Playwright
RUN apk add --no-cache chromium firefox libc6-compat nss

# Copy UI build and node_modules
WORKDIR /app/ui
COPY --from=ui-builder /app/ui/package*.json ./
COPY --from=ui-builder /app/ui/.vinxi ./vinxi
COPY --from=ui-builder /app/ui/.output ./.output
COPY --from=ui-builder /app/ui/node_modules ./node_modules

# Copy Go application
WORKDIR /app
COPY --from=go-builder /app/broken-links-tester ./
COPY supervisord.conf /etc/supervisord.conf
COPY start-go-server.sh ./
RUN chmod +x start-go-server.sh broken-links-tester

# Create logs directory
RUN mkdir -p /var/log

# Create UI dist directory
RUN mkdir -p /app/ui/dist
COPY --from=ui-builder /app/ui/.vinxi/build/client/_build /app/ui/dist

# Expose ports
EXPOSE 8080 3000

# Run supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"] 