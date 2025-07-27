"use client";
import React, { ReactNode } from "react";
import { FaSpinner } from "react-icons/fa";
import config from "@utils/Config";

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  leftIcon?: ReactNode;
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  disabled = false,
  type = "button",
  fullWidth = true,
  leftIcon,
}) => {
  const baseClasses =
    "group relative flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition";

  const theme = config().theme;

  const enabledClass = `${theme.selectedBg} ${theme.selectedText} hover:opacity-90 dark:hover:brightness-110`;
  const disabledClass =
    "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed";

  const finalClass = `${baseClasses} ${
    isLoading || disabled ? disabledClass : enabledClass
  } ${fullWidth ? "w-full" : ""} focus:ring-red-500`;

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={isLoading || disabled}
      className={finalClass}
    >
      {leftIcon && !isLoading && (
        <span className="flex items-center">{leftIcon}</span>
      )}
      {isLoading ? (
        <span className="flex items-center gap-2">
          <FaSpinner className="animate-spin text-white" />
          Please wait...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
