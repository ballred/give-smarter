export default function CheckInQrPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900">
          QR check-in kiosk
        </h1>
        <p className="text-sm text-zinc-600">
          This view will activate the camera scanner once configured.
        </p>
      </header>
      <div className="flex h-80 items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white text-sm text-zinc-500">
        Camera scanner placeholder
      </div>
    </div>
  );
}
