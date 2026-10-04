import {useId, type ReactNode} from 'react';

interface FieldProps {
  label: string;
  children: (props: {id: string; 'aria-describedby': string}) => ReactNode;
  hint?: string;
  error?: string;
}

export function Field({label, children, hint, error}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </label>
      {children({id, 'aria-describedby': message ? messageId : ''})}
      {message ? (
        <p
          id={messageId}
          className={`text-xs ${error ? 'text-danger' : 'text-muted'}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
