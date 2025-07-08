package middleware

import (
	"backend/config"
	"backend/models"
	"crypto/subtle"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// SecurityConfig holds security configuration
type SecurityConfig struct {
	RateLimitRequests int
	RateLimitWindow   time.Duration
	AllowedOrigins    []string
	AllowedIPs        []string
	MaxRequestSize    int64
}

// RequestLog stores request information for security monitoring
type RequestLog struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID    uuid.UUID `json:"user_id,omitempty" gorm:"type:uuid"`
	IP        string    `json:"ip" gorm:"not null"`
	Method    string    `json:"method" gorm:"not null"`
	Path      string    `json:"path" gorm:"not null"`
	UserAgent string    `json:"user_agent"`
	Status    int       `json:"status"`
	Duration  int64     `json:"duration"` // in milliseconds
	CreatedAt time.Time `json:"created_at"`
}

// FailedLogin tracks failed login attempts
type FailedLogin struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	IP        string    `json:"ip" gorm:"not null"`
	Username  string    `json:"username"`
	UserAgent string    `json:"user_agent"`
	Attempts  int       `json:"attempts" gorm:"default:1"`
	LastTry   time.Time `json:"last_try"`
	CreatedAt time.Time `json:"created_at"`
}

var (
	rateLimitStore = make(map[string][]time.Time)
	securityConfig = SecurityConfig{
		RateLimitRequests: 100,
		RateLimitWindow:   time.Hour,
		MaxRequestSize:    10 * 1024 * 1024, // 10MB
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://yourdomain.com",
		},
	}
)

// SecurityMiddleware provides comprehensive security features
func SecurityMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		start := time.Now()

		// Security headers
		setSecurityHeaders(c)

		// Rate limiting
		if !checkRateLimit(c) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		// Content length check
		if c.Request.ContentLength > securityConfig.MaxRequestSize {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "Request too large"})
			c.Abort()
			return
		}

		// IP whitelist check (if configured)
		if len(securityConfig.AllowedIPs) > 0 && !isAllowedIP(c.ClientIP()) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied from this IP"})
			c.Abort()
			return
		}

		c.Next()

		// Log request after processing
		logRequest(c, start)
	})
}

// setSecurityHeaders adds security headers to response
func setSecurityHeaders(c *gin.Context) {
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("X-Frame-Options", "DENY")
	c.Header("X-XSS-Protection", "1; mode=block")
	c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	c.Header("Content-Security-Policy", "default-src 'self'")
	c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
	c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
}

// checkRateLimit implements simple in-memory rate limiting
func checkRateLimit(c *gin.Context) bool {
	clientIP := c.ClientIP()
	now := time.Now()

	// Clean old entries
	if requests, exists := rateLimitStore[clientIP]; exists {
		var validRequests []time.Time
		for _, reqTime := range requests {
			if now.Sub(reqTime) < securityConfig.RateLimitWindow {
				validRequests = append(validRequests, reqTime)
			}
		}
		rateLimitStore[clientIP] = validRequests
	}

	// Check limit
	if len(rateLimitStore[clientIP]) >= securityConfig.RateLimitRequests {
		return false
	}

	// Add current request
	rateLimitStore[clientIP] = append(rateLimitStore[clientIP], now)
	return true
}

// isAllowedIP checks if IP is in whitelist
func isAllowedIP(ip string) bool {
	for _, allowedIP := range securityConfig.AllowedIPs {
		if ip == allowedIP {
			return true
		}
	}
	return false
}

// logRequest logs request for security monitoring
func logRequest(c *gin.Context, start time.Time) {
	duration := time.Since(start).Milliseconds()

	var userID uuid.UUID
	if user, exists := c.Get("user"); exists {
		userObj := user.(models.User)
		userID = userObj.ID
	}

	requestLog := RequestLog{
		UserID:    userID,
		IP:        c.ClientIP(),
		Method:    c.Request.Method,
		Path:      c.Request.URL.Path,
		UserAgent: c.Request.UserAgent(),
		Status:    c.Writer.Status(),
		Duration:  duration,
		CreatedAt: time.Now(),
	}

	// Log to database (async to not block request)
	go func() {
		config.DB.Create(&requestLog)
	}()
}

// LogFailedLogin logs failed login attempts for security monitoring
func LogFailedLogin(ip, username, userAgent string) {
	var failedLogin FailedLogin

	// Check if there's an existing record for this IP
	if err := config.DB.Where("ip = ?", ip).First(&failedLogin).Error; err != nil {
		// Create new record
		failedLogin = FailedLogin{
			IP:        ip,
			Username:  username,
			UserAgent: userAgent,
			Attempts:  1,
			LastTry:   time.Now(),
			CreatedAt: time.Now(),
		}
		config.DB.Create(&failedLogin)
	} else {
		// Update existing record
		failedLogin.Username = username
		failedLogin.Attempts++
		failedLogin.LastTry = time.Now()
		config.DB.Save(&failedLogin)
	}

	// If too many attempts, consider additional security measures
	if failedLogin.Attempts >= 5 {
		// Could implement IP blocking, admin notification, etc.
		// For now, just log the event
		config.DB.Create(&RequestLog{
			IP:        ip,
			Method:    "SECURITY",
			Path:      "/security/suspicious-activity",
			UserAgent: userAgent,
			Status:    429,
			CreatedAt: time.Now(),
		})
	}
}

// AdminOnlyMiddleware ensures only admin users can access certain endpoints
func AdminOnlyMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		u := user.(models.User)
		if !hasRole(u, "admin") {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		c.Next()
	})
}

// SecureCompare performs constant-time string comparison
func SecureCompare(a, b string) bool {
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// ValidateAPIKey middleware for API key authentication
func ValidateAPIKey() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			apiKey = c.Query("api_key")
		}

		if apiKey == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "API key required"})
			c.Abort()
			return
		}

		// Validate API key against database or configured keys
		// This is a simplified example - in production, store hashed keys in database
		validAPIKey := getEnvOrDefault("API_KEY", "your-secure-api-key")
		if !SecureCompare(apiKey, validAPIKey) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		c.Next()
	})
}

// CSRFMiddleware provides CSRF protection
func CSRFMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Skip CSRF for GET, HEAD, OPTIONS
		if c.Request.Method == "GET" || c.Request.Method == "HEAD" || c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		token := c.GetHeader("X-CSRF-Token")
		if token == "" {
			token = c.PostForm("csrf_token")
		}

		// In a real implementation, you'd validate the CSRF token
		// For now, just check if it exists
		if token == "" {
			c.JSON(http.StatusForbidden, gin.H{"error": "CSRF token required"})
			c.Abort()
			return
		}

		c.Next()
	})
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return defaultValue
}
