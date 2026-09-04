import { forwardRef, type ComponentPropsWithoutRef } from "react";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  size?: "default" | "compact" | "icon";
  variant?: "primary" | "secondary" | "tertiary" | "destructive";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-teal-700 font-semibold text-white hover:bg-teal-800 focus-visible:outline-teal-600",
  secondary:
    "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 focus-visible:outline-teal-600",
  tertiary:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-teal-600",
  destructive:
    "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 focus-visible:outline-red-600",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "px-3 py-2",
  compact: "px-3 py-1",
  icon: "size-9 p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    size = "default",
    type = "button",
    variant = "secondary",
    ...props
  },
  ref,
) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClasses[size]} ${variantClasses[variant]}${className ? ` ${className}` : ""}`}
      ref={ref}
      type={type}
      {...props}
    />
  );
});
