"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  ReactNode,
  useRef,
} from "react";
import config from "@utils/Config";
import inputStyles from "styles/inputStyles";

type ValidationRule = {
  regex?: RegExp;
  message?: string;
  trim?: boolean;
  maxLength?: number;
};

type Option = {
  label: string;
  value: string;
};

type InputFieldProps = {
  id: string;
  label: string;
  icon?: ReactNode;
  type?:
    | React.HTMLInputTypeAttribute
    | "select"
    | "radio"
    | "textarea"
    | "tel"
    | "dropdown";
  value: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  validation?: ValidationRule;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  customError?: string;
  showCharCount?: boolean;
  maxLength?: number;
  options?: Option[];
  name?: string;
  onValidationChange?: (isValid: boolean) => void;
};

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  icon,
  type,
  value,
  onChange,
  validation = {},
  placeholder = "",
  autoFocus = false,
  required = false,
  disabled = false,
  customError = "",
  showCharCount = false,
  maxLength,
  options = [],
  name,
  onValidationChange,
}) => {
  const [error, setError] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const onValidationChangeRef = useRef(onValidationChange);

  const normalizedOptions = options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o,
  );

  // Keep the latest function
  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  useEffect(() => {
    const safeValue = typeof value === "string" ? value : String(value ?? "");

    let errorMessage = "";
    let isValid = true;

    if (required && !safeValue.trim()) {
      errorMessage = "This field is required";
      isValid = false;
    } else if (
      validation.regex &&
      safeValue &&
      !validation.regex.test(safeValue)
    ) {
      errorMessage = validation.message || "Invalid input format.";
      isValid = false;
    }

    setError((prev) => {
      if (prev !== errorMessage) return errorMessage;
      return prev; // no change
    });
    if (onValidationChangeRef.current) {
      onValidationChangeRef.current(isValid);
    }
  }, [value]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    let val = e.target.value;

    if (validation.trim && type !== "radio") {
      val = val.trimStart();
    }

    if (validation.maxLength && val.length > validation.maxLength) {
      return;
    }

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: val,
      },
    };

    onChange(syntheticEvent);
  };

  const errorMessage = customError || error;

  return (
    <div className="mb-4">
      <label htmlFor={id} className={inputStyles.label}>
        {required && <span className="text-red-500">*</span>} {label}
      </label>

      {type === "select" ? (
        <select
          id={id}
          name={name || id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          aria-invalid={!!errorMessage}
          className={`${inputStyles.selectBase} ${
            errorMessage
              ? inputStyles.selectErrorRing
              : inputStyles.selectDefaultRing
          }`}
        >
          <option value="" disabled hidden>
            {placeholder || "-- Select --"}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "dropdown" ? (
        <div className="relative">
          {/* clickable “button” */}
          <button
            type="button"
            id={id}
            aria-haspopup="listbox"
            aria-expanded={value ? "true" : "false"}
            disabled={disabled}
            className={`${inputStyles.selectBase} flex items-center justify-between ${
              errorMessage
                ? inputStyles.selectErrorRing
                : inputStyles.selectDefaultRing
            }`}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className={value ? "" : "text-gray-400"}>
              {value
                ? normalizedOptions.find((o) => o.value === value)?.label ||
                  value
                : placeholder || "-- Select --"}
            </span>
            {/* a tiny caret from react-icons or your own SVG */}
            <svg
              className="w-4 h-4 ml-2 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M6 8l4 4 4-4" />
            </svg>
          </button>

          {/* option list */}
          {isOpen && (
            <ul
              role="listbox"
              className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-gray-800 shadow-lg rounded-md p-1"
            >
              {normalizedOptions.map((opt) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={value === opt.value}
                  tabIndex={0}
                  onClick={(e) => {
                    // build synthetic event so the parent keeps same onChange signature
                    const synthetic = {
                      ...e,
                      target: { ...e.target, value: opt.value },
                    } as unknown as ChangeEvent<
                      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                    >;
                    onChange(synthetic);
                    setIsOpen(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.currentTarget.click();
                    }
                  }}
                  className={`cursor-pointer px-3 py-2 rounded-md ${
                    value === opt.value
                      ? "bg-indigo-600 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : type === "textarea" ? (
        <textarea
          id={id}
          name={name || id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          maxLength={maxLength}
          aria-invalid={!!errorMessage}
          className={`${inputStyles.textareaBase} ${
            icon ? inputStyles.inputWithIcon : inputStyles.inputNoIcon
          } ${errorMessage ? inputStyles.ringError : inputStyles.ringDefault}`}
        />
      ) : type === "radio" ? (
        <div className={inputStyles.radioGroup}>
          {options.map((option) => {
            const isSelected = value === option.value;
            const theme = config().theme;

            return (
              <label
                key={option.value}
                className={`${inputStyles.radioLabelBase} ${
                  isSelected
                    ? `${theme.selectedGradient} ${theme.selectedText}`
                    : `${theme.unselectedBorder} ${theme.unselectedText}`
                }`}
              >
                <input
                  type="radio"
                  name={name || id}
                  value={option.value}
                  checked={isSelected}
                  onChange={handleChange}
                  className="hidden"
                />
                <div
                  className={`${inputStyles.radioCircle} ${
                    isSelected
                      ? `${theme.dotBorder} bg-white`
                      : theme.unselectedBorder
                  }`}
                >
                  {isSelected && (
                    <div
                      className={`${inputStyles.radioDot} ${theme.selectedDot}`}
                    />
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={id}
            name={name || id}
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            required={required}
            maxLength={maxLength}
            aria-invalid={!!errorMessage}
            className={`${inputStyles.baseInput} ${
              icon ? inputStyles.inputWithIcon : inputStyles.inputNoIcon
            } ${errorMessage ? inputStyles.ringError : inputStyles.ringDefault}`}
          />
        </div>
      )}

      {showCharCount && maxLength !== undefined && (
        <p className={inputStyles.charCount}>
          {value.length}/{maxLength}
        </p>
      )}

      {errorMessage && <p className={inputStyles.errorText}>{errorMessage}</p>}
    </div>
  );
};

export default InputField;
