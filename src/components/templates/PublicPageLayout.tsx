import type { ReactNode } from "react";

type PublicPageLayoutProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PublicPageLayout({ title, description, children }: PublicPageLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Flood Check Thailand</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </main>
  );
}
