"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  ReactNode,
  useRef,
} from "react";
import inputStyles from "styles/inputStyles";
import UploadFile from "../../../services/uploadFile";
import { CiFileOn } from "react-icons/ci";
import { DecryptData } from "@utils/cryptoUtils";

type ValidationRule = {
  regex?: RegExp;
  message?: string;
  trim?: boolean;
  maxLength?: number;
};

type Option = { label: string; value: string };

type DateValue = { day: string; month: string; year: string };

type InputFieldProps = {
  ui: any;
  id: string;
  label: string;
  icon?: ReactNode;
  type?:
    | React.HTMLInputTypeAttribute
    | "select"
    | "radio"
    | "textarea"
    | "tel"
    | "dropdown"
    | "date"
    | "file";
  value: string;
  countryCode?: string;
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
  prefix?: string;
  prefixOptions?: string[];
  onPrefixChange?: (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  projectData: any;
};

const parseDateString = (dateStr: string): DateValue => {
  const [day = "", month = "", year = ""] = dateStr?.split("/") || [];
  return { day, month, year };
};

const formatDateObject = (date: DateValue): string => {
  if (!date.day && !date.month && !date.year) return "";
  return `${date.day}/${date.month}/${date.year}`;
};

function getFileNameFromUrl(url: string): string | null {
  try {
    const pathname: string = new URL(url).pathname;
    return pathname.substring(pathname.lastIndexOf("/") + 1);
  } catch (e) {
    console.error("Invalid URL:", e);
    return null;
  }
}


const InputField: React.FC<InputFieldProps> = ({
  ui,
  id,
  label,
  icon,
  type,
  value,
  countryCode,
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
  prefix,
  prefixOptions,
  onPrefixChange,
  onValidationChange,
  projectData,
}) => {
  const [error, setError] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const onValidationChangeRef = useRef(onValidationChange);
  const [detectChange, setDetectChange] = useState<number>();

  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");

 useEffect(()=>{
   let fomrData = DecryptData("formData")

  if(fomrData?.file_upload !== "" || fomrData?.file_upload !== null){
    setUploadedUrl(fomrData?.file_upload)
    setFileName(getFileNameFromUrl(fomrData?.file_upload))
  }
 },[])

  const normalizedOptions = options.map((o) =>
    typeof o === "string" ? { label: o, value: o } : o,
  );

  useEffect(() => {
    onValidationChangeRef.current = onValidationChange;
  }, [onValidationChange]);

  useEffect(() => {
    let safeValue: string;
    let isValid = true;
    let errorMessage = "";

    if (type === "date") {
      const dateValue = getDateValue();
      safeValue = `${dateValue.day}-${dateValue.month}-${dateValue.year}`;
      if (required && (!dateValue.day || !dateValue.month || !dateValue.year)) {
        errorMessage = "This field is required";
        isValid = false;
      }
    } else {
      safeValue = typeof value === "string" ? value : String(value ?? "");
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
    }

    setError((prev) => (prev !== errorMessage ? errorMessage : prev));
    if (onValidationChangeRef.current) {
      onValidationChangeRef.current(isValid);
    }
  }, [value, detectChange]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    let val = e.target.value;
    setDetectChange(1);
    if (validation.trim && type !== "radio") {
      val = val.trimStart();
    }
    if (validation.maxLength && val.length > validation.maxLength) {
      return;
    }
    const syntheticEvent = { ...e, target: { ...e.target, value: val } };
    onChange(syntheticEvent);
  };

  const [fileName, setFileName] = useState<string | null>(null); // 👈 new state

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target as HTMLInputElement;
    if (!target.files?.length) return;

    const file = target.files[0];
    setFileName(file.name); // 👈 store selected file name
    setUploadError("");
    setUploading(true);
    setUploadedUrl(null);

    try {
      const mimeType = file.type;
      let type: string = "other";
      if (mimeType.startsWith("image/")) type = "image";
      else if (mimeType.startsWith("video/")) type = "video";
      else if (mimeType.startsWith("audio/")) type = "audio";
      else if (mimeType === "application/pdf") type = "pdf";

      const uploadedUrl = await UploadFile(projectData, file, file.name, type);

      setUploadedUrl(uploadedUrl);

      const synthetic = {
        target: { value: uploadedUrl, name: id },
      } as unknown as ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >;
      onChange(synthetic);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
      setFileName(null); // reset file name on failure
    } finally {
      setUploading(false);
    }
  };

  const handleDateChange = (field: keyof DateValue, newValue: string) => {
    setDetectChange(1);
    const currentDate = getDateValue();
    const newDateValue = { ...currentDate, [field]: newValue };
    const formattedDate = formatDateObject(newDateValue);

    const synthetic = {
      target: { value: formattedDate },
    } as unknown as ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >;
    onChange(synthetic);
  };

  const getDateValue = (): DateValue => {
    if (type === "date") {
      if (typeof value === "object" && value !== null) {
        return value as DateValue;
      }
      if (typeof value === "string") {
        return parseDateString(value);
      }
    }
    return { day: "", month: "", year: "" };
  };

  const dateValue = getDateValue();
  const errorMessage = customError || error;

  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className={`
          ${inputStyles.label}
          ${label === "RxPad Upload" ? "text-xl font-bold text-white px-4" : ""}
        `}
      >
        {required && <span className="text-red-500">*</span>} {label}
      </label>

      {/* SELECT */}
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
      ) : // DATE
      type === "date" ? (
        <div className="grid grid-cols-3 gap-2">
          <select
            name={`${name || id}_day`}
            value={dateValue.day}
            onChange={(e) => handleDateChange("day", e.target.value)}
            disabled={disabled}
            required={required}
            className={`${inputStyles.selectBase} ${
              errorMessage
                ? inputStyles.selectErrorRing
                : inputStyles.selectDefaultRing
            }`}
          >
            <option value="" disabled hidden>
              Day
            </option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <option key={day} value={day.toString().padStart(2, "0")}>
                {day}
              </option>
            ))}
          </select>

          <select
            name={`${name || id}_month`}
            value={dateValue.month}
            onChange={(e) => handleDateChange("month", e.target.value)}
            disabled={disabled}
            required={required}
            className={`${inputStyles.selectBase} ${
              errorMessage
                ? inputStyles.selectErrorRing
                : inputStyles.selectDefaultRing
            }`}
          >
            <option value="" disabled hidden>
              Month
            </option>
            {[
              { value: "01", label: "January" },
              { value: "02", label: "February" },
              { value: "03", label: "March" },
              { value: "04", label: "April" },
              { value: "05", label: "May" },
              { value: "06", label: "June" },
              { value: "07", label: "July" },
              { value: "08", label: "August" },
              { value: "09", label: "September" },
              { value: "10", label: "October" },
              { value: "11", label: "November" },
              { value: "12", label: "December" },
            ].map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>

          <select
            name={`${name || id}_year`}
            value={dateValue.year}
            onChange={(e) => handleDateChange("year", e.target.value)}
            disabled={disabled}
            required={required}
            className={`${inputStyles.selectBase} ${
              errorMessage
                ? inputStyles.selectErrorRing
                : inputStyles.selectDefaultRing
            }`}
          >
            <option value="" disabled hidden>
              Year
            </option>
            {Array.from({ length: 26 }, (_, i) => 2025 - i).map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      ) : // DROPDOWN
      type === "dropdown" ? (
        <div className="relative">
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
            <svg
              className="w-4 h-4 ml-2 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M6 8l4 4 4-4" />
            </svg>
          </button>
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
      ) : // TEXTAREA
      type === "textarea" ? (
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
      ) : // RADIO
      type === "radio" ? (
        <div className={inputStyles.radioGroup}>
          {options.map((option) => {
            const isSelected = value === option.value;
            const theme = ui.theme;
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
      ) : // FILE UPLOAD
      type === "file upload" ? (
        <div className="w-full mt-5 px-4">
          
          <label
            htmlFor={id}
            className={`
            relative border-2 border-dashed rounded-lg py-8 text-center h-80 flex flex-col items-center justify-center cursor-pointer
            ${uploading ? "opacity-50 cursor-wait" : "opacity-100"}
            ${uploadedUrl ? "border-green-500 bg-green-50" : "border-gray-600"}
          `}
          >
            <div className="text-gray-400 mb-4 bg-gray-800 p-4 rounded-full">
              <CiFileOn size={40} />
            </div>
             
            <p className="mt-2 text-xl font-medium">
              {uploading ? (
                "Uploading..."
              ) : uploadedUrl ? (
                <span className="text-green-600 flex flex-col items-center">
                  {fileName && <>✅ {fileName}</>}
                  <span className="text-sm text-black mt-1">
                    Edit / Replace file
                  </span>
                </span>
              ) : (
                <span className="text-gray-400">Click to upload</span>
              )}
            </p>

            <input
              id={id}
              name={name || id}
              type="file"
              disabled={disabled || uploading}
              required={required}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {uploading && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          )}

          {uploadError && (
            <p className="text-red-600 text-sm mt-3">{uploadError}</p>
          )}
        </div>
      ) : (
        <div className="relative flex gap-0.5">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          {id === "name" && prefixOptions && (
            <select
              id="prefix"
              value={prefix || ""}
              onChange={onPrefixChange}
              disabled={disabled}
              className={`${inputStyles.selectBase} ${
                errorMessage
                  ? inputStyles.selectErrorRing
                  : inputStyles.selectDefaultRing
              } !w-16 appearance-none`}
            >
              {prefixOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
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

      {showCharCount &&
        maxLength !== undefined &&
        typeof value === "string" && (
          <p className={inputStyles.charCount}>
            {value.length}/{maxLength}
          </p>
        )}

      {errorMessage && ui?.ErroMessageConfig?.isErrorMessageEnable && (
        <p className={inputStyles.errorText}>{errorMessage}</p>
      )}
    </div>
  );
};

export default InputField;
