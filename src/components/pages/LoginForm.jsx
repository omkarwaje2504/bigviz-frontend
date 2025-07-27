"use client";

import { useState } from "react";
import InputField from "@components/ui/InputField";
import Button from "@components/ui/Button";
import { FaTicketAlt, FaLock, FaMobileAlt, FaUser } from "react-icons/fa";
import { useRouter } from "next/navigation";
import config from "@utils/Config";
import { LoginSubmission } from "@actions/loginApis";
import { DecryptData, EncryptData } from "@utils/cryptoUtils";
import MyError from "@services/MyError";

const validations = {
  code: {
    regex: /^[A-Za-z0-9]{4,10}$/,
    message: "Enter a valid access code (4–10 uppercase letters/numbers).",
  },
  password: {
    regex: /^.{6,}$/,
    message: "Password must be at least 6 characters.",
  },
  mobile: {
    regex: /^(?:\+91|91|0)?[6-9]\d{9}$/,
    message: "Enter a valid 10-digit mobile number.",
  },
};

const LoginForm = ({ ui, loginType, projectData }) => {
  const [formData, setFormData] = useState({
    code: "",
    password: "",
    mobile: "",
  });
  const [validationStatus, setValidationStatus] = useState({
    code: false,
    password: false,
    mobile: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (key) => (e) => {
    const { type, value, files } = e.target;
    const finalValue = type === "file" ? files?.[0]?.name || "" : value;

    setFormData((prev) => ({
      ...prev,
      [key]: finalValue,
    }));
  };

  const handleValidationChange = (key) => (isValid) => {
    setValidationStatus((prev) => ({
      ...prev,
      [key]: isValid,
    }));
  };

  const isFormValid = () => {
    if (loginType === "code") return validationStatus.code;
    if (loginType === "code-password")
      return validationStatus.code && validationStatus.password;
    if (loginType === "mobile") return validationStatus.mobile;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    const loginResponse = await LoginSubmission(formData, projectData);

    if (loginResponse.success) {
      const empData = loginResponse.data.employee;
      EncryptData("empData", empData);
      router.push(`/${projectData?.id}/homepage`);
    } else {
      setErrors({
        form: loginResponse.message || "Login failed. Please try again.",
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-8 space-y-6 text-gray-800 dark:text-gray-100">
      <form onSubmit={handleSubmit} className="space-y-4">
        {loginType === "code" && (
          <InputField
            id="code"
            label={ui.loginPage.loginLabel}
            icon={<FaTicketAlt className="text-gray-400" />}
            type="text"
            value={formData.code}
            onChange={handleChange("code")}
            validation={validations.code}
            onValidationChange={handleValidationChange("code")}
            required
            disabled={isSubmitting}
          />
        )}

        {loginType === "code-password" && (
          <>
            <InputField
              id="code"
              label={ui.loginPage.loginLabel}
              icon={<FaTicketAlt className="text-gray-400" />}
              type="text"
              value={formData.code}
              onChange={handleChange("code")}
              validation={validations.code}
              onValidationChange={handleValidationChange("code")}
              required
              disabled={isSubmitting}
            />
            <InputField
              id="password"
              label={ui.loginPage.passwordLabel}
              icon={<FaLock className="text-gray-400" />}
              type="password"
              value={formData.password}
              onChange={handleChange("password")}
              validation={validations.password}
              onValidationChange={handleValidationChange("password")}
              required
              disabled={isSubmitting}
            />
          </>
        )}

        {loginType === "mobile" && (
          <InputField
            id="mobile"
            label={ui.loginPage.mobileLabel}
            icon={<FaMobileAlt className="text-gray-400" />}
            type="tel"
            value={formData.mobile}
            onChange={handleChange("mobile")}
            validation={validations.mobile}
            onValidationChange={handleValidationChange("mobile")}
            required
            disabled={isSubmitting}
          />
        )}

        {errors.form && (
          <p className="text-red-600 dark:text-red-400 text-sm">
            {errors.form}
          </p>
        )}

        <div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!isFormValid() || isSubmitting}
            leftIcon={
              <FaUser className="text-red-300 group-hover:text-red-200" />
            }
          >
            {ui.loginPage.loginButtomLabel}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
