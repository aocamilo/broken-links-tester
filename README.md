# Broken Links Tester

A web application for recursively checking broken links on web pages. It combines a Go service backend with a React-based UI for an intuitive user experience.

## Features

### Backend

- Recursive link checking up to a specified depth
- Concurrent link checking for better performance
- Response time tracking for each link
- Detailed status reporting including HTTP status codes and errors
- Prevention of circular references and duplicate checks

### Frontend

- Modern, responsive UI built with React and TailwindCSS
- Enhanced table component with TanStack Table for displaying results
- Advanced filtering and sorting capabilities
- Support for both light and dark modes
- Interactive data visualization for response times
- Drag-and-drop column reordering
- Pagination controls for navigating large result sets

## UI Features

### Table Enhancements

- **Sorting:** Click on column headers to sort by any field
- **Multi-select Filtering:** Filter by working/broken status, status codes, and URLs
- **Column Reordering:** Drag columns to reorder them
- **Column Resizing:** Adjust column widths to your preference
- **Visual Response Time:** Color-coded bars indicate fast or slow response times
- **Fixed Layout:** Prevents layout shifting during filtering or sorting operations
- **Sticky Headers:** Table headers remain visible while scrolling

### Dark Mode

- Automatic detection of system preference
- Manual toggle for user preference
- Persistent settings between sessions

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

## Running the Application

### Backend

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

### Frontend

1. Make sure you have Node.js and npm installed
2. Navigate to the UI directory:
   ```bash
   cd ui
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

The UI will be available at http://localhost:3000 (or another port if 3000 is in use).

## Configuration

- The service timeout is set to 10 seconds per request
- Maximum depth is limited to 4 levels
- The service runs on port 8080 by default

## Error Handling

The service handles various types of errors including:

- Invalid URLs
- Network timeouts
- Invalid depth values
- HTTP errors

## Browser Compatibility

The UI has been tested and works on:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT License
