package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PermissionController struct{}

type CreatePermissionRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Resource    string `json:"resource" binding:"required"`
	Action      string `json:"action" binding:"required"`
}

type UpdatePermissionRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
}

// GetPermissions returns list of permissions
func (pc *PermissionController) GetPermissions(c *gin.Context) {
	var permissions []models.Permission
	if err := config.DB.Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permissions": permissions})
}

// GetPermission returns a specific permission
func (pc *PermissionController) GetPermission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	var permission models.Permission
	if err := config.DB.Where("id = ?", id).First(&permission).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permission": permission})
}

// CreatePermission creates a new permission
func (pc *PermissionController) CreatePermission(c *gin.Context) {
	var req CreatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if permission already exists
	var existingPermission models.Permission
	if err := config.DB.Where("name = ? OR (resource = ? AND action = ?)",
		req.Name, req.Resource, req.Action).First(&existingPermission).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Permission already exists"})
		return
	}

	// Create permission
	permission := models.Permission{
		Name:        req.Name,
		Description: req.Description,
		Resource:    req.Resource,
		Action:      req.Action,
	}

	if err := config.DB.Create(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create permission"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"permission": permission})
}

// UpdatePermission updates a permission
func (pc *PermissionController) UpdatePermission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	var permission models.Permission
	if err := config.DB.Where("id = ?", id).First(&permission).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
		return
	}

	var req UpdatePermissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.Name != "" {
		permission.Name = req.Name
	}
	if req.Description != "" {
		permission.Description = req.Description
	}
	if req.Resource != "" {
		permission.Resource = req.Resource
	}
	if req.Action != "" {
		permission.Action = req.Action
	}

	if err := config.DB.Save(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"permission": permission})
}

// DeletePermission deletes a permission
func (pc *PermissionController) DeletePermission(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid permission ID"})
		return
	}

	var permission models.Permission
	if err := config.DB.Where("id = ?", id).First(&permission).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Permission not found"})
		return
	}

	// Check if permission is assigned to any roles
	var rolePermissionCount int64
	config.DB.Model(&models.RolePermission{}).Where("permission_id = ?", id).Count(&rolePermissionCount)

	if rolePermissionCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":          "Cannot delete permission that is assigned to roles",
			"assigned_roles": rolePermissionCount,
		})
		return
	}

	if err := config.DB.Delete(&permission).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete permission"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Permission deleted successfully"})
}
