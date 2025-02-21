package data

import (
	"fmt"
	"time"

	"github.com/ssoroka/slice"
	"gorm.io/gorm"

	"github.com/infrahq/infra/internal/server/models"
	"github.com/infrahq/infra/uid"
)

func AssignIdentityToGroups(tx GormTxn, user *models.Identity, provider *models.Provider, newGroups []string) error {
	db := tx.GormDB()
	pu, err := GetProviderUser(tx, provider.ID, user.ID)
	if err != nil {
		return err
	}

	oldGroups := pu.Groups
	groupsToBeRemoved := slice.Subtract(oldGroups, newGroups)
	groupsToBeAdded := slice.Subtract(newGroups, oldGroups)

	pu.Groups = newGroups
	pu.LastUpdate = time.Now().UTC()
	if err := save(tx, pu); err != nil {
		return fmt.Errorf("save: %w", err)
	}

	// remove user from groups
	if len(groupsToBeRemoved) > 0 {
		err = db.Exec("delete from identities_groups where identity_id = ? and group_id in (select id from groups where name in (?))", user.ID, groupsToBeRemoved).Error
		if err != nil {
			return err
		}
		for _, name := range groupsToBeRemoved {
			for i, g := range user.Groups {
				if g.Name == name {
					// remove from list
					user.Groups = append(user.Groups[:i], user.Groups[i+1:]...)
				}
			}
		}
	}

	var addIDs []struct {
		ID   uid.ID
		Name string
	}
	err = db.Table("groups").Select("id, name").Where("name in (?)", groupsToBeAdded).Scan(&addIDs).Error
	if err != nil {
		return fmt.Errorf("group ids: %w", err)
	}

	for _, name := range groupsToBeAdded {
		// find or create group
		var groupID uid.ID
		found := false
		for _, obj := range addIDs {
			if obj.Name == name {
				found = true
				groupID = obj.ID
				break
			}
		}
		if !found {
			group := &models.Group{
				Name:              name,
				CreatedByProvider: provider.ID,
			}

			if err = CreateGroup(tx, group); err != nil {
				return fmt.Errorf("create group: %w", err)
			}
			groupID = group.ID
		}

		var ids []uid.ID
		if err := db.Raw("SELECT identity_id FROM identities_groups WHERE identity_id = ? AND group_id = ?", user.ID, groupID).Scan(&ids).Error; err != nil {
			return fmt.Errorf("select: %w", handleError(err))
		}

		if len(ids) == 0 {
			// add user to group
			err = db.Exec("insert into identities_groups (identity_id, group_id) values (?, ?)", user.ID, groupID).Error
			if err != nil {
				return fmt.Errorf("insert: %w", handleError(err))
			}
		}

		user.Groups = append(user.Groups, models.Group{Model: models.Model{ID: groupID}, Name: name})
	}

	return nil
}

func CreateIdentity(db GormTxn, identity *models.Identity) error {
	return add(db, identity)
}

func GetIdentity(db GormTxn, selectors ...SelectorFunc) (*models.Identity, error) {
	return get[models.Identity](db, selectors...)
}

func ListIdentities(db GormTxn, p *models.Pagination, selectors ...SelectorFunc) ([]models.Identity, error) {
	return list[models.Identity](db, p, selectors...)
}

func DeleteIdentity(db GormTxn, id uid.ID) error {
	return delete[models.Identity](db, id)
}

func DeleteIdentities(tx GormTxn, selectors ...SelectorFunc) error {
	selectID := func(db *gorm.DB) *gorm.DB {
		return db.Select("id")
	}
	selectors = append([]SelectorFunc{selectID}, selectors...)
	toDelete, err := ListIdentities(tx, nil, selectors...)
	if err != nil {
		return err
	}

	ids := make([]uid.ID, 0)
	for _, i := range toDelete {
		ids = append(ids, i.ID)

		err := DeleteGrants(tx, BySubject(i.PolyID()))
		if err != nil {
			return err
		}

		groups, err := ListGroups(tx, nil, ByGroupMember(i.ID))
		if err != nil {
			return err
		}

		for _, group := range groups {
			err = RemoveUsersFromGroup(tx, group.ID, []uid.ID{i.ID})
			if err != nil {
				return err
			}
		}
	}

	return deleteAll[models.Identity](tx, ByIDs(ids))
}

func SaveIdentity(db GormTxn, identity *models.Identity) error {
	return save(db, identity)
}
