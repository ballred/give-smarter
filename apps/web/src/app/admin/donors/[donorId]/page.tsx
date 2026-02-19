import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateDonor } from "../donor-actions";

export default async function DonorDetailPage({
  params,
}: {
  params: Promise<{ donorId: string }>;
}) {
  const resolvedParams = await params;
  const donor = await prisma.donor.findUnique({
    where: { id: resolvedParams.donorId },
    include: {
      organization: { select: { publicName: true } },
      emails: true,
      phones: true,
      addresses: true,
    },
  });

  if (!donor) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          {donor.organization.publicName}
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          {donor.displayName ??
            ([donor.firstName, donor.lastName].filter(Boolean).join(" ") ||
            "Unnamed donor")}
        </h1>
        <p className="text-sm text-zinc-600">Donor ID: {donor.id}</p>
      </header>

      <form
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        action={async (formData) => {
          "use server";
          await updateDonor(donor.id, formData);
          redirect(`/admin/donors/${donor.id}`);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Display name
            <input
              name="displayName"
              type="text"
              defaultValue={donor.displayName ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Preferred name
            <input
              name="preferredName"
              type="text"
              defaultValue={donor.preferredName ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            First name
            <input
              name="firstName"
              type="text"
              defaultValue={donor.firstName ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Last name
            <input
              name="lastName"
              type="text"
              defaultValue={donor.lastName ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-700">
            Primary email
            <input
              name="primaryEmail"
              type="email"
              defaultValue={donor.primaryEmail ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Primary phone
            <input
              name="primaryPhone"
              type="tel"
              defaultValue={donor.primaryPhone ?? ""}
              className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </label>
        </div>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800"
        >
          Update donor
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Emails</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-600">
            {donor.emails.length ? (
              donor.emails.map((email) => (
                <div key={email.id}>{email.email}</div>
              ))
            ) : (
              <div>—</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Phones</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-600">
            {donor.phones.length ? (
              donor.phones.map((phone) => (
                <div key={phone.id}>{phone.phoneE164}</div>
              ))
            ) : (
              <div>—</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">Addresses</h2>
          <div className="mt-3 space-y-2 text-sm text-zinc-600">
            {donor.addresses.length ? (
              donor.addresses.map((address) => (
                <div key={address.id}>
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <div>
                    {address.city}, {address.region} {address.postalCode}
                  </div>
                </div>
              ))
            ) : (
              <div>—</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
