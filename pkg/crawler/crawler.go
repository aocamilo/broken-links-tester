package crawler

import (
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

func NewCrawler() (*Crawler, error) {
	// Try to install Playwright but don't fail if it can't be installed
	err := playwright.Install()
	if err != nil {
		log.Printf("WARNING: Could not install Playwright driver: %v", err)
		log.Printf("Will operate in fallback mode without browser automation")
		
		// Create a simple HTTP-based crawler
		return &Crawler{
			pw:      nil,
			browser: nil,
		}, nil
	}

	pw, err := playwright.Run()
	if err != nil {
		log.Printf("WARNING: Could not run Playwright: %v", err)
		log.Printf("Will operate in fallback mode without browser automation")
		
		// Create a simple HTTP-based crawler
		return &Crawler{
			pw:      nil,
			browser: nil,
		}, nil
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
		log.Printf("WARNING: All browser launch attempts failed. Using fallback HTTP mode.")
		
		// Create a simple HTTP-based crawler
		return &Crawler{
			pw:      nil,
			browser: nil,
		}, nil
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
	c.visited = sync.Map{}
	c.results = []models.LinkStatus{}
	
	// Start with the base URL at depth -1
	c.wg.Add(1)
	go c.crawl(baseURL, "", maxDepth, -1)
	
	// Wait for all crawling goroutines to finish
	c.wg.Wait()
	return c.results
}

func (c *Crawler) crawl(currentURL, parentURL string, maxDepth, currentDepth int) {
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
	
	// If browser is not available, use HTTP client instead
	if c.browser == nil {
		c.crawlWithHTTP(currentURL, parentURL, currentDepth, maxDepth, start)
		return
	}
	
	// Create a new context for this page
	context, err := c.browser.NewContext()
	if err != nil {
		log.Printf("Error creating context for %s: %v\n", currentURL, err)
		// Fallback to HTTP
		c.crawlWithHTTP(currentURL, parentURL, currentDepth, maxDepth, start)
		return
	}
	defer context.Close()

	// Create a new page
	page, err := context.NewPage()
	if err != nil {
		log.Printf("Error creating page for %s: %v\n", currentURL, err)
		// Fallback to HTTP
		c.crawlWithHTTP(currentURL, parentURL, currentDepth, maxDepth, start)
		return
	}

	// Navigate to the page and wait for network idle
	resp, err := page.Goto(currentURL, playwright.PageGotoOptions{
		WaitUntil: playwright.WaitUntilStateNetworkidle,
		Timeout:   playwright.Float(30000), // 30 seconds timeout
	})
	if err != nil {
		log.Printf("Error navigating to %s: %v\n", currentURL, err)
		c.recordError(currentURL, parentURL, currentDepth, err, time.Since(start))
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
			go c.crawl(link, currentURL, maxDepth, currentDepth+1)
		}
	}

	c.mu.Lock()
	c.results = append(c.results, status)
	c.mu.Unlock()
}

// Add HTTP fallback method
func (c *Crawler) crawlWithHTTP(currentURL, parentURL string, currentDepth, maxDepth int, start time.Time) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	
	// Create request
	req, err := c.createRequest(currentURL)
	if err != nil {
		c.recordError(currentURL, parentURL, currentDepth, err, time.Since(start))
		return
	}
	
	// Send request
	resp, err := client.Do(req)
	if err != nil {
		c.recordError(currentURL, parentURL, currentDepth, err, time.Since(start))
		return
	}
	defer resp.Body.Close()
	
	responseTime := time.Since(start)
	
	// Create status
	status := models.LinkStatus{
		URL:          currentURL,
		ParentURL:    parentURL,
		Depth:        currentDepth + 1,
		ResponseTime: responseTime.String(),
		LastChecked:  time.Now(),
		StatusCode:   resp.StatusCode,
		IsWorking:    resp.StatusCode >= 200 && resp.StatusCode < 400,
	}
	
	// Extract links if it's HTML
	var links []string
	contentType := resp.Header.Get("Content-Type")
	if strings.Contains(contentType, "text/html") {
		// Parse HTML and get links
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("Error reading response body: %v", err)
		} else {
			links = c.extractLinks(strings.NewReader(string(bodyBytes)), currentURL)
		}
	}
	
	log.Printf("Found %d links in %s using HTTP client\n", len(links), currentURL)
	
	// Only crawl links if we haven't reached max depth
	if currentDepth < maxDepth-1 {
		// Launch a new goroutine for each discovered link
		for _, link := range links {
			log.Printf("Found link: %s in page %s at depth %d\n", link, currentURL, currentDepth+1)
			c.wg.Add(1)
			go c.crawl(link, currentURL, maxDepth, currentDepth+1)
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