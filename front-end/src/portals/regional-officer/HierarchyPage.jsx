import Header from '../../components/layout/Header';
import HierarchyView from '../../features/hierarchy/HierarchyView';

// regional-officer/hierarchy.html: the shared hierarchy view of the officer's
// own subtree (the backend picks the subtree from the token).
export default function HierarchyPage() {
  return (
    <>
      <Header title="My Region" />
      <div className="page-body">
        <HierarchyView
          heading="My Region"
          description="The hospitals assigned to you and everyone working in them. Another officer’s hospitals are not shown."
        />
      </div>
    </>
  );
}
