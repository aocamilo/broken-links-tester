package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/aocamilo/broken-links-tester/internal/models"
	"github.com/aocamilo/broken-links-tester/pkg/crawler"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
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
	
	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		
		c.Next()
	})

	s := &Server{
		router:  r,
		crawler: c,
	}

	s.registerRoutes()
	return s, nil
}

// Close releases resources
func (s *Server) Close() error {
	return s.crawler.Close()
}

func (s *Server) registerRoutes() {
	// Print server startup information for debugging
	fmt.Println("Starting server with the following configuration:")
	fmt.Printf("Working directory: %s\n", func() string {
		dir, err := os.Getwd()
		if err != nil {
			return "unknown (error getting working directory)"
		}
		return dir
	}())
	
	// Check if UI directory exists
	uiDir := "./ui/dist"
	if _, err := os.Stat(uiDir); err != nil {
		fmt.Printf("WARNING: UI directory not found at %s: %v\n", uiDir, err)
	} else {
		fmt.Printf("UI directory found at %s\n", uiDir)
		// List files in UI directory
		if files, err := os.ReadDir(uiDir); err != nil {
			fmt.Printf("Error reading UI directory: %v\n", err)
		} else {
			fmt.Printf("UI directory contains %d files/directories\n", len(files))
			for i, file := range files {
				if i < 10 { // Only print first 10 files to avoid excessive output
					fmt.Printf("  - %s (is dir: %t)\n", file.Name(), file.IsDir())
				}
			}
			if len(files) > 10 {
				fmt.Printf("  ... and %d more\n", len(files)-10)
			}
		}
	}
	
	// Create an API group with the /api prefix
	api := s.router.Group("/api")
	
	// Health check for Railway
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})
	
	// Swagger documentation - under /api/docs
	api.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	
	// API routes
	api.POST("/check-links", s.checkLinks)
	
	// Serve static files from the UI build directory if it exists
	if _, err := os.Stat(uiDir); err == nil {
		// Handle static assets
		s.router.Static("/assets", filepath.Join(uiDir, "assets"))
		
		// Serve index.html for any other route
		s.router.NoRoute(func(c *gin.Context) {
			// Don't serve UI for API routes that don't exist
			if strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.JSON(http.StatusNotFound, gin.H{"error": "API endpoint not found"})
				return
			}
			
			indexPath := filepath.Join(uiDir, "index.html")
			if _, err := os.Stat(indexPath); err != nil {
				fmt.Printf("WARNING: index.html not found at %s: %v\n", indexPath, err)
				c.String(http.StatusOK, "UI server is running at port 3000, please access it directly")
				return
			}
			
			c.File(indexPath)
		})
	}
}

// Run starts the server
func (s *Server) Run(addr string) error {
	defer s.Close()
	return s.router.Run(addr)
}

// checkLinks godoc
// @Summary      Check links on a website
// @Description  Tests all links on a website for broken links
// @Tags         links
// @Accept       json
// @Produce      json
// @Param        request  body      models.CheckRequest  true  "URL and depth parameters"
// @Success      200      {array}   models.LinkStatus
// @Failure      400      {object}  map[string]string
// @Failure      500      {object}  map[string]string
// @Router       /check-links [post]
func (s *Server) checkLinks(c *gin.Context) {
	var req models.CheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	results := s.crawler.CheckLinks(req.URL, req.Depth)
	c.JSON(http.StatusOK, results)
} 