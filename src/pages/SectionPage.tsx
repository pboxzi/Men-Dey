import {PageHeader} from '../components/ui/PageHeader';
import {EmptyState} from '../components/ui/EmptyState';

export function SectionPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        title="Section ready"
        description="Route, access control and layout are in place. Interface work for this section arrives in the next build phase."
      />
    </div>
  );
}
