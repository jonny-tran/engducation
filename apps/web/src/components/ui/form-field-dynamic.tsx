import React from "react";
import { Input } from "@engducation/ui/components/input";
import { Textarea } from "@engducation/ui/components/textarea";
import { Label } from "@engducation/ui/components/label";

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "custom";
  placeholder?: string;
  options?: readonly { readonly value: string; readonly label: string }[] | { value: string; label: string }[];
  className?: string;
  required?: boolean;
}

interface FormFieldDynamicProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  customRender?: React.ReactNode;
}

export function FormFieldDynamic({
  field,
  value,
  onChange,
  error,
  customRender,
}: FormFieldDynamicProps) {
  const { label, type, placeholder, options, className, required } = field;

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
        {label} {required && "*"}
      </Label>

      {type === "custom" ? (
        customRender
      ) : type === "textarea" ? (
        <Textarea
          value={value ?? ""}
          onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
          placeholder={placeholder}
          className="min-h-[80px] text-xs rounded-xl"
          aria-invalid={!!error}
        />
      ) : type === "select" ? (
        <select
          value={value ?? ""}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          className="flex h-8.5 w-full border border-border bg-background px-2.5 py-1 text-xs text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:opacity-50 dark:bg-input/30 rounded-xl"
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(type === "number" ? Number((e.target as HTMLInputElement).value) : (e.target as HTMLInputElement).value)}
          placeholder={placeholder}
          className="h-8.5 text-xs rounded-xl"
          aria-invalid={!!error}
        />
      )}

      {error && (
        <p className="text-[10px] text-destructive font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
}
