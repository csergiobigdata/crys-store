import "server-only";
import { geocodeCep } from "@/lib/orders/geocode";
import {
  DEFAULT_LOCAL_DELIVERY,
  haversineKm,
  type LocalDeliveryConfig,
  type LocalDeliveryInputs,
} from "@/lib/orders/local-delivery";
import { createAdminClient } from "@/lib/supabase/admin";

type StoredConfig = Partial<LocalDeliveryConfig> | undefined;

/** Configuração salva pelo admin (app_settings, chave "local_delivery") ou o padrão. */
export async function getLocalDeliveryConfig(): Promise<LocalDeliveryConfig> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "local_delivery")
    .maybeSingle();

  const stored = data?.value as StoredConfig;
  if (!stored) return DEFAULT_LOCAL_DELIVERY;

  return {
    originCep: stored.originCep ?? DEFAULT_LOCAL_DELIVERY.originCep,
    originLat: stored.originLat ?? DEFAULT_LOCAL_DELIVERY.originLat,
    originLng: stored.originLng ?? DEFAULT_LOCAL_DELIVERY.originLng,
    tiers: stored.tiers?.length ? stored.tiers : DEFAULT_LOCAL_DELIVERY.tiers,
    motoboyFee: stored.motoboyFee ?? DEFAULT_LOCAL_DELIVERY.motoboyFee,
  };
}

/**
 * Taxas e distância para a entrega local deste destino. A distância só é
 * consultada (serviço externo) quando `needed` — ou seja, quando a entrega
 * local pode ser oferecida —, para não gastar chamadas à toa.
 */
export async function resolveLocalDeliveryInputs(
  destinationCep: string,
  needed: boolean,
): Promise<LocalDeliveryInputs> {
  const config = await getLocalDeliveryConfig();

  let distanceKm: number | null = null;
  if (needed) {
    const destination = await geocodeCep(destinationCep);
    if (destination) {
      distanceKm = haversineKm({ lat: config.originLat, lng: config.originLng }, destination);
    }
  }

  return { tiers: config.tiers, motoboyFee: config.motoboyFee, distanceKm };
}
