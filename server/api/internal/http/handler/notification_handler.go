package handler

import (
	"lakoo/backend/internal/usecase"
	"lakoo/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	usecase usecase.NotificationUsecase
}

func NewNotificationHandler(u usecase.NotificationUsecase) *NotificationHandler {
	return &NotificationHandler{usecase: u}
}

func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	res, err := h.usecase.GetNotifications(tenantID.(string))
	if err != nil {
		response.Error(c, 500, "INTERNAL_SERVER_ERROR", err.Error())
		return
	}
	response.Success(c, 200, res)
}
