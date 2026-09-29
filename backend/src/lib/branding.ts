import { Role, type StoreSettings } from "@prisma/client";
import { prisma } from "./prisma";
import { getStoreSettings } from "./settings-data";

export const DEFAULT_STORE_NAME = "Your Restaurant";
export const DEFAULT_STORE_TAGLINE = "Order in minutes";
export const PRODUCT_NAME = "Restaurant OS";
export const DEVSORA_URL = "https://www.devsora.pro/";

export function storeNameFrom(settings?: Partial<Pick<StoreSettings, "storeName">> | null) {
  const name = settings?.storeName?.trim();
  return name || DEFAULT_STORE_NAME;
}

export async function getEmailBranding() {
  const settings = await getStoreSettings();
  return {
    storeName: storeNameFrom(settings),
    storeTagline: settings.storeTagline?.trim() || DEFAULT_STORE_TAGLINE,
    emailNotifyChef: settings.emailNotifyChef,
    emailNotifyCashier: settings.emailNotifyCashier,
    emailNotifyRider: settings.emailNotifyRider,
  };
}

/** Recipients for new-order staff alert emails (admin always included). */
export async function staffOrderAlertEmails(settings: StoreSettings) {
  const roles: Role[] = [Role.ADMIN];
  if (settings.emailNotifyChef) roles.push(Role.CHEF);
  if (settings.emailNotifyCashier) roles.push(Role.CASHIER);

  const staff = await prisma.user.findMany({
    where: { role: { in: roles }, isActive: true },
    select: { email: true },
  });
  const extra = [process.env.NOTIFY_EMAIL, process.env.ADMIN_EMAIL].filter(Boolean) as string[];
  return [...new Set([...staff.map((s) => s.email), ...extra])];
}
