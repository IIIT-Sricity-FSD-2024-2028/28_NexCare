/**
 * Organisational hierarchy interfaces.
 *
 * NexCare is a multi-tenant platform, so "who can see whom" is a real question
 * with a real answer, and that answer is a tree:
 *
 *   Platform (superuser)
 *     └── Region  — one per Regional Officer
 *           └── Hospital
 *                 ├── Hospital Manager
 *                 └── Departments
 *                       └── Administrative staff · Doctors · Ambulance crew
 *
 * The rule everywhere: **you see your own node and everything below it, and
 * nothing above or beside it.** A Regional Officer sees their region's
 * hospitals and staff but never another officer's. A Hospital Manager sees one
 * hospital. Patients are not org nodes at all — they are customers, not staff.
 */

export type HierarchyNodeType =
  | 'platform'
  | 'region'
  | 'hospital'
  | 'department'
  | 'user';

/** One node of the org tree. */
export interface HierarchyNode {
  id: string;
  type: HierarchyNodeType;
  label: string;
  /** Secondary line — role name, city, department, whatever fits the type. */
  sublabel?: string;
  role?: string;
  status?: string;
  /** Type-specific extras the UI renders as chips (bed count, staff count…). */
  meta?: Record<string, any>;
  children: HierarchyNode[];
}

/**
 * The caller's visibility scope — the machine-readable version of the tree.
 *
 * Handed to the frontend so a portal can grey out what the caller cannot reach
 * without guessing, and used server-side so the same rule is enforced rather
 * than merely displayed.
 */
export interface VisibilityScope {
  /** The role the scope was computed for. */
  role: string;
  /** Where the caller sits: 0 = platform, 1 = region, 2 = hospital, 3 = self. */
  level: number;
  /** Human sentence for the UI banner. */
  description: string;
  /** The node the caller's subtree is rooted at. */
  rootId: string;
  rootLabel: string;
  /** Hospital ids in scope. An empty list on a level-0 scope means "all". */
  hospitalIds: string[];
  /** True when the caller is not restricted to a hospital subset. */
  seesAllHospitals: boolean;
  /** Roles the caller may see records for. */
  visibleRoles: string[];
  /** Counts of what is actually in the subtree. */
  counts: {
    regions: number;
    hospitals: number;
    managers: number;
    staff: number;
    doctors: number;
    ambulance: number;
    patients: number;
  };
}
