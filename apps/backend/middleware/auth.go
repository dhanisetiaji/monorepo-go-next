package middleware

import (
	"backend/config"
	"backend/models"
	"backend/utils"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		tokenString := getTokenFromRequest(c)
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
			c.Abort()
			return
		}

		// Validate token using utils
		claims, err := utils.ValidateAccessToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Get user from database
		var user models.User
		if err := config.DB.Preload("Roles.Permissions").Where("id = ?", claims.UserID).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		if !user.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User account is disabled"})
			c.Abort()
			return
		}

		// Store user in context
		c.Set("user", user)
		c.Set("user_id", user.ID)
		c.Next()
	})
}

// RequirePermission checks if user has specific permission
func RequirePermission(resource, action string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		u := user.(models.User)
		if !hasPermission(u, resource, action) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	})
}

// RequireRole checks if user has specific role
func RequireRole(roleName string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		u := user.(models.User)
		if !hasRole(u, roleName) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient role"})
			c.Abort()
			return
		}

		c.Next()
	})
}

// RequireAnyRole checks if user has any of the specified roles
func RequireAnyRole(roleNames ...string) gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		u := user.(models.User)
		for _, roleName := range roleNames {
			if hasRole(u, roleName) {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient role"})
		c.Abort()
	})
}

// Helper functions
func getTokenFromRequest(c *gin.Context) string {
	// Check Authorization header
	bearerToken := c.GetHeader("Authorization")
	if len(strings.Split(bearerToken, " ")) == 2 {
		return strings.Split(bearerToken, " ")[1]
	}

	// Check query parameter
	return c.Query("token")
}

func hasPermission(user models.User, resource, action string) bool {
	for _, role := range user.Roles {
		for _, permission := range role.Permissions {
			if permission.Resource == resource && permission.Action == action {
				return true
			}
		}
	}
	return false
}

func hasRole(user models.User, roleName string) bool {
	for _, role := range user.Roles {
		if role.Name == roleName {
			return true
		}
	}
	return false
}
