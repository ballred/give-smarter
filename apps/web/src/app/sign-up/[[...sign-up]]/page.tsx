import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gs-surface)] px-6 py-16">
      <SignUp path="/sign-up" routing="path" />
    </div>
  );
}
