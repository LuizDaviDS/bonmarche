import Image from "next/image";
import type { ReactNode } from "react";

export function AccessShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream font-sans text-ink">
      <header className="mx-auto flex min-h-[68px] w-[calc(100%-40px)] max-w-[1180px] items-center justify-between border-b border-line max-sm:min-h-16 max-sm:w-[calc(100%-32px)]">
        <div className="flex items-center gap-2">
          <Image
            src="/bonmarche-logo.png"
            alt=""
            width={54}
            height={54}
            priority
            className="block size-[54px] object-contain max-sm:size-11"
          />
          <span className="font-serif text-base font-extrabold text-plum-dark">Bonmarché</span>
        </div>
      </header>
      {children}
    </div>
  );
}
