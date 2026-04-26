package usecase

import (
	"time"

	"github.com/google/uuid"
	"lakoo/backend/internal/domain"
	"lakoo/backend/internal/dto"
	"lakoo/backend/internal/repository"
)

type InventoryUsecase interface {
	AdjustStock(tenantID, userID string, req *dto.InventoryMutationRequest) (*domain.InventoryMutation, error)
	GetProductHistory(tenantID, productID string) ([]domain.InventoryMutation, error)
}

type inventoryUsecase struct {
	repo repository.InventoryRepository
}

func NewInventoryUsecase(repo repository.InventoryRepository) InventoryUsecase {
	return &inventoryUsecase{repo: repo}
}

func (u *inventoryUsecase) AdjustStock(tenantID, userID string, req *dto.InventoryMutationRequest) (*domain.InventoryMutation, error) {
	mut := &domain.InventoryMutation{
		ID:           uuid.New().String(),
		TenantID:     tenantID,
		ProductID:    req.ProductID,
		MutationType: req.MutationType,
		Qty:          req.Qty,
		Reference:    req.Reference,
		Notes:        req.Notes,
		CreatedBy:    userID,
		CreatedAt:    time.Now(),
	}

	err := u.repo.AdjustStockTx(mut)
	if err != nil {
		return nil, err
	}

	return mut, nil
}

func (u *inventoryUsecase) GetProductHistory(tenantID, productID string) ([]domain.InventoryMutation, error) {
	return u.repo.GetProductMutations(tenantID, productID)
}
