package handler

import (
	"path/filepath"
	"github.com/google/uuid"
	"github.com/gin-gonic/gin"
	
	"lakoo/backend/pkg/storage"
	"lakoo/backend/pkg/response"
)

type MediaHandler struct {
	minioService storage.MinioService
}

func NewMediaHandler(ms storage.MinioService) *MediaHandler {
	return &MediaHandler{minioService: ms}
}

func (h *MediaHandler) Upload(c *gin.Context) {
	tenantID, exists := c.Get("tenant_id")
	if !exists {
		response.Error(c, 403, "FORBIDDEN", "Tenant Context Missing")
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		response.Error(c, 400, "BAD_REQUEST", "File is required")
		return
	}

	src, err := file.Open()
	if err != nil {
		response.Error(c, 500, "INTERNAL_ERROR", "Could not process file")
		return
	}
	defer src.Close()

	// Generate secure filename
	ext := filepath.Ext(file.Filename)
	uniqueName := tenantID.(string) + "/media/" + uuid.New().String() + ext

	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	objectURL, err := h.minioService.UploadFile(c.Request.Context(), uniqueName, src, file.Size, contentType)
	if err != nil {
		response.Error(c, 500, "INTERNAL_ERROR", "Failed to upload file to storage: " + err.Error())
		return
	}

	response.Success(c, 201, gin.H{
		"url": objectURL,
		"filename": uniqueName,
		"original_name": file.Filename,
	})
}
