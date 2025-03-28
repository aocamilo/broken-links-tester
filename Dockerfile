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

# Install Playwright dependencies for Alpine
RUN apk add --no-cache \
  chromium \
  firefox-esr \
  nss \
  freetype \
  freetype-dev \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  nodejs \
  yarn \
  ffmpeg \
  font-noto \
  font-noto-emoji \
  font-noto-extra \
  font-noto-cjk \
  font-noto-arabic \
  font-noto-armenian \
  font-noto-bengali \
  font-noto-devanagari \
  font-noto-ethiopic \
  font-noto-georgian \
  font-noto-gujarati \
  font-noto-gurmukhi \
  font-noto-hebrew \
  font-noto-khmer \
  font-noto-lao \
  font-noto-malayalam \
  font-noto-myanmar \
  font-noto-nko \
  font-noto-sinhala \
  font-noto-tamil \
  font-noto-telugu \
  font-noto-thai \
  font-noto-tibetan \
  font-noto-oriya

# Install Playwright browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install chromium firefox

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