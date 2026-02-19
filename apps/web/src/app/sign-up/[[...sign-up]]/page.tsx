import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--gs-surface)] px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_36%,rgba(251,247,242,0.9),transparent)]" />

      <div className="relative w-full max-w-md space-y-6 text-center">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700/80">
            GiveSmarter
          </p>
          <h1
            className="text-4xl font-semibold text-stone-900"
            style={{ fontFamily: "var(--font-campaign-display)" }}
          >
            Create your account
          </h1>
          <p className="text-sm text-stone-600">
            Join your team and start managing fundraising in one place.
          </p>
        </div>
        <div className="flex justify-center">
          <SignUp path="/sign-up" routing="path" />
        </div>
      </div>
    </div>
  );
}
