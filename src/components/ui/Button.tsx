"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  ui?: {
    basic?: {
      primaryText: string;
      primaryColor: string;
      secondaryColor: string;
      secondaryText: string;
    };
  };
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  disabled = false,
  type = "button",
  fullWidth = true,
  leftIcon,
  ui,
}) => {
  
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(media.matches);

    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  const baseClasses =
    "group relative flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition";

  const bgColor = isDark
    ? ui?.basic?.secondaryColor || "#f5ba01"
    : ui?.basic?.primaryColor || "#fb2c36";

  const textColor = isDark
    ? ui?.basic?.secondaryText || "#000000"
    : ui?.basic?.primaryText || "#ffffff";

  const enabledClass = "hover:opacity-90 dark:hover:brightness-110";
  const disabledClass = "bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed";

  const finalClass = `text-nowrap ${baseClasses} ${
    isLoading || disabled ? disabledClass : enabledClass
  } ${fullWidth ? "w-full" : ""} focus:ring-red-500`;

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={isLoading || disabled}
      className={finalClass}
      style={{
        cursor: "pointer",
        backgroundColor: isLoading || disabled ? undefined : bgColor,
        color: isLoading || disabled ? undefined : textColor,
      }}
    >
      {leftIcon && !isLoading && <>{/* render left icon if needed */}</>}
      {isLoading ? (
        <span className="flex items-center gap-2" style={{ color: textColor }}>
          <FaSpinner className="animate-spin" style={{ color: textColor }} />
          Please wait...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
