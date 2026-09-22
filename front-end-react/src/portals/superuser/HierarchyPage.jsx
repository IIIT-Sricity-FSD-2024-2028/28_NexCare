import HierarchyView from '../../features/hierarchy/HierarchyView';
import { SuPage } from './suShared';

// superuser/hierarchy.html: the shared hierarchy view of the whole platform
// (the backend picks the subtree from the token — here, the root).
export default function HierarchyPage() {
  return (
    <SuPage title="Organisation Hierarchy">
      <HierarchyView
        heading="Organisation Hierarchy"
        description="The whole platform: every region, the hospitals in it, and the people who staff them."
      />
    </SuPage>
  );
}
