package usecase

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"lakoo/backend/internal/domain"
	"lakoo/backend/internal/dto"
	"lakoo/backend/internal/repository"
)

type CustomerUsecase interface {
	CreateCustomer(tenantID string, req *dto.CustomerRequest) (*domain.Customer, error)
	UpdateCustomer(id, tenantID string, req *dto.CustomerRequest) (*domain.Customer, error)
	DeleteCustomer(id, tenantID string) error
	GetCustomers(tenantID string) ([]domain.Customer, error)
	GetCustomerByID(id, tenantID string) (*domain.Customer, error)
}

type customerUsecase struct {
	repo repository.CustomerRepository
}

func NewCustomerUsecase(repo repository.CustomerRepository) CustomerUsecase {
	return &customerUsecase{repo: repo}
}

func (u *customerUsecase) CreateCustomer(tenantID string, req *dto.CustomerRequest) (*domain.Customer, error) {
	now := time.Now()

	customer := &domain.Customer{
		ID:        uuid.New().String(),
		TenantID:  tenantID,
		Name:      req.Name,
		Email:     req.Email,
		Phone:     req.Phone,
		Address:   req.Address,
		Points:    0,
		IsMember:  req.IsMember,
		CreatedAt: now,
		UpdatedAt: now,
	}

	err := u.repo.Create(customer)
	if err != nil {
		return nil, err
	}
	return customer, nil
}

func (u *customerUsecase) UpdateCustomer(id, tenantID string, req *dto.CustomerRequest) (*domain.Customer, error) {
	existing, err := u.repo.FindByID(id, tenantID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, errors.New("customer not found")
	}

	existing.Name = req.Name
	existing.Email = req.Email
	existing.Phone = req.Phone
	existing.Address = req.Address
	existing.IsMember = req.IsMember
	existing.UpdatedAt = time.Now()

	err = u.repo.Update(existing)
	if err != nil {
		return nil, err
	}
	return existing, nil
}

func (u *customerUsecase) DeleteCustomer(id, tenantID string) error {
	return u.repo.Delete(id, tenantID)
}

func (u *customerUsecase) GetCustomers(tenantID string) ([]domain.Customer, error) {
	return u.repo.FindByTenant(tenantID)
}

func (u *customerUsecase) GetCustomerByID(id, tenantID string) (*domain.Customer, error) {
	customer, err := u.repo.FindByID(id, tenantID)
	if err != nil {
		return nil, err
	}
	if customer == nil {
		return nil, errors.New("customer not found")
	}
	return customer, nil
}
