import React from "react";
import { Wallet } from "lucide-react";
import type { PaymentMethod } from "../services/checkout";
import vnpayLogo from "../assets/VNPAY_id-sVSMjm2_1.svg"; // hoặc "/assets/payments/vnpay.svg"

type Props = {
  value: PaymentMethod;
  onChange: (v: PaymentMethod) => void;
  className?: string;
};

type IconOption = {
  key: Extract<PaymentMethod, "COD">;
  title: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};
type ImgOption = {
  key: Extract<PaymentMethod, "VNPAY">;
  title: string;
  desc: string;
  imgSrc: string;
  imgAlt?: string;
};
type Option = IconOption | ImgOption;

const OPTIONS: Readonly<Option[]> = [
  {
    key: "COD",
    title: "Thanh toán bằng tiền mặt",
    desc: "Trả tiền mặt khi nhận hàng (COD)",
    icon: Wallet,
  },
  {
    key: "VNPAY",
    title: "VNPay",
    desc: "Quét QR / Thẻ nội địa & quốc tế",
    imgSrc: vnpayLogo,
    imgAlt: "VNPay",
  },
];

export default function PaymentMethodGrid({ value, onChange, className }: Props) {
  return (
    <div className={className} role="radiogroup" aria-label="Phương thức thanh toán">
      <div className="flex flex-col gap-3">
        {OPTIONS.map((opt) => {
          const active = value === opt.key;

          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt.key)}
              className={[
                "group w-full rounded-2xl border p-4 text-left transition",
                active
                  ? "border-rose-500 bg-rose-50 ring-2 ring-rose-200"
                  : "border-gray-200 hover:border-rose-300 hover:bg-rose-50/50",
              ].join(" ")}
            >
              <div className="flex items-center gap-4">
                {/* Icon box */}
                <div
                  className={[
                    "flex h-12 w-12 items-center justify-center rounded-xl border bg-white transition",
                    active ? "border-rose-400" : "border-gray-200",
                  ].join(" ")}
                >
                  {"icon" in opt ? (
                    <opt.icon className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <img
                      src={opt.imgSrc}
                      alt={opt.imgAlt ?? opt.title}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        // nếu lỡ ảnh lỗi thì ẩn để UI không vỡ
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>

                {/* Texts */}
                <div className="min-w-0 flex-1 cursor-pointer">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-base font-semibold">{opt.title}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-600">{opt.desc}</p>
                </div>

                {/* Radio dot */}
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border">
                  <span
                    className={[
                      "h-2.5 w-2.5 rounded-full transition",
                      active ? "bg-rose-600" : "bg-transparent",
                    ].join(" ")}
                  />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
