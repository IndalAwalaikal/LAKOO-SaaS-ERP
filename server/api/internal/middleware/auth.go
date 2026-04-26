package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"lakoo/backend/pkg/auth"
	"lakoo/backend/pkg/config"
	"lakoo/backend/pkg/response"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, 401, "UNAUTHORIZED", "Missing authorization header")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(c, 401, "UNAUTHORIZED", "Invalid authorization header format")
			c.Abort()
			return
		}

		claims, err := auth.ValidateToken(parts[1], cfg)
		if err != nil {
			response.Error(c, 401, "UNAUTHORIZED", "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("tenant_id", claims.TenantID)
		c.Set("role", claims.Role)
		c.Next()
	}
}
