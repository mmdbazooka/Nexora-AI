'use client';
import { Children, cloneElement, isValidElement, useId, type ReactNode } from 'react';
import { Inbox, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from './button';
export function Loading({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
      <div className="skeleton-lines">
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={26} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({ error, retry }: { error: Error; retry?: () => void }) {
  return (
    <div className="empty-state error-state" role="alert">
      <TriangleAlert size={28} />
      <h3>We couldn’t load this</h3>
      <p>{error.message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          <RefreshCw size={15} />
          Try again
        </Button>
      )}
    </div>
  );
}
interface ControlProps {
  id?: string;
  children?: ReactNode;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}
function connectControl(children: ReactNode, id: string, error?: string): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<ControlProps>(child)) return child;
    if (typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type))
      return cloneElement(child, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': error ? `${id}-error` : undefined,
      });
    return child.props.children
      ? cloneElement(child, { children: connectControl(child.props.children, id, error) })
      : child;
  });
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {connectControl(children, id, error)}
      {error && (
        <small className="field-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}
