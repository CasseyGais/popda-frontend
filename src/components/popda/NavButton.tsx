// src/components/popda/NavButton.tsx
import { Link } from "react-router-dom";
import { FormIcon, TaskIcon } from "../../icons";  // atau "@/assets/icons" kalau pakai alias

interface NavButtonProps {
  to: string;
  label: string;
  iconType: "form" | "task";
  color?: "primary" | "success";
}

export default function NavButton({ to, label, iconType, color = "primary" }: NavButtonProps) {
  const colorClasses = {
    primary: "text-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400",
    success: "text-success-500 bg-success-50 dark:bg-success-500/10 dark:text-success-400",
  }[color];

  const IconComponent = iconType === "form" ? FormIcon : TaskIcon;

  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-5 text-center transition-all hover:shadow-lg hover:border-transparent dark:border-gray-800 dark:bg-white/[0.03] group min-h-[140px]" // ↑ p-3 → p-5, min-h-120 → 140
    >
      {/* Container Ikon - diperbesar */}
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${colorClasses}`}> {/* ↑ h-10 → h-14, w-10 → w-14 */}
        <IconComponent className="size-7" /> {/* ↑ size-5 → size-7 */}
      </div>
      
      {/* Teks label - sedikit lebih besar & tetap kompak */}
      <span className="text-base font-semibold text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors line-clamp-2 leading-tight"> {/* ↑ text-sm → text-base */}
        {label}
      </span>
    </Link>
  );
}