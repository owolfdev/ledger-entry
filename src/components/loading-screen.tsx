import { BookOpenText, LoaderCircle } from "lucide-react";

type LoadingScreenProps = {
  message?: string;
};

export function LoadingScreen({ message = "Loading" }: LoadingScreenProps) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-white"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex size-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/5 shadow-xl shadow-black/20">
          <BookOpenText className="size-9 text-cyan-300" aria-hidden />
          <LoaderCircle
            aria-hidden
            className="absolute -right-2 -bottom-2 size-6 animate-spin text-cyan-300"
          />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">
            Ledger
          </p>
          <p className="text-sm text-zinc-400">{message}</p>
        </div>
      </div>
    </main>
  );
}
