const KEY = "uff_checkout_profile";

export type CheckoutProfile = {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
};

export function loadCheckoutProfile(): CheckoutProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CheckoutProfile;
    if (!data.name && !data.phone) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveCheckoutProfile(profile: CheckoutProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    KEY,
    JSON.stringify({
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      email: profile.email.trim(),
      address: profile.address.trim(),
      notes: profile.notes?.trim() || "",
    })
  );
}

export function clearCheckoutProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
