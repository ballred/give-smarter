import { getPortalDonors } from "../portal-data";
import {
  preferenceKey,
  preferenceOptions,
  updateDonorProfile,
} from "./profile-actions";

export default async function DonorProfilePage() {
  const portal = await getPortalDonors({ includePreferences: true });
  const identity = portal?.identity ?? null;
  const donors = portal?.donors ?? [];

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Profile</h1>
        <p className="text-sm text-zinc-600">
          Update your contact information and communication preferences.
        </p>
      </header>

      {!donors.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          We could not find a donor profile tied to this account yet. Complete a
          donation or ticket purchase to create one.
        </div>
      ) : (
        <div className="space-y-6">
          {donors.map((donor) => {
            const preferences = donor.communicationPreferences ?? [];
            const prefMap = new Map(
              preferences.map((pref) => [
                preferenceKey(pref.channel, pref.category),
                pref.optedIn,
              ]),
            );
            const orgName =
              donor.organization.publicName || donor.organization.legalName;

            return (
              <form
                key={donor.id}
                action={updateDonorProfile}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
              >
                <input type="hidden" name="donorId" value={donor.id} />
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      {orgName}
                    </h2>
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
                      Donor profile
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-emerald-700"
                  >
                    Save updates
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-zinc-600">
                    Preferred name
                    <input
                      name="preferredName"
                      defaultValue={donor.preferredName ?? ""}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-zinc-600">
                    Mobile phone
                    <input
                      name="primaryPhone"
                      defaultValue={donor.primaryPhone ?? ""}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
                    />
                  </label>
                  <label className="space-y-2 text-sm text-zinc-600 md:col-span-2">
                    Email
                    <input
                      disabled
                      value={
                        donor.primaryEmail ??
                        identity?.emails?.[0] ??
                        "No email on file"
                      }
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
                    />
                  </label>
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Communication preferences
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {preferenceOptions.map((pref) => {
                      const key = preferenceKey(pref.channel, pref.category);
                      const checked = prefMap.has(key)
                        ? prefMap.get(key)
                        : true;

                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600"
                        >
                          <input
                            type="checkbox"
                            name={key}
                            defaultChecked={checked}
                            className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                          />
                          <span>{pref.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Email changes are managed through your sign-in account.
                  </p>
                </div>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
