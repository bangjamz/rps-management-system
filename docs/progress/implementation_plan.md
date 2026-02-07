# RPS Editor Refinements

## Goal
Refine the RPS Editor UI layout and "Smart Sync" logic to match specific user workflows regarding week grouping and UTS constraints.

## User Review Required
> [!IMPORTANT]
> **Sync Logic Change**: The "Smart Sync" will now enforce UTS at Week 8. If a Sub-CPMK's duration crosses Week 8, it will be **split** into two rows: one before UTS and one after.

## Proposed Changes

### Client (`RPSEditorPage.jsx`)

1.  **Tab Reordering**:
    *   Values: `['identitas', 'cpl', 'subcpmk', 'mingguan', 'pustaka', 'metode']` (mapped to user request names).
    *   **Move**:
        *   "Informasi Tambahan" section -> Bottom of `identitas`.
        *   "Matrix Sub-CPMK vs CPL" & "Bobot Sub-CPMK" -> Bottom of `subcpmk`.

2.  **"Tambah Minggu" Button**:
    *   Start of "Rencana Pembelajaran Mingguan" (top right).
    *   Replace single button with:
        *   `Tambah Pertemuan`
        *   `Tambah UTS`
        *   `Tambah UAS`

3.  **Advanced `syncWeeklyPlan`**:
    *   **Logic**:
        *   Iterate Sub-CPMKs.
        *   Track `currentWeek`.
        *   If `currentWeek == 8`: Insert UTS, increment.
        *   If `currentWeek == 16`: Insert UAS, increment.
        *   **Check Duration**:
            *   `endWeek = currentWeek + duration - 1`.
            *   **Crossing UTS?** (Start < 8 AND End >= 8):
                *   **Split**:
                    *   Row 1: `currentWeek` to `7`.
                    *   Insert UTS (Week 8).
                    *   Row 2: `9` to `9 + remaining`.
            *   **Crossing UAS?** (Start < 16 AND End >= 16):
                *   Similar split logic.
    *   **Merged Display**: Use `sampai_minggu_ke` to render "Minggu X-Y".

### Database
*   No new changes (using existing `sampai_minggu_ke`).

## Verification
1.  **Tabs**: Verify visual order.
2.  **Buttons**: Verify 3 buttons exist in Weekly Plan.
3.  **Sync**:
    *   Set Sub-CPMK A (Duration 3). Start at Week 6.
    *   Sync.
    *   Expect:
        *   Row: Week 6-7 (Sub-CPMK A).
        *   Row: Week 8 (UTS).
        *   Row: Week 9 (Sub-CPMK A - Continued).
