package controllers

import (
	"backend/config"
	"backend/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct{}

type CreateUserRequest struct {
	Username  string      `json:"username" binding:"required"`
	Email     string      `json:"email" binding:"required,email"`
	Password  string      `json:"password" binding:"required,min=6"`
	FirstName string      `json:"first_name"`
	LastName  string      `json:"last_name"`
	RoleIDs   []uuid.UUID `json:"role_ids"`
}

type UpdateUserRequest struct {
	Username  string      `json:"username"`
	Email     string      `json:"email"`
	FirstName string      `json:"first_name"`
	LastName  string      `json:"last_name"`
	IsActive  *bool       `json:"is_active"`
	RoleIDs   []uuid.UUID `json:"role_ids"`
}

type AssignRoleRequest struct {
	RoleIDs []uuid.UUID `json:"role_ids" binding:"required"`
}

// GetUsers returns list of users
func (uc *UserController) GetUsers(c *gin.Context) {
	var users []models.User
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := config.DB.Preload("Roles.Permissions").Offset(offset).Limit(limit)

	// Filter by active status
	if status := c.Query("active"); status != "" {
		if active, err := strconv.ParseBool(status); err == nil {
			query = query.Where("is_active = ?", active)
		}
	}

	// Search by username or email
	if search := c.Query("search"); search != "" {
		query = query.Where("username ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var total int64
	config.DB.Model(&models.User{}).Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetUser returns a specific user
func (uc *UserController) GetUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := config.DB.Preload("Roles.Permissions").Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// CreateUser creates a new user
func (uc *UserController) CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if username or email already exists
	var existingUser models.User
	if err := config.DB.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Create user
	user := models.User{
		Username:  req.Username,
		Email:     req.Email,
		Password:  string(hashedPassword),
		FirstName: req.FirstName,
		LastName:  req.LastName,
		IsActive:  true,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Assign roles if provided
	if len(req.RoleIDs) > 0 {
		var roles []models.Role
		config.DB.Where("id IN ?", req.RoleIDs).Find(&roles)
		config.DB.Model(&user).Association("Roles").Replace(roles)
	}

	// Load user with roles for response
	config.DB.Preload("Roles.Permissions").First(&user, user.ID)

	c.JSON(http.StatusCreated, gin.H{"user": user})
}

// UpdateUser updates a user
func (uc *UserController) UpdateUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := config.DB.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Update roles if provided
	if len(req.RoleIDs) > 0 {
		var roles []models.Role
		config.DB.Where("id IN ?", req.RoleIDs).Find(&roles)
		config.DB.Model(&user).Association("Roles").Replace(roles)
	}

	// Load user with roles for response
	config.DB.Preload("Roles.Permissions").Where("id = ?", user.ID).First(&user)

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// DeleteUser deletes a user
func (uc *UserController) DeleteUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := config.DB.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if trying to delete self
	currentUser, _ := c.Get("user")
	currentUserObj := currentUser.(models.User)
	if currentUserObj.ID == user.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	if err := config.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// AssignRoles assigns roles to a user
func (uc *UserController) AssignRoles(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := config.DB.Where("id = ?", id).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req AssignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get roles
	var roles []models.Role
	if err := config.DB.Where("id IN ?", req.RoleIDs).Find(&roles).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role IDs"})
		return
	}

	// Assign roles
	if err := config.DB.Model(&user).Association("Roles").Replace(roles); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign roles"})
		return
	}

	// Load user with roles for response
	config.DB.Preload("Roles.Permissions").First(&user, user.ID)

	c.JSON(http.StatusOK, gin.H{"user": user})
}
