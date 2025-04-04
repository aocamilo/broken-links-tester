package crawler

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/aocamilo/broken-links-tester/internal/models"
	"github.com/playwright-community/playwright-go"

	"golang.org/x/net/html"
)

type Crawler struct {
	pw      *playwright.Playwright
	browser playwright.Browser
	visited sync.Map
	results []models.LinkStatus
	mu      sync.Mutex
	wg      sync.WaitGroup
}

// BrowserOptions contains options for browser launch
type BrowserOptions struct {
	Timeout     time.Duration
	MaxRetries  int
	RetryDelay  time.Duration
	MaxConcurrent int
}

// DefaultBrowserOptions returns default browser options
func DefaultBrowserOptions() BrowserOptions {
	return BrowserOptions{
		Timeout:     60 * time.Second,  // 60 seconds timeout
		MaxRetries:  3,                 // 3 retries
		RetryDelay:  2 * time.Second,   // 2 seconds between retries
		MaxConcurrent: 5,               // Max 5 concurrent requests
	}
}

func NewCrawler() (*Crawler, error) {
	// Install Playwright
	err := playwright.Install()
	if err != nil {
		return nil, fmt.Errorf("failed to install Playwright driver: %v", err)
	}

	pw, err := playwright.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to run Playwright: %v", err)
	}

	// Try with various browser options
	browserOpts := []playwright.BrowserTypeLaunchOptions{
		// Default options
		{
			Headless: playwright.Bool(true),
		},
		// No sandbox
		{
			Headless: playwright.Bool(true),
			Args:     []string{"--no-sandbox", "--disable-setuid-sandbox"},
		},
		// No sandbox + other options
		{
			Headless: playwright.Bool(true),
			Args:     []string{"--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"},
		},
	}

	var browser playwright.Browser
	var launchErr error
	
	for _, opts := range browserOpts {
		browser, launchErr = pw.Chromium.Launch(opts)
		if launchErr == nil {
			break
		}
		log.Printf("Failed to launch browser with options %+v: %v", opts, launchErr)
	}
	
	if launchErr != nil {
		pw.Stop()
		return nil, fmt.Errorf("all browser launch attempts failed: %v", launchErr)
	}

	return &Crawler{
		pw:      pw,
		browser: browser,
	}, nil
}

func (c *Crawler) Close() error {
	if c.browser != nil {
		if err := c.browser.Close(); err != nil {
			return err
		}
	}
	if c.pw != nil {
		return c.pw.Stop()
	}
	return nil
}

func (c *Crawler) CheckLinks(baseURL string, maxDepth int) []models.LinkStatus {
	opts := DefaultBrowserOptions()
	c.visited = sync.Map{}
	c.results = []models.LinkStatus{}
	
	// Create a semaphore to limit concurrent requests
	sem := make(chan struct{}, opts.MaxConcurrent)
	
	// Start with the base URL at depth -1
	c.wg.Add(1)
	go c.crawl(baseURL, "", maxDepth, -1, opts, sem)
	
	// Wait for all crawling goroutines to finish
	c.wg.Wait()
	return c.results
}

func (c *Crawler) crawl(currentURL, parentURL string, maxDepth, currentDepth int, opts BrowserOptions, sem chan struct{}) {
	defer c.wg.Done()

	// Check depth before doing anything else
	if currentDepth >= maxDepth {
		return
	}

	// Check if URL was already visited
	if _, visited := c.visited.LoadOrStore(currentURL, true); visited {
		return
	}

	log.Printf("Crawling URL: %s at depth %d\n", currentURL, currentDepth)

	start := time.Now()
	
	// Acquire semaphore
	sem <- struct{}{}
	defer func() { <-sem }() // Release semaphore when done

	// Create a new context for this page
	context, err := c.browser.NewContext()
	if err != nil {
		log.Printf("Error creating context for %s: %v\n", currentURL, err)
		c.recordError(currentURL, parentURL, currentDepth, err, time.Since(start))
		return
	}
	defer context.Close()

	// Create a new page
	page, err := context.NewPage()
	if err != nil {
		log.Printf("Error creating page for %s: %v\n", currentURL, err)
		c.recordError(currentURL, parentURL, currentDepth, err, time.Since(start))
		return
	}

	// Try to navigate with retries
	var resp playwright.Response
	var navErr error
	for i := 0; i < opts.MaxRetries; i++ {
		resp, navErr = page.Goto(currentURL, playwright.PageGotoOptions{
			WaitUntil: playwright.WaitUntilStateNetworkidle,
			Timeout:   playwright.Float(float64(opts.Timeout.Milliseconds())),
		})
		if navErr == nil {
			break
		}
		log.Printf("Attempt %d failed for %s: %v\n", i+1, currentURL, navErr)
		if i < opts.MaxRetries-1 {
			time.Sleep(opts.RetryDelay)
		}
	}

	if navErr != nil {
		log.Printf("All attempts failed for %s: %v\n", currentURL, navErr)
		c.recordError(currentURL, parentURL, currentDepth, navErr, time.Since(start))
		return
	}

	responseTime := time.Since(start)

	status := models.LinkStatus{
		URL:          currentURL,
		ParentURL:    parentURL,
		Depth:        currentDepth + 1,
		ResponseTime: responseTime.String(),
		LastChecked:  time.Now(),
		StatusCode:   resp.Status(),
		IsWorking:    resp.Status() >= 200 && resp.Status() < 400,
	}

	// Extract links using JavaScript
	links, err := c.extractLinksFromPage(page)
	if err != nil {
		log.Printf("Error extracting links from %s: %v\n", currentURL, err)
	}

	log.Printf("Found %d links in %s\n", len(links), currentURL)
	
	// Only crawl links if we haven't reached max depth
	if currentDepth < maxDepth-1 {
		// Launch a new goroutine for each discovered link
		for _, link := range links {
			log.Printf("Found link: %s in page %s at depth %d\n", link, currentURL, currentDepth+1)
			c.wg.Add(1)
			go c.crawl(link, currentURL, maxDepth, currentDepth+1, opts, sem)
		}
	}

	c.mu.Lock()
	c.results = append(c.results, status)
	c.mu.Unlock()
}

func (c *Crawler) extractLinksFromPage(page playwright.Page) ([]string, error) {
	// Execute JavaScript to get all links
	links, err := page.Evaluate(`() => {
		const links = new Set();
		document.querySelectorAll('a[href]').forEach(el => {
			const href = el.href;
			if (href && !href.startsWith('javascript:') && !href.startsWith('#') && 
				!href.startsWith('mailto:') && !href.startsWith('tel:')) {
				links.add(href);
			}
		});
		return Array.from(links);
	}`)
	if err != nil {
		return nil, err
	}

	// Convert the interface{} to []string
	var result []string
	if linksArr, ok := links.([]interface{}); ok {
		for _, link := range linksArr {
			if strLink, ok := link.(string); ok {
				result = append(result, strLink)
			}
		}
	}

	return result, nil
}

func (c *Crawler) recordError(currentURL, parentURL string, depth int, err error, responseTime time.Duration) {
	status := models.LinkStatus{
		URL:          currentURL,
		ParentURL:    parentURL,
		Depth:        depth,
		ResponseTime: responseTime.String(),
		LastChecked:  time.Now(),
		Error:        err.Error(),
		IsWorking:    false,
	}

	c.mu.Lock()
	c.results = append(c.results, status)
	c.mu.Unlock()
}

func (c *Crawler) createRequest(url string) (*http.Request, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	
	// Add headers to mimic a browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8")
	req.Header.Set("Accept-Language", "en-US,en;q=0.5")
	req.Header.Set("Connection", "keep-alive")
	req.Header.Set("Upgrade-Insecure-Requests", "1")
	
	return req, nil
}

func (c *Crawler) extractLinksFromNode(body io.Reader, baseURL string) []string {
	links := make([]string, 0)
	doc, err := html.Parse(body)
	if err != nil {
		log.Printf("Error parsing HTML: %v\n", err)
		return links
	}

	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode && (n.Data == "a" || n.Data == "link") {
			for _, attr := range n.Attr {
				if attr.Key == "href" {
					link := attr.Val
					if strings.HasPrefix(link, "#") || link == "" || strings.HasPrefix(link, "mailto:") || strings.HasPrefix(link, "tel:") {
						continue
					}

					base, err := url.Parse(baseURL)
					if err != nil {
						continue
					}

					absoluteURL, err := resolveURL(base, link)
					if err != nil {
						continue
					}

					if strings.HasPrefix(absoluteURL, "http") {
						links = append(links, absoluteURL)
					}
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(doc)
	return links
}

func (c *Crawler) extractLinks(body io.Reader, baseURL string) []string {
	links := make([]string, 0)
	z := html.NewTokenizer(body)
	base, _ := url.Parse(baseURL)

	for {
		tt := z.Next()
		switch tt {
		case html.ErrorToken:
			return links
		case html.StartTagToken, html.SelfClosingTagToken:
			token := z.Token()
			if token.Data == "a" || token.Data == "link" {
				for _, attr := range token.Attr {
					if attr.Key == "href" {
						link := attr.Val
						if strings.HasPrefix(link, "#") || link == "" || strings.HasPrefix(link, "mailto:") || strings.HasPrefix(link, "tel:") {
							continue
						}
						
						absoluteURL, err := resolveURL(base, link)
						if err != nil {
							continue
						}
						
						if strings.HasPrefix(absoluteURL, "http") {
							links = append(links, absoluteURL)
						}
					}
				}
			}
		}
	}
}

func resolveURL(base *url.URL, ref string) (string, error) {
	refURL, err := url.Parse(ref)
	if err != nil {
		return "", err
	}
	resolvedURL := base.ResolveReference(refURL)
	return resolvedURL.String(), nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
} 