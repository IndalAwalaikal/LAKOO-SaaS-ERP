package handler

import (
	"github.com/gin-gonic/gin"
	"lakoo/backend/internal/dto"
	"lakoo/backend/internal/usecase"
	"lakoo/backend/pkg/response"
)

type InventoryHandler struct {
	usecase usecase.InventoryUsecase
}

func NewInventoryHandler(uu usecase.InventoryUsecase) *InventoryHandler {
	return &InventoryHandler{usecase: uu}
}

func (h *InventoryHandler) Adjust(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	userID, _ := c.Get("user_id")

	var req dto.InventoryMutationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Invalid input format")
		return
	}

	res, err := h.usecase.AdjustStock(tenantID.(string), userID.(string), &req)
	if err != nil {
		response.Error(c, 422, "UNPROCESSABLE_ENTITY", err.Error())
		return
	}

	response.Success(c, 201, res)
}

func (h *InventoryHandler) History(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	productID := c.Param("productId")

	history, err := h.usecase.GetProductHistory(tenantID.(string), productID)
	if err != nil {
		response.Error(c, 500, "INTERNAL_SERVER_ERROR", err.Error())
		return
	}
	
	meta := response.MetaInfo{ Total: len(history), Page: 1, Limit: len(history) }
	response.SuccessWithMeta(c, 200, history, meta)
}
