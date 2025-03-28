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
POST /api/check-links
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

1. Make sure you have Go 1.24.1 or later installed
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

## Deployment

### Railway

The application is configured to be easily deployed on [Railway](https://railway.app):

1. Connect your repository to Railway
2. Create a new project from the repository
3. Railway will automatically detect the configuration and build the application

The application uses the following configuration:

- The UI is built and served by the Go backend
- API routes are prefixed with `/api`
- Static UI assets are served from the `/ui/dist` directory
- A health check endpoint is available at `/api/health`

### Docker

You can also build and run the application using Docker:

1. Build the Docker image:
   ```bash
   docker build -t broken-links-tester .
   ```
2. Run the container:

   ```bash
   docker run -p 8080:8080 -p 3000:3000 broken-links-tester
   ```

   If the default ports are already in use, you can map to different ports:

   ```bash
   docker run -p 8090:8080 -p 3001:3000 broken-links-tester
   ```

The container runs two services:

- The Go backend API server on port 8080
- The TanStack Start frontend server on port 3000

You can access the application at http://localhost:3000 (or http://localhost:3001 if you used alternative ports), which will communicate with the API at http://localhost:8080 (or http://localhost:8090).

#### Container Architecture

The Docker container uses a multi-service approach:

- **supervisord** manages both the Go and Node.js processes
- The Go backend serves the API endpoints with the `/api` prefix
- The TanStack Start server handles server-side rendering for the React UI
- Communication between the frontend and backend happens within the container

This architecture allows for a complete full-stack application to be packaged in a single container, simplifying deployment while maintaining the benefits of both the Go backend (efficient link crawling) and the React frontend (rich user interface).

## Configuration

- The service timeout is set to 10 seconds per request
- Maximum depth is limited to 4 levels
- The Go API server runs on the port specified by the PORT environment variable (defaults to 8080)
- The TanStack Start server runs on the port specified by the UI_PORT environment variable (defaults to 3000)

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
