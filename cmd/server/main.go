package main

import (
	"log"

	"github.com/aocamilo/broken-links-tester/pkg/api"
)

func main() {
	server, err := api.NewServer()
	if err != nil {
		log.Fatalf("Failed to create server: %v", err)
	}

	if err := server.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
} 