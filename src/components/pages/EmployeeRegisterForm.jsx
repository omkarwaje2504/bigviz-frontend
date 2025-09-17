"use client";

import Button from "@components/ui/Button";
import InputField from "@components/ui/InputField";
import React, { useState } from "react";
import { IoMdPerson } from "react-icons/io";
import { FaTicketAlt, FaLock, FaMobileAlt, FaUser } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { EncryptData } from "@utils/cryptoUtils";
import { RegisterEmployee } from "@actions/loginApis";
import { MdHighQuality } from "react-icons/md";
import { FaRegIdCard } from "react-icons/fa";
import { FaRegistered } from "react-icons/fa6";

const validations = {
  name: {
    regex: /^[A-Za-z\s]+$/,
    message: "Name can only contain letters and spaces.",
  },
  hq: {
    regex: /^[A-Za-z\s]+$/,
    message: "Hq can only contain letters and spaces.",
  },
  region: {
    regex: /^[A-Za-z\s]+$/,
    message: "Region can only contain letters and spaces.",
  },
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

function EmployeeRegisterForm({ ui, projectData, projectId }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    hq: "",
    region: "",
    mobile: "",
  });
  const [validationStatus, setValidationStatus] = useState({
    name: false,
    code: false,
    email: false,
    hq: false,
    region: false,
    mobile: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    let isValid = true;

    if (projectData?.config?.employee?.employee_name) {
      isValid = isValid && validationStatus.name;
    }
    if (projectData?.config?.employee?.employee_code) {
      isValid = isValid && validationStatus.code;
    }
    if (projectData?.config?.employee?.employee_Hq) {
      isValid = isValid && validationStatus.hq;
    }
    if (projectData?.config?.employee?.employee_region) {
      isValid = isValid && validationStatus.region;
    }

    return isValid;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); 

    try {
      let registerResponse = await RegisterEmployee(formData, projectData);

      if (registerResponse) {
        EncryptData("empData", registerResponse?.data?.employee);
        router.push(`/${projectData.project_hash}/homepage`);
      }
    } catch (error) {
      console.error("Registration failed", error);
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="">
      <div>
        <form className="" onSubmit={handleRegister}>
          {projectData?.config?.employee?.employee_name && (
            <InputField
              ui={ui}
              id="name"
              label={ui.EmployeeConfig.EmployeeNameLabel}
              icon={<IoMdPerson className="text-gray-400" />}
              type="text"
              value={formData.name}
              onChange={handleChange("name")}
              validation={validations.name}
              onValidationChange={handleValidationChange("name")}
              required
              disabled={isSubmitting}
              projectData={projectData}
            />
          )}
          {projectData?.config?.employee?.employee_code && (
            <InputField
              ui={ui}
              id="code"
              label={ui.EmployeeConfig.EmployeeCodeLabel}
              icon={<FaRegIdCard className="text-gray-400" />}
              type="text"
              value={formData.code}
              onChange={handleChange("code")}
              validation={validations.code}
              onValidationChange={handleValidationChange("code")}
              required
              disabled={isSubmitting}
              projectData={projectData}
            />
          )}
          {projectData?.config?.employee?.employee_Hq && (
            <InputField
              ui={ui}
              id="hq"
              label={ui.EmployeeConfig.EmployeeHQLabel}
              icon={<MdHighQuality className="text-gray-400" />}
              type="text"
              value={formData.hq}
              onChange={handleChange("hq")}
              validation={validations.hq}
              onValidationChange={handleValidationChange("hq")}
              required
              disabled={isSubmitting}
              projectData={projectData}
            />
          )}
          {projectData?.config?.employee?.employee_region && (
            <InputField
              ui={ui}
              id="region"
              label={ui.EmployeeConfig.EmployeeRegionLabel}
              icon={<FaRegistered className="text-gray-400" />}
              type="text"
              value={formData.region}
              onChange={handleChange("region")}
              validation={validations.region}
              onValidationChange={handleValidationChange("region")}
              required
              disabled={isSubmitting}
              projectData={projectData}
            />
          )}
          <div>
            <Button
              ui={ui}
              type="submit"
              isLoading={isSubmitting}
              disabled={!isFormValid() || isSubmitting}
              leftIcon={
                <FaUser className="text-red-300 group-hover:text-red-200" />
              }
            >
              {ui.loginPage.loginButtonLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeRegisterForm;
