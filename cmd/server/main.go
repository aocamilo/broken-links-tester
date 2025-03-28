package main

import (
	"log"
	"os"

	"github.com/aocamilo/broken-links-tester/pkg/api"
)

func main() {
	server, err := api.NewServer()
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	// Use PORT environment variable if available (for Railway)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := server.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 