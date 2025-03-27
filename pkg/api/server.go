package api

import (
	"net/http"

	"github.com/aocamilo/broken-links-tester/internal/models"
	"github.com/aocamilo/broken-links-tester/pkg/crawler"

	"github.com/gin-gonic/gin"
)

type Server struct {
	router  *gin.Engine
	crawler *crawler.Crawler
}

func NewServer() (*Server, error) {
	c, err := crawler.NewCrawler()
	if err != nil {
		return nil, err
	}

	server := &Server{
		router:  gin.Default(),
		crawler: c,
	}
	server.setupRoutes()
	return server, nil
}

func (s *Server) Close() error {
	return s.crawler.Close()
}

func (s *Server) setupRoutes() {
	s.router.POST("/check-links", s.handleCheckLinks)
}

func (s *Server) Run(addr string) error {
	defer s.Close()
	return s.router.Run(addr)
}

func (s *Server) handleCheckLinks(c *gin.Context) {
	var req models.CheckRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	results := s.crawler.CheckLinks(req.URL, req.Depth)
	c.JSON(http.StatusOK, gin.H{
		"results": results,
		"total": len(results),
		"url": req.URL,
		"depth": req.Depth,
	})
} 