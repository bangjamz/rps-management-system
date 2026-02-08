# Curriculum Management & RBAC Refinements

**Date**: 2026-02-09
**Status**: Completed

The curriculum management system has been refined to support strict role-based access control and resolve critical data saving issues.

## Key Changes:

### 1. Role-Based Level & Unit Selection
- **Kaprodi**: Level and unit selections are now automatically determined and locked based on their assigned Prodi or Fakultas.
    - Selecting "Institusi" automatically sets the unit to "-" and locks it.
    - Selecting "Fakultas" or "Prodi" locks the unit to the user's own assignment.
- **Super Admin**: Granted full autonomy to select any organizational level and unit across the curriculum.

### 2. Super Admin Navigation & Routing
- Added a new "Kurikulum" menu item to the Super Admin sidebar.
- Implemented corresponding routes in `App.jsx` pointing to `CurriculumPage`.

### 3. Backend Authorization
- Updated `server/routes/curriculum.js` to ensure `superadmin` and `admin` roles are authorized for all CPL, BK, CPMK, Sub-CPMK, and Mata Kuliah CRUD operations.

### 4. Technical Fixes & UI/UX
- **Persistent 500 Error Fix**: Implemented a robust `toIntOrNull` helper for foreign key fields (`cpl_id`, `cpmk_id`, `mata_kuliah_id`). This prevents `NaN` values from being sent to the backend, which was causing server-side validation errors.
- **Improved Modal Responsiveness**: All curriculum modals now support vertical scrolling (`overflow-y-auto`). This ensures forms are fully accessible on smaller screens or when the browser window is resized.
- **Enhanced Data Initialization**: Updated `handleAdd` functions to correctly initialize levels and organization IDs, ensuring a smoother user experience when creating new items.
- **Automatic Modal Closure**: All curriculum modals now close automatically upon a successful save.
- **Standardized Tables**: Updated table layouts for consistency, including dedicated search bars and level filters for each tab.
