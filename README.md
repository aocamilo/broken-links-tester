# Broken Links Tester

A Go service that recursively checks for broken links on web pages. It uses Gin for the HTTP server and provides a simple API endpoint to test links up to a specified depth.

## Features

- Recursive link checking up to a specified depth
- Concurrent link checking for better performance
- Response time tracking for each link
- Detailed status reporting including HTTP status codes and errors
- Prevention of circular references and duplicate checks

## API Usage

### Check Links Endpoint

```
POST /check-links
```

Request body:

```json
{
  "url": "https://example.com",
  "depth": 3
}
```

Response:

```json
{
  "results": [
    {
      "url": "https://example.com",
      "status_code": 200,
      "response_time": "150ms",
      "depth": 0,
      "is_working": true,
      "last_checked": "2024-03-19T10:00:00Z"
    }
    // ... more results
  ],
  "total": 1,
  "url": "https://example.com",
  "depth": 3
}
```

## Running the Service

1. Make sure you have Go 1.16 or later installed
2. Clone the repository
3. Install dependencies:
   ```bash
   go mod download
   ```
4. Run the service:
   ```bash
   go run cmd/server/main.go
   ```

The service will start on port 8080 by default.

## Configuration

- The service timeout is set to 10 seconds per request
- Maximum depth is limited to 5 levels
- The service runs on port 8080 by default

## Error Handling

The service handles various types of errors including:

- Invalid URLs
- Network timeouts
- Invalid depth values
- HTTP errors

## License

MIT License
