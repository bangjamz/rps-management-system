# Task: RPS Editor Redesign (Official Template)

- [/] **Phase 1: CPL/CPMK Hierarchy** <!-- id: 40 -->
    - [x] Update RPSEditorPage with CPL selection from prodi master
    - [x] Add CPMK editor (inline checklist + add form) with CPL link
    - [ ] Add SubCPMK editor (API ready, UI pending modal)
    - [x] Update weekly table with CPMK dropdown
    - [x] Fix Master Curriculum Data (CPL, CPMK)
    - [x] Enable Editing for CPL
    - [x] Add Connected CPL Column in CPMK Table
    - [x] Enable Editing for CPMK and Link to CPL
    - [x] Implement Backend CRUD for CPMK
    - [x] Fix RPS Editor Save Error (Payload Structure)
    - [x] **New**: Implement Unique Code System (Level-based Prefixes)
    - [x] **New**: Seed CPL & CPMK Data from User Request
- [ ] Implement Sub-CPMK Management UIDeskripsi display
    - [ ] Teknik Penilaian + Kriteria columns
    - [ ] UTS/UAS auto-rows (week 8, 15)

- [ ] **Phase 3: Additional Info Fields** <!-- id: 42 -->
    - [ ] Pustaka (Utama + Pendukung)
    - [ ] Media Pembelajaran (Software, Hardware)
    - [ ] Dosen Pengampu multi-select
    - [ ] MK Syarat multi-select
    - [x] **Implementasi Sub-CPMK** <!-- id: 4 -->
    - [x] Setup Model & Migration Sub-CPMK <!-- id: 5 -->
    - [x] Buat Controller CRUD Sub-CPMK <!-- id: 6 -->
    - [x] Integrasi API di Frontend (`CurriculumPage.jsx`) <!-- id: 7 -->
    - [x] **Debugging & Fixes**
        - [x] Fix crash on missing data (defensive checks)
        - [x] Fix 403 Forbidden on Create (Backend Route Auth)
        - [x] Fix `authorize` middleware usage in `curriculum.js`
    - [x] Validasi CRUD Sub-CPMK <!-- id: 8 -->
    - [ ] Ambang Batas Kelulusan

- [ ] **Phase 4: Penilaian Matrix** <!-- id: 43 -->
    - [ ] SubCPMK vs CPL/CPMK matrix view
    - [ ] Bobot per CPMK calculation
    - [ ] Jumlah Minggu per SubCPMK

---

## Completed Tasks (Previous)

- [x] RPS Editor API fix (Kaprodi access)
- [x] RPSPertemuan model with all fields
- [x] Weekly schedule basic table
