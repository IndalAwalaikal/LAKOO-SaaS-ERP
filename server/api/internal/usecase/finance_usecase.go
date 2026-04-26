package usecase

import (
	"time"

	"github.com/google/uuid"
	"lakoo/backend/internal/domain"
	"lakoo/backend/internal/dto"
	"lakoo/backend/internal/repository"
)

type FinanceUsecase interface {
	RecordTransaction(tenantID, userID string, req *dto.FinanceRequest) (*domain.FinanceTransaction, error)
	DeleteTransaction(id, tenantID string) error
	GetTransactions(tenantID string) ([]domain.FinanceTransaction, error)
	GetSummary(tenantID string, startDate, endDate time.Time) (map[string]interface{}, error)
}

type financeUsecase struct {
	repo repository.FinanceRepository
}

func NewFinanceUsecase(repo repository.FinanceRepository) FinanceUsecase {
	return &financeUsecase{repo: repo}
}

func (u *financeUsecase) RecordTransaction(tenantID, userID string, req *dto.FinanceRequest) (*domain.FinanceTransaction, error) {
	now := time.Now()
	
	// Default to current time if the provided date parsing fails or is empty, else parse
	txDate := now
	if req.Date != "" {
		if parsed, err := time.Parse("2006-01-02", req.Date); err == nil {
			txDate = parsed
		}
	}

	ft := &domain.FinanceTransaction{
		ID:          uuid.New().String(),
		TenantID:    tenantID,
		Type:        req.Type,
		Category:    req.Category,
		Amount:      req.Amount,
		Description: req.Description,
		Date:        txDate,
		ReferenceID: req.ReferenceID,
		CreatedBy:   userID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	err := u.repo.Create(ft)
	if err != nil {
		return nil, err
	}
	return ft, nil
}

func (u *financeUsecase) DeleteTransaction(id, tenantID string) error {
	return u.repo.Delete(id, tenantID)
}

func (u *financeUsecase) GetTransactions(tenantID string) ([]domain.FinanceTransaction, error) {
	return u.repo.FindByTenant(tenantID)
}

func (u *financeUsecase) GetSummary(tenantID string, startDate, endDate time.Time) (map[string]interface{}, error) {
	income, expense, err := u.repo.GetMetrics(tenantID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	summary := map[string]interface{}{
		"total_income":  income,
		"total_expense": expense,
		"net_profit":    income - expense,
		"start_date":    startDate.Format("2006-01-02"),
		"end_date":      endDate.Format("2006-01-02"),
	}
	return summary, nil
}
