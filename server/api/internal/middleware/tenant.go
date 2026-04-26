package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"lakoo/backend/pkg/response"
)

func TenantResolver() gin.HandlerFunc {
	return func(c *gin.Context) {
		host := c.Request.Host
		
		// Strip port if exists
		if strings.Contains(host, ":") {
			parts := strings.Split(host, ":")
			host = parts[0]
		}

		parts := strings.Split(host, ".")
		// E.g. toko-abc.lakoo.id -> len=3 -> slug="toko-abc"
		// E.g. toko-abc.localhost -> len=2 -> slug="toko-abc"
		// E.g. localhost -> len=1 -> no subdomain

		if len(parts) < 2 || (len(parts) == 2 && parts[1] != "localhost") {
			response.Error(c, 400, "BAD_REQUEST", "Tenant subdomain is missing or invalid")
			c.Abort()
			return
		}

		slug := parts[0]

		// For now, we just pass the slug. A more advanced implementaton 
		// would query the DB (or Redis) to ensure the tenant is active.
		c.Set("tenant_slug", slug)
		c.Next()
	}
}
