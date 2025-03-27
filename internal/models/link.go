package models

import "time"

// LinkStatus represents the status of a checked link
type LinkStatus struct {
	URL           string        `json:"url"`
	StatusCode    int           `json:"status_code"`
	Error         string        `json:"error,omitempty"`
	ResponseTime  time.Duration `json:"response_time"`
	Depth         int          `json:"depth"`
	ParentURL     string       `json:"parent_url,omitempty"`
	IsWorking     bool         `json:"is_working"`
	LastChecked   time.Time    `json:"last_checked"`
}

// CheckRequest represents the incoming request to check links
type CheckRequest struct {
	URL   string `json:"url" binding:"required,url"`
	Depth int    `json:"depth" binding:"min=0,max=4"`
} 