package utils

import (
	"backend/models"
)

// MenuAccess represents menu access configuration
type MenuAccess struct {
	Name       string       `json:"name"`
	Label      string       `json:"label"`
	Icon       string       `json:"icon"`
	Path       string       `json:"path"`
	Permission string       `json:"permission"`
	Children   []MenuAccess `json:"children,omitempty"`
	Accessible bool         `json:"accessible"`
}

// GetUserMenuAccess returns accessible menu items based on user permissions
func GetUserMenuAccess(user *models.User) []MenuAccess {
	// Define all menu items with their required permissions
	allMenus := []MenuAccess{
		{
			Name:       "dashboard",
			Label:      "Dashboard",
			Icon:       "dashboard",
			Path:       "/dashboard",
			Permission: "menu.dashboard",
		},
		{
			Name:       "admin-panel",
			Label:      "Admin Panel",
			Icon:       "admin_panel_settings",
			Path:       "/admin",
			Permission: "menu.admin-panel",
		},
		{
			Name:       "analytics",
			Label:      "Analytics",
			Icon:       "analytics",
			Path:       "/analytics",
			Permission: "menu.analytics",
		},
		{
			Name:       "reports",
			Label:      "Reports",
			Icon:       "report",
			Path:       "/reports",
			Permission: "menu.reports",
		},
		{
			Name:       "admin",
			Label:      "Administration",
			Icon:       "admin_panel_settings",
			Path:       "/admin",
			Permission: "menu.admin",
			Children: []MenuAccess{
				{
					Name:       "users",
					Label:      "User Management",
					Icon:       "people",
					Path:       "/admin/users",
					Permission: "menu.users",
				},
				{
					Name:       "roles",
					Label:      "Role Management",
					Icon:       "security",
					Path:       "/admin/roles",
					Permission: "menu.roles",
				},
				{
					Name:       "audit",
					Label:      "Audit Logs",
					Icon:       "history",
					Path:       "/admin/audit",
					Permission: "menu.audit",
				},
			},
		},
		{
			Name:       "billing",
			Label:      "Billing",
			Icon:       "receipt",
			Path:       "/billing",
			Permission: "menu.billing",
		},
		{
			Name:       "support",
			Label:      "Support",
			Icon:       "support_agent",
			Path:       "/support",
			Permission: "menu.support",
		},
		{
			Name:       "settings",
			Label:      "Settings",
			Icon:       "settings",
			Path:       "/settings",
			Permission: "menu.settings",
		},
	}

	// Filter menus based on user permissions
	return filterMenusByPermissions(allMenus, user)
}

// filterMenusByPermissions recursively filters menu items based on user permissions
func filterMenusByPermissions(menus []MenuAccess, user *models.User) []MenuAccess {
	var accessibleMenus []MenuAccess

	for _, menu := range menus {
		// Check if user has permission for this menu
		if hasMenuPermission(user, menu.Permission) {
			menu.Accessible = true

			// Filter children if they exist
			if len(menu.Children) > 0 {
				menu.Children = filterMenusByPermissions(menu.Children, user)
			}

			accessibleMenus = append(accessibleMenus, menu)
		}
	}

	return accessibleMenus
}

// hasMenuPermission checks if user has specific menu permission
func hasMenuPermission(user *models.User, permission string) bool {
	for _, role := range user.Roles {
		for _, perm := range role.Permissions {
			if perm.Name == permission {
				return true
			}
		}
	}
	return false
}

// GetUserFeatureAccess returns accessible features based on user permissions
func GetUserFeatureAccess(user *models.User) map[string]bool {
	features := map[string]bool{
		"export":      hasMenuPermission(user, "feature.export"),
		"import":      hasMenuPermission(user, "feature.import"),
		"backup":      hasMenuPermission(user, "feature.backup"),
		"maintenance": hasMenuPermission(user, "feature.maintenance"),
	}

	return features
}

// RoleMenuMap returns predefined menu access for each role (for documentation)
func RoleMenuMap() map[string][]string {
	return map[string][]string{
		"admin": {
			"menu.dashboard", "menu.analytics", "menu.reports", "menu.admin",
			"menu.users", "menu.roles", "menu.audit", "menu.billing",
			"menu.support", "menu.settings",
		},
		"manager": {
			"menu.dashboard", "menu.analytics", "menu.reports", "menu.billing",
		},
		"editor": {
			"menu.dashboard", "menu.users", "menu.support",
		},
		"viewer": {
			"menu.dashboard", "menu.analytics", "menu.reports",
		},
		"support": {
			"menu.dashboard", "menu.support", "menu.users",
		},
		"user": {
			"menu.dashboard",
		},
	}
}
