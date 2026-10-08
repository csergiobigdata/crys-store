import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar cupom — Admin" };

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!coupon) notFound();

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Editar cupom
      </h1>
      <div className="mt-8">
        <CouponForm coupon={coupon} />
      </div>
    </div>
  );
}
