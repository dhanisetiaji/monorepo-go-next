package main

import (
	"backend/config"
	"backend/controllers"
	"backend/middleware"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type Response struct {
	Message string `json:"message"`
	Status  string `json:"status"`
}

type HealthResponse struct {
	Status string `json:"status"`
	Uptime string `json:"uptime"`
}

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Set Gin mode based on environment
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.DebugMode)
	}

	// Connect to database
	config.ConnectDB()

	r := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{"http://localhost:3000"} // Next.js dev server
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(corsConfig))

	// Initialize controllers
	authController := &controllers.AuthController{}
	userController := &controllers.UserController{}
	roleController := &controllers.RoleController{}

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, HealthResponse{
			Status: "healthy",
			Uptime: "running",
		})
	})

	// Public routes (no authentication required)
	public := r.Group("/api/v1")
	{
		// Authentication routes
		public.POST("/auth/register", authController.Register)
		public.POST("/auth/login", authController.Login)
		public.POST("/auth/refresh", authController.RefreshToken)

		// Public hello endpoint (for testing)
		public.GET("/hello", func(c *gin.Context) {
			c.JSON(http.StatusOK, Response{
				Message: "Hello from Go backend with JWT Auth!",
				Status:  "success",
			})
		})
	}

	// Protected routes (authentication required)
	protected := r.Group("/api/v1")
	protected.Use(middleware.AuthMiddleware())
	{
		// Auth routes
		protected.GET("/auth/me", authController.Me)
		protected.POST("/auth/logout", authController.Logout)
		protected.POST("/auth/logout-all", authController.LogoutAll)

		// User management routes
		users := protected.Group("/users")
		{
			users.GET("", middleware.RequirePermission("users", "read"), userController.GetUsers)
			users.GET("/:id", middleware.RequirePermission("users", "read"), userController.GetUser)
			users.POST("", middleware.RequirePermission("users", "write"), userController.CreateUser)
			users.PUT("/:id", middleware.RequirePermission("users", "write"), userController.UpdateUser)
			users.DELETE("/:id", middleware.RequirePermission("users", "delete"), userController.DeleteUser)
			users.POST("/:id/roles", middleware.RequireRole("admin"), userController.AssignRoles)
		}

		// Role management routes
		roles := protected.Group("/roles")
		{
			roles.GET("", middleware.RequirePermission("roles", "read"), roleController.GetRoles)
			roles.GET("/:id", middleware.RequirePermission("roles", "read"), roleController.GetRole)
			roles.POST("", middleware.RequirePermission("roles", "write"), roleController.CreateRole)
			roles.PUT("/:id", middleware.RequirePermission("roles", "write"), roleController.UpdateRole)
			roles.DELETE("/:id", middleware.RequirePermission("roles", "delete"), roleController.DeleteRole)
		}

		// Permission routes
		protected.GET("/permissions", middleware.RequirePermission("permissions", "read"), roleController.GetPermissions)

		// Legacy routes for backward compatibility
		protected.GET("/users-legacy", func(c *gin.Context) {
			users := []map[string]interface{}{
				{"id": 1, "name": "John Doe", "email": "john@example.com", "role": "user"},
				{"id": 2, "name": "Jane Smith", "email": "jane@example.com", "role": "admin"},
			}
			c.JSON(http.StatusOK, gin.H{
				"data":   users,
				"status": "success",
			})
		})
	}

	// Get port from environment or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
