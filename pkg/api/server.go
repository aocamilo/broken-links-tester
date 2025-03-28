package api

import (
	"net/http"

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
// @BasePath        /
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
	// Swagger documentation
	s.router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	
	// API routes
	s.router.POST("/check-links", s.checkLinks)
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