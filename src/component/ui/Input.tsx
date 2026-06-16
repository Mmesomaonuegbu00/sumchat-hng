interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = ({ label, ...props }: InputProps) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold mb-1 uppercase text-slate-400">{label}</label>}
    <input 
      {...props}
      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black transition-all"
    />
  </div>
);