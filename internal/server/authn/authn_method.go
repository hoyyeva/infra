package authn

import (
	"context"
	"fmt"
	"time"

	"github.com/infrahq/infra/internal/server/data"
	"github.com/infrahq/infra/internal/server/models"
)

type AuthenticatedIdentity struct {
	Identity      *models.Identity
	Provider      *models.Provider
	SessionExpiry time.Time
	AuthScope     AuthScope
}

type LoginMethod interface {
	Authenticate(ctx context.Context, db data.GormTxn, requestedExpiry time.Time) (AuthenticatedIdentity, error)
	Name() string                                 // Name returns the name of the authentication method used
	RequiresUpdate(db data.GormTxn) (bool, error) // Temporary way to check for one time password re-use, remove with #1441
}

type AuthScope struct {
	PasswordResetOnly bool
}

func Login(ctx context.Context, db data.GormTxn, loginMethod LoginMethod, requestedExpiry time.Time, keyExtension time.Duration) (*models.AccessKey, string, error) {
	// challenge the user to authenticate
	authenticated, err := loginMethod.Authenticate(ctx, db, requestedExpiry)
	if err != nil {
		return nil, "", fmt.Errorf("failed to login: %w", err)
	}

	// login authentication was successful, create an access key for the user

	accessKey := &models.AccessKey{
		IssuedFor:         authenticated.Identity.ID,
		IssuedForIdentity: authenticated.Identity,
		ProviderID:        authenticated.Provider.ID,
		ExpiresAt:         authenticated.SessionExpiry,
		ExtensionDeadline: time.Now().UTC().Add(keyExtension),
		Extension:         keyExtension,
	}

	if authenticated.AuthScope.PasswordResetOnly {
		accessKey.Scopes = append(accessKey.Scopes, models.ScopePasswordReset)
	}

	bearer, err := data.CreateAccessKey(db, accessKey)
	if err != nil {
		return nil, "", fmt.Errorf("failed to create access key after login: %w", err)
	}

	authenticated.Identity.LastSeenAt = time.Now().UTC()
	if err := data.SaveIdentity(db, authenticated.Identity); err != nil {
		return nil, "", fmt.Errorf("login failed to update last seen: %w", err)
	}

	return accessKey, bearer, nil
}
