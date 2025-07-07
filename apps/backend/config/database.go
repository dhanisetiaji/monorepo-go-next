package config

import (
	"fmt"
	"log"
	"os"

	"backend/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() {
	var err error

	// Get database configuration from environment variables
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "monorepo_user")
	password := getEnv("DB_PASSWORD", "monorepo_password")
	dbname := getEnv("DB_NAME", "monorepo_db")
	sslmode := getEnv("DB_SSLMODE", "disable")

	// Create connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, password, dbname, sslmode)

	// Connect to database
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("✅ Database connected successfully!")

	// Auto migrate models
	err = DB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.UserRole{},
		&models.RolePermission{},
		&models.RefreshToken{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("✅ Database migration completed!")

	// Seed default data
	seedDefaultData()
}

func seedDefaultData() {
	// Create default permissions
	permissions := []models.Permission{
		{Name: "users.read", Description: "Read users", Resource: "users", Action: "read"},
		{Name: "users.write", Description: "Write users", Resource: "users", Action: "write"},
		{Name: "users.delete", Description: "Delete users", Resource: "users", Action: "delete"},
		{Name: "roles.read", Description: "Read roles", Resource: "roles", Action: "read"},
		{Name: "roles.write", Description: "Write roles", Resource: "roles", Action: "write"},
		{Name: "roles.delete", Description: "Delete roles", Resource: "roles", Action: "delete"},
		{Name: "permissions.read", Description: "Read permissions", Resource: "permissions", Action: "read"},
		{Name: "permissions.write", Description: "Write permissions", Resource: "permissions", Action: "write"},
	}

	for _, permission := range permissions {
		DB.FirstOrCreate(&permission, models.Permission{Name: permission.Name})
	}

	// Create default roles
	var adminRole models.Role
	DB.FirstOrCreate(&adminRole, models.Role{Name: "admin", Description: "Administrator with full access"})

	var userRole models.Role
	DB.FirstOrCreate(&userRole, models.Role{Name: "user", Description: "Regular user with limited access"})

	var moderatorRole models.Role
	DB.FirstOrCreate(&moderatorRole, models.Role{Name: "moderator", Description: "Moderator with moderate access"})

	// Assign permissions to admin role (all permissions)
	var allPermissions []models.Permission
	DB.Find(&allPermissions)
	DB.Model(&adminRole).Association("Permissions").Replace(allPermissions)

	// Assign permissions to user role (read only)
	var userPermissions []models.Permission
	DB.Where("action = ?", "read").Find(&userPermissions)
	DB.Model(&userRole).Association("Permissions").Replace(userPermissions)

	// Assign permissions to moderator role (read and write, no delete)
	var moderatorPermissions []models.Permission
	DB.Where("action IN ?", []string{"read", "write"}).Find(&moderatorPermissions)
	DB.Model(&moderatorRole).Association("Permissions").Replace(moderatorPermissions)

	log.Println("✅ Default data seeded successfully!")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
