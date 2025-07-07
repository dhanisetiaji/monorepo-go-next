package models

import (
	"time"

	"gorm.io/gorm"
)

// Role represents a role in the system
type Role struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"unique;not null"`
	Description string         `json:"description"`
	Permissions []Permission   `json:"permissions" gorm:"many2many:role_permissions;"`
	Users       []User         `json:"users" gorm:"many2many:user_roles;"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Permission represents a permission in the system
type Permission struct {
	ID          uint           `json:"id" gorm:"primaryKey"`
	Name        string         `json:"name" gorm:"unique;not null"`
	Description string         `json:"description"`
	Resource    string         `json:"resource" gorm:"not null"`
	Action      string         `json:"action" gorm:"not null"`
	Roles       []Role         `json:"roles" gorm:"many2many:role_permissions;"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// User represents a user in the system
type User struct {
	ID            uint           `json:"id" gorm:"primaryKey"`
	Username      string         `json:"username" gorm:"unique;not null"`
	Email         string         `json:"email" gorm:"unique;not null"`
	Password      string         `json:"-" gorm:"not null"` // Hidden from JSON
	FirstName     string         `json:"first_name"`
	LastName      string         `json:"last_name"`
	IsActive      bool           `json:"is_active" gorm:"default:true"`
	Roles         []Role         `json:"roles" gorm:"many2many:user_roles;"`
	RefreshTokens []RefreshToken `json:"-" gorm:"foreignKey:UserID"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	UserID     uint      `json:"user_id" gorm:"primaryKey"`
	RoleID     uint      `json:"role_id" gorm:"primaryKey"`
	AssignedBy uint      `json:"assigned_by"`
	CreatedAt  time.Time `json:"created_at"`
}

// RolePermission represents the many-to-many relationship between roles and permissions
type RolePermission struct {
	RoleID       uint      `json:"role_id" gorm:"primaryKey"`
	PermissionID uint      `json:"permission_id" gorm:"primaryKey"`
	CreatedAt    time.Time `json:"created_at"`
}

// RefreshToken represents a refresh token for JWT authentication
type RefreshToken struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Token     string         `json:"-" gorm:"unique;not null;size:500"` // Hidden from JSON
	UserID    uint           `json:"user_id" gorm:"not null"`
	User      User           `json:"user" gorm:"foreignKey:UserID"`
	ExpiresAt time.Time      `json:"expires_at" gorm:"not null"`
	IsActive  bool           `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// TableName methods for custom table names
func (User) TableName() string {
	return "users"
}

func (Role) TableName() string {
	return "roles"
}

func (Permission) TableName() string {
	return "permissions"
}

func (UserRole) TableName() string {
	return "user_roles"
}

func (RolePermission) TableName() string {
	return "role_permissions"
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
