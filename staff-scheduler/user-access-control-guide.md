# User Access Control System

## Overview
The staff scheduling system now supports three levels of user access: **Admin**, **Manager**, and **Staff**. Each role has different permissions and access levels to system features.

## User Roles & Permissions

### 🔴 Admin (Full Access)
**Complete system control and management**
- ✅ **User Management**: Create, edit, delete, and manage user accounts
- ✅ **Employee Management**: Add, edit, delete employees
- ✅ **Schedule Management**: Create, edit, delete schedules and templates
- ✅ **Time-Off Management**: Approve/deny time-off requests, manage all requests
- ✅ **System Settings**: Modify system settings and configurations
- ✅ **Reports & Analytics**: Access all reports and analytics
- ✅ **Database Access**: Full database permissions
- ✅ **All Features**: Access to all system functionality

### 🟡 Manager (Management Access)
**Employee and schedule management capabilities**
- ❌ **User Management**: Cannot manage user accounts
- ✅ **Employee Management**: Add, edit employees (cannot delete)
- ✅ **Schedule Management**: Create, edit schedules and templates
- ✅ **Time-Off Management**: Approve/deny time-off requests
- ❌ **System Settings**: Cannot modify system settings
- ✅ **Reports & Analytics**: Access to scheduling and employee reports
- ✅ **Team Oversight**: View all employee information and schedules
- ✅ **Base Schedule**: Manage base scheduling templates

### 🟢 Staff (Limited Access)
**Personal management and viewing capabilities**
- ❌ **User Management**: Cannot manage user accounts
- ❌ **Employee Management**: Cannot add, edit, or delete employees
- ❌ **Schedule Management**: Cannot create or edit schedules
- ✅ **Time-Off Requests**: Can submit time-off requests
- ❌ **System Settings**: Cannot modify system settings
- ❌ **Reports & Analytics**: Limited access to personal reports only
- ✅ **View Schedules**: View personal and team schedules
- ✅ **Personal Availability**: Set personal availability preferences
- ✅ **View Team**: View team member information (read-only)

## Feature Access Matrix

| Feature | Admin | Manager | Staff |
|---------|-------|---------|-------|
| **Navigation & Core** |
| Dashboard | ✅ | ✅ | ✅ |
| View Employees | ✅ | ✅ | ✅ |
| Team Availability Overview | ✅ | ✅ | ✅ |
| Weekly Schedules View | ✅ | ✅ | ✅ |
| **Employee Management** |
| Add Employees | ✅ | ✅ | ❌ |
| Edit Employees | ✅ | ✅ | ❌ |
| Delete Employees | ✅ | ❌ | ❌ |
| **Scheduling** |
| Set Personal Availability | ✅ | ✅ | ✅ |
| Manage Time-Off Requests | ✅ | ✅ | ❌ |
| Submit Time-Off Requests | ✅ | ✅ | ✅ |
| Schedule Templates | ✅ | ✅ | ❌ |
| Base Schedule Management | ✅ | ✅ | ❌ |
| Generate/Edit Schedules | ✅ | ✅ | ❌ |
| **Administration** |
| User Management | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Database Management | ✅ | ❌ | ❌ |

## Database Implementation

### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  user_role VARCHAR(20) CHECK (user_role IN ('admin', 'manager', 'staff')),
  employee_id UUID REFERENCES employees(id),
  full_name VARCHAR(100),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT true
);
```

### Permission Functions
- `get_current_user_role()`: Returns current user's role
- `has_permission(required_role)`: Checks if user has required permission level

### Row Level Security (RLS)
- **Employees Table**: 
  - Read: All authenticated users
  - Insert/Update: Managers and Admins
  - Delete: Admins only
- **User Profiles Table**: 
  - Read: Own profile + higher roles can read lower roles
  - Insert/Update/Delete: Admins only

## Frontend Implementation

### UserContext
Provides role-based permission checks throughout the application:
- `hasPermission(role)`: Generic permission check
- `canManageEmployees()`: Can add/edit employees
- `canDeleteEmployees()`: Can delete employees  
- `canManageUserAccounts()`: Can manage user accounts

### Navigation
Navigation tabs are dynamically shown based on user role:
- **Staff**: Basic tabs (employees, availability, schedules, time-off requests)
- **Manager**: + Management tabs (time-off management, schedule templates)
- **Admin**: + Administrative tabs (user management)

## Setup Instructions

1. **Run the database setup script**: `user-access-control.sql`
2. **The first user** who signs up automatically becomes an admin
3. **Subsequent users** default to staff role
4. **Admins can promote users** to manager or admin through User Management

## Security Notes

- **Database-level security** enforced through RLS policies
- **Frontend permissions** are convenience features, not security measures
- **API calls** are protected by database-level permissions
- **User roles** are validated server-side on every request

## Default User Assignment

When users first sign up:
- **First user**: Automatically assigned Admin role
- **Subsequent users**: Assigned Staff role by default
- **Role changes**: Must be done by existing Admin through User Management

## Migration for Existing Users

If you have existing users, you'll need to:
1. Run the SQL setup script
2. Manually assign roles to existing users in the `user_profiles` table
3. Link user accounts to employee records if desired