import type { Metadata } from "next";
import { CouponForm } from "@/components/admin/coupons/coupon-form";

export const metadata: Metadata = { title: "Novo cupom — Admin" };

export default function NewCouponPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-plum">
        Novo cupom
      </h1>
      <div className="mt-8">
        <CouponForm coupon={null} />
      </div>
    </div>
  );
}
