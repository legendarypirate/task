import * as React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children, className, ...props }) => {
  return (
    <label
      {...props}
      className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className ?? ""}`}
    >
      {children}
    </label>
  );
};
