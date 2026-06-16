import { redirect } from 'next/navigation';

/**
 * /upgrade is a legacy route kept for backwards compatibility.
 * Server-side redirect to /pricing — no client flash, no JS required.
 */
export default function UpgradePage() {
  redirect('/pricing');
}
