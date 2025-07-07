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
		// User Management
		{Name: "users.read", Description: "Read users", Resource: "users", Action: "read"},
		{Name: "users.write", Description: "Write users", Resource: "users", Action: "write"},
		{Name: "users.delete", Description: "Delete users", Resource: "users", Action: "delete"},

		// Role Management
		{Name: "roles.read", Description: "Read roles", Resource: "roles", Action: "read"},
		{Name: "roles.write", Description: "Write roles", Resource: "roles", Action: "write"},
		{Name: "roles.delete", Description: "Delete roles", Resource: "roles", Action: "delete"},

		// Permission Management
		{Name: "permissions.read", Description: "Read permissions", Resource: "permissions", Action: "read"},
		{Name: "permissions.write", Description: "Write permissions", Resource: "permissions", Action: "write"},

		// Menu Access Permissions
		{Name: "menu.dashboard", Description: "Access Dashboard", Resource: "menu", Action: "dashboard"},
		{Name: "menu.analytics", Description: "Access Analytics", Resource: "menu", Action: "analytics"},
		{Name: "menu.reports", Description: "Access Reports", Resource: "menu", Action: "reports"},
		{Name: "menu.settings", Description: "Access Settings", Resource: "menu", Action: "settings"},
		{Name: "menu.admin", Description: "Access Admin Panel", Resource: "menu", Action: "admin"},
		{Name: "menu.users", Description: "Access User Management", Resource: "menu", Action: "users"},
		{Name: "menu.roles", Description: "Access Role Management", Resource: "menu", Action: "roles"},
		{Name: "menu.audit", Description: "Access Audit Logs", Resource: "menu", Action: "audit"},
		{Name: "menu.billing", Description: "Access Billing", Resource: "menu", Action: "billing"},
		{Name: "menu.support", Description: "Access Support", Resource: "menu", Action: "support"},

		// Feature Access
		{Name: "feature.export", Description: "Export Data", Resource: "feature", Action: "export"},
		{Name: "feature.import", Description: "Import Data", Resource: "feature", Action: "import"},
		{Name: "feature.backup", Description: "Backup System", Resource: "feature", Action: "backup"},
		{Name: "feature.maintenance", Description: "System Maintenance", Resource: "feature", Action: "maintenance"},
	}

	for _, permission := range permissions {
		DB.FirstOrCreate(&permission, models.Permission{Name: permission.Name})
	}

	// Create default roles with specific permissions
	var adminRole models.Role
	DB.FirstOrCreate(&adminRole, models.Role{Name: "admin", Description: "Administrator with full system access"})

	var managerRole models.Role
	DB.FirstOrCreate(&managerRole, models.Role{Name: "manager", Description: "Manager with business analytics access"})

	var editorRole models.Role
	DB.FirstOrCreate(&editorRole, models.Role{Name: "editor", Description: "Content editor with limited admin access"})

	var viewerRole models.Role
	DB.FirstOrCreate(&viewerRole, models.Role{Name: "viewer", Description: "Read-only access to reports and analytics"})

	var supportRole models.Role
	DB.FirstOrCreate(&supportRole, models.Role{Name: "support", Description: "Support staff with user assistance access"})

	var userRole models.Role
	DB.FirstOrCreate(&userRole, models.Role{Name: "user", Description: "Regular user with basic dashboard access"})

	// Assign permissions to admin role (all permissions)
	var allPermissions []models.Permission
	DB.Find(&allPermissions)
	DB.Model(&adminRole).Association("Permissions").Replace(allPermissions)

	// Assign permissions to manager role (business + analytics access)
	var managerPermissions []models.Permission
	DB.Where("name IN ?", []string{
		"menu.dashboard", "menu.analytics", "menu.reports", "menu.billing",
		"users.read", "feature.export", "feature.import",
	}).Find(&managerPermissions)
	DB.Model(&managerRole).Association("Permissions").Replace(managerPermissions)

	// Assign permissions to editor role (content management access)
	var editorPermissions []models.Permission
	DB.Where("name IN ?", []string{
		"menu.dashboard", "menu.users", "users.read", "users.write",
		"feature.export", "menu.support",
	}).Find(&editorPermissions)
	DB.Model(&editorRole).Association("Permissions").Replace(editorPermissions)

	// Assign permissions to viewer role (read-only access)
	var viewerPermissions []models.Permission
	DB.Where("name IN ?", []string{
		"menu.dashboard", "menu.analytics", "menu.reports",
		"users.read", "roles.read", "permissions.read",
	}).Find(&viewerPermissions)
	DB.Model(&viewerRole).Association("Permissions").Replace(viewerPermissions)

	// Assign permissions to support role (user assistance)
	var supportPermissions []models.Permission
	DB.Where("name IN ?", []string{
		"menu.dashboard", "menu.support", "menu.users",
		"users.read", "users.write", "feature.export",
	}).Find(&supportPermissions)
	DB.Model(&supportRole).Association("Permissions").Replace(supportPermissions)

	// Assign permissions to user role (basic dashboard only)
	var userPermissions []models.Permission
	DB.Where("name IN ?", []string{
		"menu.dashboard",
	}).Find(&userPermissions)
	DB.Model(&userRole).Association("Permissions").Replace(userPermissions)

	log.Println("✅ Default data seeded successfully!")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
