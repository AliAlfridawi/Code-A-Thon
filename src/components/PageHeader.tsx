import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-[var(--page-header-margin)] flex flex-col gap-[var(--page-header-gap)] sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="mb-2 font-headline text-[var(--page-title-size)] font-extrabold leading-none tracking-tight text-primary">
          {title}
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-lg">
          {description}
        </p>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}
