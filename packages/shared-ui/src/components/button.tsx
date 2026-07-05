import { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-900 transition hover:bg-emerald-400 ${className}`}
      {...props}
    />
  );
}
