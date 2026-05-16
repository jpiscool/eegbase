import { redirect } from "next/navigation";

// Mendi confirmed (May 2026) there is no public SDK; an independent BLE
// integration is the supported model. The old /mendi-sdk page framed
// the work as "waiting on Mendi to ship an SDK" which is no longer
// accurate. The Mendi marketing page now reflects the current posture.
export default function MendiSdkPage() {
  redirect("/mendi");
}
