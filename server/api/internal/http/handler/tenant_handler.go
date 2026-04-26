package handler

import (
	"github.com/gin-gonic/gin"
	"lakoo/backend/internal/dto"
	"lakoo/backend/internal/usecase"
	"lakoo/backend/pkg/response"
)

type TenantHandler struct {
	usecase usecase.TenantUsecase
}

func NewTenantHandler(uu usecase.TenantUsecase) *TenantHandler {
	return &TenantHandler{usecase: uu}
}

func (h *TenantHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Invalid input format")
		return
	}

	res, err := h.usecase.Register(&req)
	if err != nil {
		response.Error(c, 422, "UNPROCESSABLE_ENTITY", err.Error())
		return
	}

	response.Success(c, 201, res)
}

func (h *TenantHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Invalid input format")
		return
	}

	res, err := h.usecase.Login(&req)
	if err != nil {
		response.Error(c, 401, "UNAUTHORIZED", err.Error())
		return
	}

	response.Success(c, 200, res)
}

func (h *TenantHandler) ForgotPassword(c *gin.Context) {
	var req dto.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Format input tidak valid")
		return
	}

	err := h.usecase.ForgotPassword(&req)
	if err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}

	response.Success(c, 200, gin.H{"message": "Instruksi pengaturan ulang kata sandi telah dikirim (cek log simulasi)."})
}

func (h *TenantHandler) ResetPassword(c *gin.Context) {
	var req dto.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", "Format input tidak valid")
		return
	}

	err := h.usecase.ResetPassword(&req)
	if err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}

	response.Success(c, 200, gin.H{"message": "Tindakan berhasil! Kata sandi telah diperbarui."})
}

func (h *TenantHandler) UpdateProfile(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	userID, _ := c.Get("user_id")

	var req dto.UpdateTenantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}

	if err := h.usecase.UpdateProfile(tenantID.(string), userID.(string), &req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}

	response.Success(c, 200, gin.H{"message": "Profil Pengaturan berhasil diperbarui"})
}

func (h *TenantHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}

	if err := h.usecase.ChangePassword(userID.(string), &req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}

	response.Success(c, 200, gin.H{"message": "Kata sandi sukses diperbarui"})
}

func (h *TenantHandler) ListStaff(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	res, err := h.usecase.ListStaff(tenantID.(string))
	if err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}
	response.Success(c, 200, res)
}

func (h *TenantHandler) AddStaff(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	var req dto.AddStaffRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}

	if err := h.usecase.AddStaff(tenantID.(string), &req); err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}
	response.Success(c, 201, gin.H{"message": "Staff berhasil ditambahkan"})
}

func (h *TenantHandler) RemoveStaff(c *gin.Context) {
	tenantID, _ := c.Get("tenant_id")
	userID := c.Param("id")

	if err := h.usecase.RemoveStaff(tenantID.(string), userID); err != nil {
		response.Error(c, 400, "BAD_REQUEST", err.Error())
		return
	}
	response.Success(c, 200, gin.H{"message": "Staff berhasil dihapus"})
}
