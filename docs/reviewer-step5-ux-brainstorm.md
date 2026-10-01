# Brainstorming Report: Reviewer UX Optimization for Step 5 (Select & Assign)

## 1. Problem Statement
When a user with the `Reviewer` role (e.g. `Jane Doe`) navigates to Step 5 (*Select & Assign*) in the SLR workspace:
- The Step Guide banner instructs them to *"Start Assigning Papers"*.
- The paper table renders active checkboxes on every row and in the table header.
- However, when checkboxes are selected, no action bar or assignment functionality is triggered because the feature is strictly gated to `isLeader === true` on both the frontend (`BulkActionBar`, `ReviewProcessPanel`) and the backend API (`assertCanManageProcess` rejects `REVIEWER` with `ForbiddenError`).
- This causes confusion, as users believe the system is unresponsive or buggy.

## 2. Requirements & Scope
- **Expected Output**:
  - For `Reviewer` (`!isLeader`):
    - Hide checkbox columns entirely from `PaperTable` and `PaperRow`.
    - Display a clear, non-intrusive informational banner indicating that paper assignment and source management are restricted to Project Leaders.
    - Update Step 5 guide banner to display a `Read-Only` context with a prominent action: *"View Review Processes"*, which smoothly scrolls down to the process cards.
  - For `Project Leader` / `Admin` (`isLeader === true`):
    - Keep full functionality intact (checkboxes, bulk action bar, assignment modals, and stepper actions).
- **Scope Boundary**: Frontend-only changes in `slr-fe`. No backend or database schema modifications.
- **Constraints**: Maintain clean responsive UI following project design system (TailwindCSS, Lucide/React Icons).

## 3. Evaluated Approaches & Trade-offs
1. **Approach 1: Hide Checkboxes & Add Informative Banner (Selected)**
   - *Pros*: Completely eliminates misleading interactions, keeps table clean for viewing papers, guides Reviewers to their actual workflow (screening).
   - *Cons*: None.
2. **Approach 2: Disabled Checkboxes with Tooltips**
   - *Pros*: Explains why checkboxes can't be clicked.
   - *Cons*: Visual clutter with disabled checkboxes that serve no purpose for a Reviewer.
3. **Approach 3: Grant Reviewers Assignment Permissions**
   - *Pros*: Allows any member to assign papers.
   - *Cons*: Violates SLR protocol standards where reviewers must screen independently without manipulating the initial paper pool. Requires BE security changes.

## 4. Implementation Details
- **`slr-fe/src/components/paperPool/PaperTable.tsx`**:
  - Conditionally render checkbox `<th>` in `thead` only when `isLeader` is true.
- **`slr-fe/src/components/paperPool/PaperRow.tsx`**:
  - Conditionally render checkbox `<td>` only when `isLeader` is true.
- **`slr-fe/src/components/paperPool/PaperRepositoryPage.tsx`**:
  - Add info alert banner when `!isLeader` explaining read-only repository status.
- **`slr-fe/src/components/paperPool/PaperPoolTab.tsx`**:
  - In `workflowActions` for Step 5: if `!isLeader`, return action button *"View Review Processes"* with `FiArrowDown` icon that smooth-scrolls to `#review-process-panel`.
- **`slr-fe/src/components/paperPool/PoolWorkflowStepper.tsx`**:
  - Show contextual instruction description for Reviewers when `!isLeader`.

## 5. Acceptance Criteria
- [ ] Reviewers do not see checkboxes in `PaperTable` or `PaperRow`.
- [ ] Reviewers see an informational read-only banner in the repository view.
- [ ] Clicking the banner button in Step 5 as a Reviewer scrolls down to `#review-process-panel`.
- [ ] Leaders and Admins continue to see checkboxes, the `BulkActionBar`, and the standard assignment workflow.
- [ ] No regression in sorting, search, filtering, PDF viewer, or pagination.
