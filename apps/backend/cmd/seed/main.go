package main

import (
	"backend/config"
	"backend/models"
	"log"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Initialize database connection
	config.ConnectDB()

	// Auto migrate tables
	err := config.DB.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.RefreshToken{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Seed default data
	seedDefaultData()

	log.Println("Database seeded successfully!")
}

func seedDefaultData() {
	// Seed Permissions
	permissions := []models.Permission{
		{Name: "users.read", Description: "Read users", Resource: "users", Action: "read"},
		{Name: "users.write", Description: "Write users", Resource: "users", Action: "write"},
		{Name: "users.delete", Description: "Delete users", Resource: "users", Action: "delete"},
		{Name: "roles.read", Description: "Read roles", Resource: "roles", Action: "read"},
		{Name: "roles.write", Description: "Write roles", Resource: "roles", Action: "write"},
		{Name: "roles.delete", Description: "Delete roles", Resource: "roles", Action: "delete"},
		{Name: "permissions.read", Description: "Read permissions", Resource: "permissions", Action: "read"},
		{Name: "permissions.write", Description: "Write permissions", Resource: "permissions", Action: "write"},
		{Name: "permissions.delete", Description: "Delete permissions", Resource: "permissions", Action: "delete"},
		{Name: "dashboard.read", Description: "Access dashboard", Resource: "dashboard", Action: "read"},
		{Name: "menu.dashboard", Description: "Access dashboard menu", Resource: "menu", Action: "dashboard"},
		{Name: "menu.admin-panel", Description: "Access admin panel", Resource: "menu", Action: "admin-panel"},
		{Name: "menu.analytics", Description: "Access analytics menu", Resource: "menu", Action: "analytics"},
		{Name: "menu.reports", Description: "Access reports menu", Resource: "menu", Action: "reports"},
		{Name: "menu.admin", Description: "Access admin menu", Resource: "menu", Action: "admin"},
		{Name: "menu.users", Description: "Access users menu", Resource: "menu", Action: "users"},
		{Name: "menu.roles", Description: "Access roles menu", Resource: "menu", Action: "roles"},
		{Name: "menu.billing", Description: "Access billing menu", Resource: "menu", Action: "billing"},
		{Name: "menu.support", Description: "Access support menu", Resource: "menu", Action: "support"},
		{Name: "menu.settings", Description: "Access settings menu", Resource: "menu", Action: "settings"},
		{Name: "settings.read", Description: "Read settings", Resource: "settings", Action: "read"},
		{Name: "settings.write", Description: "Write settings", Resource: "settings", Action: "write"},
	}

	for _, permission := range permissions {
		config.DB.Where("name = ?", permission.Name).FirstOrCreate(&permission)
	}

	// Seed Roles
	roles := []models.Role{
		{Name: "admin", Description: "Administrator with full access"},
		{Name: "manager", Description: "Manager with limited administrative access"},
		{Name: "editor", Description: "Editor with content management access"},
		{Name: "viewer", Description: "Viewer with read-only access"},
		{Name: "user", Description: "Regular user with basic access"},
	}

	for _, role := range roles {
		config.DB.Where("name = ?", role.Name).FirstOrCreate(&role)
	}

	// Assign permissions to roles
	assignPermissionsToRoles()

	// Create default admin user
	createDefaultAdminUser()
}

func assignPermissionsToRoles() {
	// Admin gets all permissions
	var adminRole models.Role
	config.DB.Where("name = ?", "admin").First(&adminRole)
	var allPermissions []models.Permission
	config.DB.Find(&allPermissions)
	config.DB.Model(&adminRole).Association("Permissions").Replace(allPermissions)

	// Manager gets user and role management permissions
	var managerRole models.Role
	config.DB.Where("name = ?", "manager").First(&managerRole)
	var managerPermissions []models.Permission
	config.DB.Where("resource IN ?", []string{"users", "roles", "dashboard"}).Find(&managerPermissions)
	config.DB.Model(&managerRole).Association("Permissions").Replace(managerPermissions)

	// Editor gets read/write permissions for content
	var editorRole models.Role
	config.DB.Where("name = ?", "editor").First(&editorRole)
	var editorPermissions []models.Permission
	config.DB.Where("action IN ? AND resource != ?", []string{"read", "write"}, "settings").Find(&editorPermissions)
	config.DB.Model(&editorRole).Association("Permissions").Replace(editorPermissions)

	// Viewer gets read permissions only
	var viewerRole models.Role
	config.DB.Where("name = ?", "viewer").First(&viewerRole)
	var viewerPermissions []models.Permission
	config.DB.Where("action = ?", "read").Find(&viewerPermissions)
	config.DB.Model(&viewerRole).Association("Permissions").Replace(viewerPermissions)

	// User gets basic permissions
	var userRole models.Role
	config.DB.Where("name = ?", "user").First(&userRole)
	var userPermissions []models.Permission
	config.DB.Where("name IN ?", []string{"dashboard.read"}).Find(&userPermissions)
	config.DB.Model(&userRole).Association("Permissions").Replace(userPermissions)
}

func createDefaultAdminUser() {
	// Check if admin user already exists
	var existingAdmin models.User
	if config.DB.Where("username = ?", "admin").First(&existingAdmin).Error == nil {
		log.Println("Admin user already exists")
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	// Create admin user
	adminUser := models.User{
		ID:        uuid.New(),
		Username:  "admin",
		Email:     "admin@example.com",
		Password:  string(hashedPassword),
		FirstName: "System",
		LastName:  "Administrator",
		IsActive:  true,
	}

	if err := config.DB.Create(&adminUser).Error; err != nil {
		log.Fatal("Failed to create admin user:", err)
	}

	// Assign admin role
	var adminRole models.Role
	config.DB.Where("name = ?", "admin").First(&adminRole)
	config.DB.Model(&adminUser).Association("Roles").Append(&adminRole)

	log.Println("Default admin user created: admin/admin123")
}
