package handler

import (
	"github.com/gin-gonic/gin"
	"lakoo/backend/internal/dto"
	"lakoo/backend/internal/usecase"
	"lakoo/backend/pkg/response"
	"log"
)

type ProductHandler struct {
	usecase usecase.ProductUsecase
}

func NewProductHandler(uu usecase.ProductUsecase) *ProductHandler {
	return &ProductHandler{usecase: uu}
}

func (h *ProductHandler) Create(c *gin.Context) {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		response.Error(c, 403, "FORBIDDEN", "Tenant Context Missing")
		return
	}

	var req dto.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Invalid input format")
		return
	}

	res, err := h.usecase.CreateProduct(tenantID.(string), &req)
	if err != nil {
		log.Printf("[ProductHandler] Create Error for Tenant %s: %v", tenantID.(string), err)
		response.Error(c, 422, "DATABASE_ERROR", "Gagal menyimpan produk: "+err.Error())
		return
	}

	response.Success(c, 201, res)
}

func (h *ProductHandler) Update(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	id := c.Param("id")

	var req dto.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Invalid input format")
		return
	}

	res, err := h.usecase.UpdateProduct(id, tenantID.(string), &req)
	if err != nil {
		if err.Error() == "product not found" {
			response.Error(c, 404, "NOT_FOUND", "Product not found")
		} else {
			response.Error(c, 400, "BAD_REQUEST", err.Error())
		}
		return
	}
	response.Success(c, 200, res)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	id := c.Param("id")

	err := h.usecase.DeleteProduct(id, tenantID.(string))
	if err != nil {
		response.Error(c, 404, "NOT_FOUND", "Product not found or unauthorized")
		return
	}
	response.Success(c, 200, gin.H{"message": "Product successfully deleted"})
}

func (h *ProductHandler) List(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")

	products, err := h.usecase.GetProducts(tenantID.(string))
	if err != nil {
		response.Error(c, 500, "INTERNAL_SERVER_ERROR", err.Error())
		return
	}
	
	meta := response.MetaInfo{ Total: len(products), Page: 1, Limit: len(products) }
	response.SuccessWithMeta(c, 200, products, meta)
}

func (h *ProductHandler) Get(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	id := c.Param("id")

	product, err := h.usecase.GetProductByID(id, tenantID.(string))
	if err != nil {
		response.Error(c, 404, "NOT_FOUND", err.Error())
		return
	}
	response.Success(c, 200, product)
}
