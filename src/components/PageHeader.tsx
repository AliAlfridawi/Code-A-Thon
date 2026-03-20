import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="text-4xl font-headline font-extrabold text-primary tracking-tight mb-2">
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
