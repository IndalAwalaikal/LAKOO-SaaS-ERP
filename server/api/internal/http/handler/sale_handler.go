package handler

import (
	"github.com/gin-gonic/gin"
	"lakoo/backend/internal/dto"
	"lakoo/backend/internal/usecase"
	"lakoo/backend/pkg/response"
)

type SaleHandler struct {
	usecase usecase.SaleUsecase
}

func NewSaleHandler(uu usecase.SaleUsecase) *SaleHandler {
	return &SaleHandler{usecase: uu}
}

func (h *SaleHandler) Create(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	userID, _ := c.Get("user_id") // Derived from JWT

	var req dto.SaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Invalid or missing fields in input")
		return
	}

	res, err := h.usecase.CreateSale(tenantID.(string), userID.(string), &req)
	if err != nil {
		response.Error(c, 422, "UNPROCESSABLE_ENTITY", err.Error())
		return
	}

	response.Success(c, 201, res)
}

func (h *SaleHandler) List(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")

	sales, err := h.usecase.ListSales(tenantID.(string))
	if err != nil {
		response.Error(c, 500, "INTERNAL_SERVER_ERROR", err.Error())
		return
	}
	
	meta := response.MetaInfo{ Total: len(sales), Page: 1, Limit: len(sales) }
	response.SuccessWithMeta(c, 200, sales, meta)
}

func (h *SaleHandler) GetTrend(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	res, err := h.usecase.GetSalesTrend(tenantID.(string))
	if err != nil {
		response.Error(c, 500, "INTERNAL_SERVER_ERROR", err.Error())
		return
	}
	response.Success(c, 200, res)
}
