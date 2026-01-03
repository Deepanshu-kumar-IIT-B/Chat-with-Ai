
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold tracking-tight transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transform-gpu select-none";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5",
    secondary: "bg-white text-slate-700 border-2 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 shadow-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-50 hover:border-red-200 shadow-sm",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs rounded-xl",
    md: "px-6 py-3 text-sm rounded-2xl",
    lg: "px-8 py-4 text-base rounded-[1.5rem]",
    xl: "px-12 py-6 text-lg rounded-[2.5rem]",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};
