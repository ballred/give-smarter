import { redirect } from "next/navigation";
import { checkInByQr } from "../checkin-actions";

type SearchParams = {
  success?: string;
  error?: string;
  attendee?: string;
};

export default async function CheckInQrPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const showSuccess = resolvedSearchParams.success === "1";
  const error = resolvedSearchParams.error;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">
          QR check-in kiosk
        </h1>
        <p className="text-sm text-stone-600">
          This view will activate the camera scanner once configured.
        </p>
      </header>

      {showSuccess ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Check-in recorded.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          {error === "missing"
            ? "Enter a QR code to check in."
            : "QR code not found."}
        </div>
      ) : null}

      <form
        className="flex flex-wrap items-center gap-3 rounded-3xl border border-dashed border-amber-200/60 bg-white p-6"
        action={async (formData) => {
          "use server";
          try {
            const attendeeId = await checkInByQr(formData);
            redirect(`/admin/check-in/qr?success=1&attendee=${attendeeId}`);
          } catch (err) {
            const message = err instanceof Error ? err.message : "";
            const code = message.toLowerCase().includes("required")
              ? "missing"
              : "not_found";
            redirect(`/admin/check-in/qr?error=${code}`);
          }
        }}
      >
        <input
          name="qrCode"
          placeholder="Enter or scan QR code"
          className="h-12 flex-1 rounded-full border border-amber-200/60 bg-white px-5 text-sm text-stone-900"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center rounded-full bg-teal-700 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal-800"
        >
          Check in
        </button>
      </form>

      <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-amber-200/60 bg-white text-sm text-stone-500">
        Camera scanner placeholder
      </div>
    </div>
  );
}
