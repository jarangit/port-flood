import type { ReactNode } from "react";

type PublicPageLayoutProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PublicPageLayout({ title, description, children }: PublicPageLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="max-w-3xl min-w-0">
        <p className="text-sm font-medium text-primary">ท่วมไทย</p>
        <h1 className="mt-3 break-words text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">{description}</p>
      </div>
      <div className="mt-7 min-w-0 sm:mt-8">{children}</div>
    </main>
  );
}
