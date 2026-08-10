import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  OctagonAlert,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        info: "border-border bg-muted/50 text-foreground [&_svg]:text-muted-foreground",
        success: "border-success/30 bg-success/10 text-foreground [&_svg]:text-success",
        warning: "border-warning/30 bg-warning/10 text-foreground [&_svg]:text-warning",
        destructive:
          "border-destructive/30 bg-destructive/10 text-foreground [&_svg]:text-destructive",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const toneIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: OctagonAlert,
} as const;

type AlertProps = Omit<ComponentProps<"div">, "title"> &
  VariantProps<typeof alertVariants> & {
    title?: ReactNode;
    /** Set false to drop the leading icon (e.g. inside a dense list). */
    icon?: boolean;
  };

function Alert({
  className,
  tone = "info",
  title,
  icon = true,
  children,
  ...props
}: AlertProps) {
  const Icon = toneIcons[tone ?? "info"];

  return (
    <div
      data-slot="alert"
      role={tone === "destructive" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {icon ? <Icon aria-hidden /> : null}
      <div className="flex min-w-0 flex-col gap-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? (
          <div className="text-muted-foreground [&_p]:leading-relaxed">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export { Alert, alertVariants };
export type { AlertProps };
