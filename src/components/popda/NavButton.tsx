// src/components/popda/NavButton.tsx
import { Link } from "react-router-dom";
import { DocsIcon, FormIcon, GroupIcon, PageIcon, TaskIcon } from "../../icons";

interface NavButtonProps {
  to: string;
  label: string;
  iconType: "form" | "task" | "docs" | "page" | "group";
  color?: "primary" | "success" | "warning" | "info";
}

export default function NavButton({ to, label, iconType, color = "primary" }: NavButtonProps) {
  const colorClasses = {
    primary: "text-brand-500 bg-brand-50 dark:bg-brand-500/10 dark:text-brand-400",
    success: "text-success-500 bg-success-50 dark:bg-success-500/10 dark:text-success-400",
    warning: "text-warning-500 bg-warning-50 dark:bg-warning-500/10 dark:text-warning-400",
    info:    "text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
  }[color];

  const icons = {
    form:  FormIcon,
    task:  TaskIcon,
    docs:  DocsIcon,
    page:  PageIcon,
    group: GroupIcon,
  };
  const IconComponent = icons[iconType];

  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-5 text-center transition-all hover:shadow-lg hover:border-transparent dark:border-gray-800 dark:bg-white/[0.03] group min-h-[140px]"
    >
      {/* Container Ikon */}
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${colorClasses}`}>
        <IconComponent className="size-7" />
      </div>

      {/* Teks label */}
      <span className="text-base font-semibold text-gray-800 dark:text-white/90 group-hover:text-brand-500 transition-colors line-clamp-2 leading-tight">
        {label}
      </span>
    </Link>
  );
}
