package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type RoleController struct{}

type CreateRoleRequest struct {
	Name          string `json:"name" binding:"required"`
	Description   string `json:"description"`
	PermissionIDs []uint `json:"permission_ids"`
}

type UpdateRoleRequest struct {
	Name          string `json:"name"`
	Description   string `json:"description"`
	PermissionIDs []uint `json:"permission_ids"`
}

// GetRoles returns list of roles
func (rc *RoleController) GetRoles(c *gin.Context) {
	var roles []models.Role
	if err := config.DB.Preload("Permissions").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch roles"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"roles": roles})
}

// GetRole returns a specific role
func (rc *RoleController) GetRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	var role models.Role
	if err := config.DB.Preload("Permissions").Preload("Users").First(&role, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"role": role})
}

// CreateRole creates a new role
func (rc *RoleController) CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if role name already exists
	var existingRole models.Role
	if err := config.DB.Where("name = ?", req.Name).First(&existingRole).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Role name already exists"})
		return
	}

	// Create role
	role := models.Role{
		Name:        req.Name,
		Description: req.Description,
	}

	if err := config.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create role"})
		return
	}

	// Assign permissions if provided
	if len(req.PermissionIDs) > 0 {
		var permissions []models.Permission
		config.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
		config.DB.Model(&role).Association("Permissions").Replace(permissions)
	}

	// Load role with permissions for response
	config.DB.Preload("Permissions").First(&role, role.ID)

	c.JSON(http.StatusCreated, gin.H{"role": role})
}

// UpdateRole updates a role
func (rc *RoleController) UpdateRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	var role models.Role
	if err := config.DB.First(&role, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if req.Name != "" {
		role.Name = req.Name
	}
	if req.Description != "" {
		role.Description = req.Description
	}

	if err := config.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	// Update permissions if provided
	if len(req.PermissionIDs) > 0 {
		var permissions []models.Permission
		config.DB.Where("id IN ?", req.PermissionIDs).Find(&permissions)
		config.DB.Model(&role).Association("Permissions").Replace(permissions)
	}

	// Load role with permissions for response
	config.DB.Preload("Permissions").First(&role, role.ID)

	c.JSON(http.StatusOK, gin.H{"role": role})
}

// DeleteRole deletes a role
func (rc *RoleController) DeleteRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}

	var role models.Role
	if err := config.DB.First(&role, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}

	// Check if role is one of the default roles
	defaultRoles := []string{"admin", "user", "moderator"}
	for _, defaultRole := range defaultRoles {
		if role.Name == defaultRole {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete default role"})
			return
		}
	}

	// Check if role has users assigned
	var userCount int64
	config.DB.Model(&models.User{}).Joins("JOIN user_roles ON users.id = user_roles.user_id").Where("user_roles.role_id = ?", role.ID).Count(&userCount)
	if userCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete role with assigned users"})
		return
	}

	if err := config.DB.Delete(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Role deleted successfully"})
}

// GetPermissions returns list of all permissions
func (rc *RoleController) GetPermissions(c *gin.Context) {
	var permissions []models.Permission
	if err := config.DB.Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permissions": permissions})
}
