interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex relative w-1/2 items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative z-10 max-w-md text-center px-8">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17a5.25 5.25 0 0 0 7.41 0l3.5-3.5a5.25 5.25 0 0 0-7.42-7.42l-1.5 1.5m-3.5 3.5a5.25 5.25 0 0 0-7.41 0l-3.5 3.5a5.25 5.25 0 0 0 7.42 7.42l1.5-1.5" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-foreground">Шинный Мастер</h2>
          <p className="mt-3 text-base text-muted-foreground">
            Профессиональный шиномонтаж, хранение шин и ремонт дисков
          </p>
          <div className="mt-8 flex justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold text-foreground">7+</span>
              <span>лет опыта</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold text-foreground">500+</span>
              <span>клиентов</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold text-foreground">24/7</span>
              <span>поддержка</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        {children}
      </div>
    </div>
  );
}
