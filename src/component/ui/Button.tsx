interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ children, isLoading, variant = 'primary', ...props }: ButtonProps) => {
  const styles = variant === 'primary' 
    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
    : "bg-slate-100 hover:bg-slate-200 text-slate-800";

  return (
    <button 
      {...props}
      disabled={isLoading || props.disabled}
      className={`${styles} px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center`}
    >
      {isLoading ? "Processing..." : children}
    </button>
  );
};