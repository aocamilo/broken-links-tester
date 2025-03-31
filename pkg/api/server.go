package api

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/aocamilo/broken-links-tester/internal/models"
	"github.com/aocamilo/broken-links-tester/pkg/crawler"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Server represents the HTTP server
type Server struct {
	router  *gin.Engine
	crawler *crawler.Crawler
}

// NewServer creates a new server instance
// @title           Broken Links Tester API
// @version         1.0
// @description     API for testing broken links on websites
// @host            localhost:8080
// @BasePath        /api
func NewServer() (*Server, error) {
	c, err := crawler.NewCrawler()
	if err != nil {
		return nil, err
	}

	r := gin.Default()
	r.Use(cors.Default())

	s := &Server{
		router:  r,
		crawler: c,
	}

	return s, nil
}

// Close releases resources
func (s *Server) Close() error {
	return s.crawler.Close()
}

// Start starts the server
func (s *Server) Run(port string) error {
	// Setup routes first
	s.setupRoutes()

	// Create a channel to listen for signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start the server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", port)
		if err := s.router.Run(":" + port); err != nil {
			log.Printf("Server error: %v", err)
		}
	}()

	// Wait for a signal
	<-sigChan

	// Graceful shutdown
	log.Println("Shutting down server...")
	return nil
}

func (s *Server) setupRoutes() {
	// Log current working directory and check if UI directory exists
	cwd, err := os.Getwd()
	if err != nil {
		log.Printf("Failed to get current working directory: %v", err)
	} else {
		log.Printf("Current working directory: %s", cwd)
	}

	// Check if UI directory exists
	uiDir := "./ui/dist"
	if _, err := os.Stat(uiDir); os.IsNotExist(err) {
		log.Printf("UI directory %s not found, trying alternative path", uiDir)
		// Try alternative path
		uiDir = "./ui/.output/public"
		if _, err := os.Stat(uiDir); os.IsNotExist(err) {
			log.Printf("Alternative UI directory %s not found", uiDir)
		} else {
			log.Printf("Found alternative UI directory at %s", uiDir)
		}
	} else {
		log.Printf("Found UI directory at %s", uiDir)
	}

	// List files in UI directory for debugging
	listDirectoryFiles(uiDir, 0, 5) // List up to 5 files for debugging

	// API group
	api := s.router.Group("/api")
	{
		// Health check endpoint
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "healthy",
			})
		})

		// Check links endpoint
		api.POST("/check-links", s.checkLinks)

		// Swagger docs
		api.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerfiles.Handler))
	}

	// Serve static files from the UI build directory
	s.router.Static("/assets", filepath.Join(uiDir, "assets"))
	
	// List subdirectories in UI dir and serve them as static paths
	if uiDirExists, _ := pathExists(uiDir); uiDirExists {
		entries, err := os.ReadDir(uiDir)
		if err == nil {
			for _, entry := range entries {
				if entry.IsDir() && entry.Name() != "assets" {
					dirPath := filepath.Join(uiDir, entry.Name())
					s.router.Static("/"+entry.Name(), dirPath)
					log.Printf("Serving directory: /%s from %s", entry.Name(), dirPath)
				}
			}
		}
	}

	// Fallback to index.html for any non-API routes
	s.router.NoRoute(func(c *gin.Context) {
		// Skip API routes
		if strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.Next()
			return
		}

		// Try to serve index.html
		indexPath := filepath.Join(uiDir, "index.html")
		if _, err := os.Stat(indexPath); os.IsNotExist(err) {
			// If not found in main dir, search in subdirectories
			found := false
			if uiDirExists, _ := pathExists(uiDir); uiDirExists {
				err := filepath.WalkDir(uiDir, func(path string, d fs.DirEntry, err error) error {
					if err != nil {
						return err
					}
					if !d.IsDir() && d.Name() == "index.html" {
						indexPath = path
						found = true
						return filepath.SkipDir // Stop walking once found
					}
					return nil
				})
				if err != nil {
					log.Printf("Error searching for index.html: %v", err)
				}
			}
			
			if !found {
				log.Printf("index.html not found in UI directory or subdirectories")
				c.String(http.StatusNotFound, "UI not found")
				return
			}
		}

		log.Printf("Serving index.html from %s", indexPath)
		c.File(indexPath)
	})
}

// pathExists checks if a path exists
func pathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

// listDirectoryFiles lists files in a directory recursively with a limit
func listDirectoryFiles(dirPath string, depth, maxFiles int) {
	if depth > 3 || maxFiles <= 0 { // Limit depth to avoid too much recursion
		return
	}

	entries, err := os.ReadDir(dirPath)
	if err != nil {
		log.Printf("Error reading directory %s: %v", dirPath, err)
		return
	}

	fileCount := 0
	for _, entry := range entries {
		entryPath := filepath.Join(dirPath, entry.Name())
		if entry.IsDir() {
			log.Printf("%s[DIR] %s", strings.Repeat("  ", depth), entryPath)
			listDirectoryFiles(entryPath, depth+1, maxFiles)
		} else {
			log.Printf("%s[FILE] %s", strings.Repeat("  ", depth), entryPath)
			fileCount++
			if fileCount >= maxFiles {
				log.Printf("%s... (more files)", strings.Repeat("  ", depth))
				break
			}
		}
	}
}

// @Summary Check for broken links on a website
// @Description Checks for broken links on a website and returns a result
// @Accept json
// @Produce json
// @Param request body models.CheckRequest true "Check links request"
// @Success 200 {object} []models.LinkStatus
// @Router /check-links [post]
func (s *Server) checkLinks(c *gin.Context) {
	var req models.CheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// For debugging
	log.Printf("Received request to check links for URL: %s", req.URL)

	// Validate URL
	if req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "URL is required"})
		return
	}

	results := s.crawler.CheckLinks(req.URL, req.Depth)
	c.JSON(http.StatusOK, results)
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
} 