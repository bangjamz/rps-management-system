# RPS Editor Logic & Fixes

## Overview
This document outlines the recent fixes and logic improvements applied to the RPS Editor, View, and Export functionalities to address user feedback regarding data persistence, display consistency, and PDF generation.

## Changes & Fixes

### 1. Matrix & Bobot Visibility
*   **Issue**: The "Matriks Penilaian (Sub-CPMK vs Evaluasi)" table was missing from the "Sub-CPMK" tab.
*   **Fix**: Re-inserted the missing JSX code into `RPSEditorPage.jsx` within the `activeSection === 'subcpmk'` block. It is now visible at the bottom of the section.

### 2. Weekly Plan "Many Meetings" Bug
*   **Issue**: After syncing the weekly plan (which reduces row count by merging weeks), saving and reloading caused the rows to revert to a large number of single-week rows (e.g., 16+), often with duplicates.
*   **Root Cause**: The backend's `bulkUpsertPertemuan` function was **updating** existing rows but **not deleting** old, orphaned rows. If the editor sent 8 merged rows (Ids 1, 3, 5...), the backend kept them but left Ids 2, 4, 6... in the database. Loading the RPS would then fetch all 16 rows.
*   **Fix**: Updated `server/controllers/rpsDosenController.js` to delete any `RPSPertemuan` records associated with the RPS that are **not present** in the save payload. This ensures the database exactly matches the editor state.

### 3. Weekly Plan Input Logic
*   **Issue**: Users could not input ranges like "1-2" in the "Minggu" column because the input was strictly bound to a single integer value, and the UI didn't support parsing ranges.
*   **Fix**: Updated the "Minggu" input in `RPSEditorPage.jsx` to:
    *   **Display**: Show ranges (e.g., "1-2") if `sampai_minggu_ke` is set.
    *   **Edit**: Parse input strings like "1-2" or "3-5". If a range is detected, it updates both `minggu_ke` and `sampai_minggu_ke`. If a single number is entered, it clears the range.

### 4. View Page Display Logic
*   **Issue**: The "View RPS" page blindly rendered every row returned by the backend. If "ghost" rows existed (before the controller fix), it showed messy data.
*   **Fix**: Updated `RPSViewPage.jsx` to respect `sampai_minggu_ke`. It now skips rendering weeks that are "covered" by a previous merged row (e.g., if Week 1 covers 1-2, Week 2 is skipped in the render loop), ensuring a clean table even if data is slightly imperfect.

### 5. PDF Export Improvements
*   **Issue**: The "Metode Penilaian" section was missing from the PDF.
*   **Fix**: Updated `src/utils/rpsExport.js` to:
    *   Add a "Metode Penilaian & Kriteria" table section.
    *   Update the Weekly Schedule loop to properly handle and display merged weeks (ranges), preventing the generation of 16 rigid empty rows when merged weeks are present.

## Verification
*   **Editor**: "Minggu" input now accepts ranges. "Matriks & Bobot" is visible.
*   **Persistence**: Saving a synced plan (e.g., 8 rows) and reloading now correctly loads 8 rows, not 16.
*   **View**: The View page renders merged rows cleanly.
*   **Export**: PDF includes all sections and formats the weekly schedule correctly.
*   **Export (Layout)**: "Metode Penilaian" is now correctly positioned at the end of the PDF with a dedicated page break.
*   **Safety**: Backend now validates all IDs strictly, preventing "invalid input syntax" errors.
