import { Injectable } from '@nestjs/common';
import { ResponseUtil } from '../common/utils/response.util';
import { FileStore } from '../common/utils/file-store.util';
import { UserRole } from '../common/interfaces/api-response.interface';
import {
  HierarchyNode,
  VisibilityScope,
} from './interfaces/hierarchy.interface';

/**
 * Hierarchy Service
 *
 * Builds the org tree and, more importantly, decides how much of it a given
 * caller is allowed to see. Both come from the same walk, so the tree a portal
 * renders and the scope the backend enforces can never disagree.
 *
 * Reads users.json and hospitals.json directly rather than through their
 * services: this module is a read-only view over data other modules own, and
 * going through them would mean importing half the app for no gain.
 */
@Injectable()
export class HierarchyService {
  private readonly usersStore = new FileStore<any>('users.json', () => []);
  private readonly hospitalsStore = new FileStore<any>('hospitals.json', () => []);

  /** Staff roles that hang off a hospital node. Patients are customers, not staff. */
  private static readonly STAFF_ROLES = [
    UserRole.HOSPITAL_MANAGER,
    UserRole.ADMINISTRATIVE_STAFF,
    UserRole.DOCTOR,
    UserRole.NURSE,
    UserRole.AMBULANCE,
  ];

  // ── Public API ────────────────────────────────────────────────────────────

  /** The subtree rooted at the caller's own node. */
  async getMyHierarchy(user: any) {
    try {
      const tree = this.buildFor(user);
      if (!tree) {
        return ResponseUtil.forbidden(
          'Your role does not sit on the organisational hierarchy.',
        );
      }
      return ResponseUtil.success('Hierarchy retrieved successfully', tree);
    } catch (error) {
      console.error('Hierarchy error:', error);
      return ResponseUtil.serverError('Failed to build the organisational hierarchy');
    }
  }

  /** The machine-readable scope: what this caller may see, and how much of it. */
  async getMyScope(user: any) {
    try {
      return ResponseUtil.success('Visibility scope retrieved successfully', this.scopeFor(user));
    } catch (error) {
      console.error('Scope error:', error);
      return ResponseUtil.serverError('Failed to compute the visibility scope');
    }
  }

  /**
   * The hospital ids a caller may act on. Other modules can call this instead of
   * re-deriving the rule — an empty array from a superuser means "no filter",
   * which is why `seesAllHospitals` is checked, not the array's length.
   */
  hospitalIdsInScope(user: any): { ids: string[]; all: boolean } {
    const hospitals = this.hospitalsStore.load();
    switch (user?.role) {
      case UserRole.SUPERUSER:
        return { ids: hospitals.map(h => h.id), all: true };
      case UserRole.REGIONAL_MANAGER:
        return {
          ids: hospitals.filter(h => h.assignedManagerId === user.id).map(h => h.id),
          all: false,
        };
      default:
        return { ids: user?.hospitalId ? [user.hospitalId] : [], all: false };
    }
  }

  /** True when `targetUserId` sits inside the caller's subtree. */
  canSeeUser(caller: any, targetUserId: string): boolean {
    if (caller?.role === UserRole.SUPERUSER) return true;
    if (caller?.id === targetUserId) return true;

    const target = this.usersStore.load().find(u => u.id === targetUserId);
    if (!target) return false;
    if (target.role === UserRole.PATIENT) {
      // Patients belong to the platform, not to a hospital's org chart.
      return caller?.role === UserRole.SUPERUSER;
    }
    const { ids } = this.hospitalIdsInScope(caller);
    return !!target.hospitalId && ids.includes(target.hospitalId);
  }

  // ── Tree construction ─────────────────────────────────────────────────────

  private buildFor(user: any): HierarchyNode | null {
    switch (user?.role) {
      case UserRole.SUPERUSER:
        return this.platformNode();
      case UserRole.REGIONAL_MANAGER:
        return this.regionNode(user.id, user.name);
      case UserRole.HOSPITAL_MANAGER:
      case UserRole.ADMINISTRATIVE_STAFF: {
        const hospital = this.hospitalsStore.load().find(h => h.id === user.hospitalId);
        return hospital ? this.hospitalNode(hospital) : null;
      }
      default:
        return null;
    }
  }

  /** Level 0 — everything, grouped by the officer who oversees it. */
  private platformNode(): HierarchyNode {
    const users = this.usersStore.load();
    const hospitals = this.hospitalsStore.load();
    const officers = users.filter(u => u.role === UserRole.REGIONAL_MANAGER);

    const regions = officers.map(o => this.regionNode(o.id, o.name));

    // Hospitals nobody has been assigned still have to appear — they are the
    // Admin's queue, and hiding them is how a registration gets forgotten.
    const unassigned = hospitals.filter(
      h => !h.assignedManagerId || !officers.some(o => o.id === h.assignedManagerId),
    );
    if (unassigned.length) {
      regions.push({
        id: 'REGION-UNASSIGNED',
        type: 'region',
        label: 'Unassigned hospitals',
        sublabel: 'No regional officer yet — assign one to start the review chain',
        meta: { hospitals: unassigned.length, unassigned: true },
        children: unassigned.map(h => this.hospitalNode(h)),
      });
    }

    return {
      id: 'PLATFORM',
      type: 'platform',
      label: 'NexCare Platform',
      sublabel: 'Every region, hospital and staff account',
      meta: {
        regions: officers.length,
        hospitals: hospitals.length,
        patients: users.filter(u => u.role === UserRole.PATIENT).length,
        staff: users.filter(u => HierarchyService.STAFF_ROLES.includes(u.role)).length,
      },
      children: regions,
    };
  }

  /** Level 1 — one regional officer and the hospitals assigned to them. */
  private regionNode(officerId: string, officerName: string): HierarchyNode {
    const hospitals = this.hospitalsStore
      .load()
      .filter(h => h.assignedManagerId === officerId);

    return {
      id: `REGION-${officerId}`,
      type: 'region',
      label: `${officerName}'s region`,
      sublabel: 'Regional Officer',
      role: UserRole.REGIONAL_MANAGER,
      meta: {
        officerId,
        hospitals: hospitals.length,
        cities: Array.from(new Set(hospitals.map(h => h.city).filter(Boolean))),
      },
      children: hospitals.map(h => this.hospitalNode(h)),
    };
  }

  /** Level 2 — one hospital, its manager, and its staff grouped by department. */
  private hospitalNode(hospital: any): HierarchyNode {
    const staff = this.usersStore
      .load()
      .filter(
        u => u.hospitalId === hospital.id && HierarchyService.STAFF_ROLES.includes(u.role),
      );

    const manager = staff.find(u => u.role === UserRole.HOSPITAL_MANAGER);
    const rest = staff.filter(u => u.role !== UserRole.HOSPITAL_MANAGER);

    // Group by department so a 40-person hospital is readable. Anyone without a
    // department lands in a bucket named after their role instead of "Other",
    // which would hide ambulance crews behind a meaningless label.
    const groups = new Map<string, any[]>();
    for (const person of rest) {
      const key = person.dept || this.roleLabel(person.role);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(person);
    }

    const children: HierarchyNode[] = [];
    if (manager) children.push(this.userNode(manager));

    for (const [dept, people] of Array.from(groups.entries()).sort()) {
      children.push({
        id: `${hospital.id}-DEPT-${dept.replace(/\s+/g, '-')}`,
        type: 'department',
        label: dept,
        sublabel: `${people.length} ${people.length === 1 ? 'person' : 'people'}`,
        meta: { hospitalId: hospital.id, headcount: people.length },
        children: people
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
          .map(p => this.userNode(p)),
      });
    }

    return {
      id: hospital.id,
      type: 'hospital',
      label: hospital.name,
      sublabel: [hospital.city, hospital.state].filter(Boolean).join(', '),
      status: hospital.verificationStatus,
      meta: {
        verificationStatus: hospital.verificationStatus,
        regionalReviewStatus: hospital.regionalReviewStatus,
        assignedManagerId: hospital.assignedManagerId || null,
        totalBeds: hospital.totalBeds || 0,
        availableBeds: hospital.availableBeds || 0,
        headcount: staff.length,
        doctors: staff.filter(u => u.role === UserRole.DOCTOR).length,
      },
      children,
    };
  }

  /** Level 3 — a person. Leaf node; passwords never leave the service. */
  private userNode(user: any): HierarchyNode {
    return {
      id: user.id,
      type: 'user',
      label: user.name,
      sublabel: this.roleLabel(user.role),
      role: user.role,
      status: user.status,
      meta: {
        email: user.email,
        dept: user.dept || null,
        hospitalId: user.hospitalId || null,
      },
      children: [],
    };
  }

  // ── Scope ─────────────────────────────────────────────────────────────────

  private scopeFor(user: any): VisibilityScope {
    const users = this.usersStore.load();
    const hospitals = this.hospitalsStore.load();
    const { ids, all } = this.hospitalIdsInScope(user);

    const inScope = all ? hospitals : hospitals.filter(h => ids.includes(h.id));
    const staffInScope = users.filter(
      u =>
        HierarchyService.STAFF_ROLES.includes(u.role) &&
        (all || (u.hospitalId && ids.includes(u.hospitalId))),
    );
    const countRole = (role: UserRole) => staffInScope.filter(u => u.role === role).length;

    const base = {
      hospitalIds: inScope.map(h => h.id),
      seesAllHospitals: all,
      counts: {
        regions: all ? users.filter(u => u.role === UserRole.REGIONAL_MANAGER).length : 1,
        hospitals: inScope.length,
        managers: countRole(UserRole.HOSPITAL_MANAGER),
        staff: countRole(UserRole.ADMINISTRATIVE_STAFF),
        doctors: countRole(UserRole.DOCTOR),
        ambulance: countRole(UserRole.AMBULANCE),
        // Patients are platform-level customers — only the Admin sees them all.
        patients:
          user?.role === UserRole.SUPERUSER
            ? users.filter(u => u.role === UserRole.PATIENT).length
            : 0,
      },
    };

    switch (user?.role) {
      case UserRole.SUPERUSER:
        return {
          ...base,
          role: user.role,
          level: 0,
          rootId: 'PLATFORM',
          rootLabel: 'NexCare Platform',
          description:
            'Platform scope — every region, hospital, staff account and patient on NexCare.',
          visibleRoles: Object.values(UserRole),
        };

      case UserRole.REGIONAL_MANAGER:
        return {
          ...base,
          role: user.role,
          level: 1,
          rootId: `REGION-${user.id}`,
          rootLabel: `${user.name}'s region`,
          description: `Regional scope — the ${base.counts.hospitals} hospital(s) assigned to you and everyone working in them. Hospitals in another officer's region are not visible.`,
          visibleRoles: [
            UserRole.HOSPITAL_MANAGER,
            UserRole.ADMINISTRATIVE_STAFF,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.AMBULANCE,
          ],
        };

      case UserRole.HOSPITAL_MANAGER:
        return {
          ...base,
          role: user.role,
          level: 2,
          rootId: user.hospitalId || 'UNKNOWN',
          rootLabel: this.hospitalName(user.hospitalId),
          description: 'Hospital scope — your own hospital and its staff only.',
          visibleRoles: [
            UserRole.ADMINISTRATIVE_STAFF,
            UserRole.DOCTOR,
            UserRole.NURSE,
            UserRole.AMBULANCE,
          ],
        };

      case UserRole.ADMINISTRATIVE_STAFF:
        return {
          ...base,
          role: user.role,
          level: 2,
          rootId: user.hospitalId || 'UNKNOWN',
          rootLabel: this.hospitalName(user.hospitalId),
          description: 'Hospital scope — the desk you work at and its staff roster.',
          visibleRoles: [UserRole.DOCTOR, UserRole.NURSE, UserRole.AMBULANCE, UserRole.PATIENT],
        };

      default:
        return {
          ...base,
          role: user?.role || 'guest',
          level: 3,
          rootId: user?.id || 'SELF',
          rootLabel: user?.name || 'You',
          description: 'Personal scope — your own records only.',
          visibleRoles: [],
          counts: { ...base.counts, patients: 0 },
        };
    }
  }

  // ── Small helpers ─────────────────────────────────────────────────────────

  private hospitalName(hospitalId?: string): string {
    if (!hospitalId) return 'Unassigned';
    const hospital = this.hospitalsStore.load().find(h => h.id === hospitalId);
    return hospital ? hospital.name : hospitalId;
  }

  /** Display names, matching what the portals show. */
  private roleLabel(role: string): string {
    const labels: Record<string, string> = {
      [UserRole.SUPERUSER]: 'Admin',
      [UserRole.REGIONAL_MANAGER]: 'Regional Officer',
      [UserRole.HOSPITAL_MANAGER]: 'Hospital Manager',
      [UserRole.ADMINISTRATIVE_STAFF]: 'Administrative Staff',
      [UserRole.AMBULANCE]: 'Ambulance Staff',
      [UserRole.DOCTOR]: 'Doctor',
      [UserRole.NURSE]: 'Nurse',
      [UserRole.PATIENT]: 'Patient',
    };
    return labels[role] || role;
  }
}
