import React, { useId } from 'react';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, required, children, className }: FieldProps) {
  return (
    <div className={`field ${className ?? ''}`}>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="field-req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="field-hint" id={htmlFor ? `${htmlFor}-hint` : undefined}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={htmlFor ? `${htmlFor}-error` : undefined} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function Input({ invalid, className, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      aria-describedby={rest['aria-describedby']}
      className={`input ${className ?? ''}`}
    />
  );
}

export function Textarea({ invalid, className, ...rest }: TextareaProps) {
  return (
    <textarea
      {...rest}
      aria-invalid={invalid || undefined}
      className={`textarea ${className ?? ''}`}
    />
  );
}

export function Select({ invalid, className, children, ...rest }: SelectProps) {
  return (
    <select {...rest} aria-invalid={invalid || undefined} className={`select ${className ?? ''}`}>
      {children}
    </select>
  );
}

export function Checkbox({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className="choice">
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

interface TextFieldProps extends Omit<InputProps, 'name'> {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wrapClassName?: string;
}

export function TextField({
  label,
  name,
  hint,
  error,
  required,
  wrapClassName,
  ...rest
}: TextFieldProps) {
  const auto = useId();
  const id = rest.id ?? `${name}-${auto}`;
  const described = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={wrapClassName}
    >
      <Input
        {...rest}
        id={id}
        name={name}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={described || undefined}
      />
    </Field>
  );
}

interface TextAreaFieldProps extends Omit<TextareaProps, 'name'> {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wrapClassName?: string;
}

export function TextAreaField({
  label,
  name,
  hint,
  error,
  required,
  wrapClassName,
  ...rest
}: TextAreaFieldProps) {
  const auto = useId();
  const id = rest.id ?? `${name}-${auto}`;
  const described = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={wrapClassName}
    >
      <Textarea
        {...rest}
        id={id}
        name={name}
        required={required}
        invalid={Boolean(error)}
        aria-describedby={described || undefined}
      />
    </Field>
  );
}

interface SelectFieldProps extends Omit<SelectProps, 'name'> {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wrapClassName?: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export function SelectField({
  label,
  name,
  hint,
  error,
  required,
  wrapClassName,
  options,
  placeholder,
  ...rest
}: SelectFieldProps) {
  const auto = useId();
  const id = rest.id ?? `${name}-${auto}`;
  const described = [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <Field
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      required={required}
      className={wrapClassName}
    >
      <select
        {...rest}
        id={id}
        name={name}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={described || undefined}
        className="select"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
