package utils

import (
	"backend/config"
	"backend/models"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type Claims struct {
	UserID   uuid.UUID `json:"user_id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"`
}

// GenerateTokenPair creates both access and refresh tokens
func GenerateTokenPair(user *models.User) (*TokenPair, error) {
	// Generate access token (short-lived: 15 minutes)
	accessToken, accessExpiresAt, err := GenerateAccessToken(user)
	if err != nil {
		return nil, err
	}

	// Generate refresh token (long-lived: 7 days)
	refreshToken, err := GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExpiresAt.Unix(),
	}, nil
}

// GenerateAccessToken creates a short-lived JWT access token
func GenerateAccessToken(user *models.User) (string, time.Time, error) {
	expirationTime := time.Now().Add(15 * time.Minute) // 15 minutes

	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(getJWTSecret()))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

// GenerateRefreshToken creates a long-lived refresh token and stores it in database
func GenerateRefreshToken(userID uuid.UUID) (string, error) {
	// Generate random token
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	tokenString := hex.EncodeToString(bytes)

	// Store in database
	refreshToken := models.RefreshToken{
		Token:     tokenString,
		UserID:    userID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
		IsActive:  true,
	}

	if err := config.DB.Create(&refreshToken).Error; err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateAccessToken validates and parses an access token
func ValidateAccessToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(getJWTSecret()), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

// ValidateRefreshToken validates a refresh token from database
func ValidateRefreshToken(tokenString string) (*models.RefreshToken, error) {
	var refreshToken models.RefreshToken

	err := config.DB.Where("token = ? AND is_active = ? AND expires_at > ?",
		tokenString, true, time.Now()).
		Preload("User").
		First(&refreshToken).Error

	if err != nil {
		return nil, fmt.Errorf("invalid or expired refresh token")
	}

	return &refreshToken, nil
}

// RefreshAccessToken creates a new access token using a valid refresh token
func RefreshAccessToken(refreshTokenString string) (*TokenPair, error) {
	// Validate refresh token
	refreshToken, err := ValidateRefreshToken(refreshTokenString)
	if err != nil {
		return nil, err
	}

	// Generate new access token
	accessToken, accessExpiresAt, err := GenerateAccessToken(&refreshToken.User)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshTokenString, // Keep the same refresh token
		ExpiresAt:    accessExpiresAt.Unix(),
	}, nil
}

// RevokeRefreshToken marks a refresh token as inactive
func RevokeRefreshToken(tokenString string) error {
	return config.DB.Model(&models.RefreshToken{}).
		Where("token = ?", tokenString).
		Update("is_active", false).Error
}

// RevokeAllUserRefreshTokens marks all user's refresh tokens as inactive
func RevokeAllUserRefreshTokens(userID uuid.UUID) error {
	return config.DB.Model(&models.RefreshToken{}).
		Where("user_id = ?", userID).
		Update("is_active", false).Error
}

// CleanupExpiredTokens removes expired refresh tokens from database
func CleanupExpiredTokens() error {
	return config.DB.Where("expires_at < ? OR is_active = ?", time.Now(), false).
		Delete(&models.RefreshToken{}).Error
}

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "your-fallback-secret-key"
	}
	return secret
}
