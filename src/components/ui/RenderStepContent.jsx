"use client";
import { useEffect, useState } from "react";
import InputField from "./InputField";
import PhotoUploadEditor from "./PhotoUpload";
import AudioUploadEditor from "./AudioUploadEditor";
import { FaStar } from "react-icons/fa";
import CalendarPage from "@components/ui/Calendar";
import MyError from "@services/MyError";
import { CheckMobile, CheckMObile } from "@actions/user";
import { EncryptData } from "@utils/cryptoUtils";

const cleanName = (name) => {
  const prefixes = ["Dr", "Prof", "Mr", "Mrs", "dr", "prof", "mr", "mrs"];
  let newName = name;
  for (const p of prefixes) {
    if (newName.startsWith(`${p}. `) || newName.startsWith(`${p} `)) {
      newName = newName.substring(p.length + 1).trim();
      break;
    } else if (newName.startsWith(`${p}.`)) {
      newName = newName.substring(p.length).trim();
      break;
    }
  }
  return newName;
};

const getMaxLengthFromRegex = (str) => {
  if (!str) return undefined;

  let total = 0;

  const quantifiers = [...str.matchAll(/\{(\d+)\}/g)];
  total += quantifiers.reduce((sum, m) => sum + parseInt(m[1], 10), 0);

  const charClasses = [...str.matchAll(/\[[^\]]+\](?!\{)/g)];
  total += charClasses.length;

  const groups = [...str.matchAll(/\(([^)]+)\)/g)];
  for (const g of groups) {
    const options = g[1].split("|");
    const allSingleChar = options.every((opt) => opt.length === 1);
    total += allSingleChar ? 1 : Math.max(...options.map((opt) => opt.length));
  }

  return total > 0 ? total : undefined;
};

const RenderStepContent = ({
  ui,
  formData,
  setFormData,
  projectData,
  currentStep,
  setPhotoUploadStatus,
  setAudioUploadStatus,
  setValidationStatus,
}) => {
  const [audioName, setAudioName] = useState("");
  const dynamicFields = projectData?.config?.field || [];
  const prefixOptions = projectData?.config?.doctor?.prefix || ["Dr"];
  const countryCode = projectData?.config?.doctor?.country_codes?.[0] || +91;
  const [showStep2Confirm, setShowStep2Confirm] = useState(true);
  const isRxPadImage = projectData?.product_type === "RxPad" ? true : false;

  useEffect(() => {
    if (formData?.name?.length > 5) {
      setFormData({ ...formData, name: cleanName(formData?.name) });
    }
  }, [formData?.name]);

  const handleValidationChange = (key) => (isValid) => {
    setValidationStatus((prev) => ({ ...prev, [key]: isValid }));
  };

  const [showMobileModal, setShowMobileModal] = useState(false);
  const [existingDoctor, setExistingDoctor] = useState(null);

  const handleMobileCheck = async (mobile) => {
    try {
      const result = await CheckMobile(projectData, mobile);
      console.log(result);
      if (result?.data && result?.message !== "Mobile number is available.") {
        setExistingDoctor(result?.data);
        setShowMobileModal(true);
      }
    } catch (err) {
      MyError(err);
      console.error("Mobile check failed:", err);
    }
  };

  const handleUseSameDoctor = () => {
    if (existingDoctor) {
      console.log(existingDoctor);
      let tempData = {
        name: existingDoctor?.name,
        mobile: existingDoctor?.mobile?.replace(/^\+91/, "") || "",
        prefix: "Dr",
        photo: {
          croppedImage: existingDoctor?.image,
          originalImage: existingDoctor?.cropped_image,
        },
      };

      if (projectData?.config?.field?.length) {
        projectData.config.field.forEach((field) => {
          const matchingField = existingDoctor?.fields?.find(
            (f) => String(f.id) === String(field.id),
          );

          tempData[field.name] = matchingField
            ? matchingField.value
            : field.default_value || "";
        });
      }

      setFormData(tempData);

      EncryptData("prevData", tempData);
      EncryptData("formData", tempData);
    }
    setShowMobileModal(false);
  };

  const handleNewContact = () => {
    setFormData((prev) => ({
      ...prev,
      name: "",
      prefix: "Dr",
      photo: {},
      ...(projectData?.config?.field?.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {}) || {}),
    }));
    setShowMobileModal(false);
  };

  const getFilteredFieldsForStep1 = () => {
    if (projectData?.product_type === "RxPad") {
      return dynamicFields.filter(
        (field) =>
          !field?.additional_config?.includes("backstage_only") &&
          field.type !== "file upload",
      );
    }
    return dynamicFields.filter(
      (field) => !field?.additional_config?.includes("backstage_only"),
    );
  };

  const getFileUploadFieldsForStep2 = () => {
    if (projectData?.product_type === "RxPad") {
      return dynamicFields.filter(
        (field) =>
          !field?.additional_config?.includes("backstage_only") &&
          field.type === "file upload",
      );
    }
    return [];
  };

  switch (currentStep) {
    case 1:
      return (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
            {ui?.DoctorRegistrationForm?.FormTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <InputField
                ui={ui}
                id="name"
                label={`${projectData?.config?.doctor?.label || "Doctor Name"} *`}
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                }}
                required
                prefix={formData.prefix}
                prefixOptions={prefixOptions}
                onPrefixChange={(e) =>
                  setFormData({ ...formData, prefix: e.target.value })
                }
                projectData={projectData}
              />
            </div>

            {!projectData?.features?.includes("disable_mobile_number") && (
              <div>
                <InputField
                  ui={ui}
                  id="mobile"
                  label={`${ui?.DoctorRegistrationForm?.MobileInputLable}*`}
                  type="tel"
                  value={formData.mobile}
                  countryCode={
                    ui?.DoctorRegistrationForm?.MobileValidation
                      ? countryCode
                      : undefined
                  }
                  onChange={(e) => {
                    let val = e.target.value;

                    if (ui?.DoctorRegistrationForm?.MobileValidation) {
                      try {
                        const regex = new RegExp(
                          projectData?.config?.doctor?.regex?.replace(
                            /^\/|\/$/g,
                            "",
                          ),
                        );

                        const maxLength = getMaxLengthFromRegex(
                          projectData?.config?.doctor?.regex,
                        );

                        if (val.length === maxLength && regex.test(val)) {
                          handleMobileCheck(val);
                        }
                      } catch (err) {
                        console.warn("Invalid regex from backend:", err);
                        MyError(err);
                      }
                    }

                    setFormData({ ...formData, mobile: val });
                  }}
                  onBlur={() => {
                    if (formData.mobile) {
                      handleMobileCheck(formData.mobile);
                    }
                  }}
                  required
                  placeholder={`e.g. ${
                    ui?.DoctorRegistrationForm?.MobileValidation
                      ? countryCode
                      : ""
                  }9876543210`}
                  validation={
                    ui?.DoctorRegistrationForm?.MobileValidation
                      ? {
                          regex: new RegExp(
                            projectData?.config?.doctor?.regex?.replace(
                              /^\/|\/$/g,
                              "",
                            ),
                          ),
                          message: `Enter a valid mobile number`,
                          trim: true,
                          maxLength: getMaxLengthFromRegex(
                            projectData?.config?.doctor?.regex,
                          ),
                        }
                      : undefined
                  }
                  onValidationChange={
                    ui?.DoctorRegistrationForm?.MobileValidation
                      ? handleValidationChange("mobile_number")
                      : undefined
                  }
                  projectData={projectData}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getFilteredFieldsForStep1().map((field) => (
              <InputField
                key={field.id}
                ui={ui}
                projectData={projectData}
                id={field.name}
                label={
                  field.display_name + (field.validations?.required ? " *" : "")
                }
                type={field.type}
                value={String(formData[field.name] ?? "")}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
                required={field?.additional_config?.includes("is_required")}
                placeholder={field.placeholder}
                options={field.options || []}
                validation={{
                  regex:
                    field.validations?.min || field.validations?.max
                      ? new RegExp(
                          `^.{${field.validations.min || 0},${
                            field.validations.max || 100
                          }}$`,
                        )
                      : undefined,
                  message: `Enter valid ${field.label}`,
                }}
                onValidationChange={handleValidationChange(field.name)}
              />
            ))}
          </div>
          {showMobileModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-96 shadow-lg">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Mobile Already Exists
                </h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                  Doctor with this mobile number already exists. Do you want to
                  use the same details or enter a new contact?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 cursor-pointer bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={handleNewContact}
                  >
                    New Contact
                  </button>
                  <button
                    className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    onClick={handleUseSameDoctor}
                  >
                    Use Same
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    case 2:
      return (
        <>
          {showStep2Confirm ? (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
              <div className="bg-white dark:bg-gray-400 shadow-xl flex flex-col items-center gap-6 rounded-2xl w-[90%] max-w-md p-6 animate-fadeIn">
                {/* Heading / Title */}
                <h2 className="text-lg font-semibold text-black dark:text-gray-800 text-center">
                  Check the examples to identify the correct and incorrect
                  formats
                </h2>

                {/* Image Section */}
                {isRxPadImage ? (
                  <div className="flex gap-4 justify-center items-center w-full">
                    <img
                      className="rounded-lg h-24 w-24 object-cover border-2 border-green-500 shadow-md"
                      src="/right-1.jpg"
                      alt="Correct"
                    />
                    <img
                      className="rounded-lg h-24 w-24 object-cover border-2 border-red-500 shadow-md"
                      src="/wrong-1.jpg"
                      alt="Incorrect"
                    />
                  </div>
                ) : (
                  <div className="flex gap-4 justify-center items-center w-full">
                    <img
                      className="rounded-lg h-24 w-24 object-cover border-2 border-green-500 shadow-md"
                      src="/right-2.jpg"
                      alt="Correct"
                    />
                    <img
                      className="rounded-lg h-24 w-24 object-cover border-2 border-red-500 shadow-md"
                      src="/wrong-3.jpg"
                      alt="Incorrect"
                    />
                  </div>
                )}

                {/* Action Button */}
                <button
                  className="mt-4 cursor-pointer px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium shadow-md transition"
                  onClick={() => setShowStep2Confirm(false)}
                >
                  Got it
                </button>
              </div>
            </div>
          ) : (
            // Case 2 content
            <div className="space-y-6">
              {projectData?.product_type === "DeskCalendar" ? (
                <CalendarPage
                  projectData={projectData}
                  formData={formData}
                  setFormData={setFormData}
                  ui={ui}
                />
              ) : (
                <>
                  {!projectData?.config?.doctor?.disable_photo_upload && (
                    <PhotoUploadEditor
                      ui={ui}
                      projectData={projectData}
                      setPhotoUploadStatus={setPhotoUploadStatus}
                      formData={formData}
                      setFormData={setFormData}
                    />
                  )}

                  {projectData?.product_type === "RxPad" && (
                    <div className="">
                      {getFileUploadFieldsForStep2().map((field) => (
                        <InputField
                          key={field.id}
                          ui={ui}
                          projectData={projectData}
                          id={field.name}
                          label={
                            field.display_name +
                            (field.validations?.required ? " *" : "")
                          }
                          type={field.type}
                          value={String(formData[field.name] ?? "")}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.name]: e.target.value,
                            }))
                          }
                          required={field?.additional_config?.includes(
                            "is_required",
                          )}
                          placeholder={field.placeholder}
                          options={field.options || []}
                          validation={{
                            regex:
                              field.validations?.min || field.validations?.max
                                ? new RegExp(
                                    `^.{${field.validations.min || 0},${
                                      field.validations.max || 100
                                    }}$`,
                                  )
                                : undefined,
                            message: `Enter valid ${field.label}`,
                          }}
                          onValidationChange={handleValidationChange(
                            "rxpad_image",
                          )}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      );

    case 3:
      return (
        <div className="space-y-6">
          <AudioUploadEditor
            projectData={projectData}
            setFormData={setFormData}
            formData={formData}
            setAudioUploadStatus={setAudioUploadStatus}
          />
        </div>
      );
    case 4:
      return (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">
            Cinema Selection & Final Details
          </h2>

          {/* Theater Preferences */}
          <div>
            <InputField
              projectData={projectData}
              ui={ui}
              id="theaterPreference"
              label="Select Cinema Locations*"
              type="select"
              value={formData.theaterPreference}
              onChange={(e) =>
                setFormData({ ...formData, theaterPreference: e.target.value })
              }
              required
              options={[
                {
                  label: "PVR Phoenix Marketcity",
                  value: "PVR Phoenix Marketcity",
                },
                { label: "PVR Viman Nagar", value: "PVR Viman Nagar" },
                { label: "PVR Pavillion Mall", value: "PVR Pavillion Mall" },
                { label: "PVR Kumar Pacific", value: "PVR Kumar Pacific" },
                {
                  label: "PVR Amanora Town Centre",
                  value: "PVR Amanora Town Centre",
                },
              ]}
            />
          </div>

          {/* Show Dates */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                ui={ui}
                projectData={projectData}
                id="showDates"
                label="Advertisement Start Date*"
                type="date"
                value={formData.showDates}
                onChange={(e) =>
                  setFormData({ ...formData, showDates: e.target.value })
                }
                required
              />

              <InputField
                ui={ui}
                projectData={projectData}
                id="showTimes"
                label="Select Run Duration*"
                type="select"
                value={formData.showTimes}
                onChange={(e) =>
                  setFormData({ ...formData, showTimes: e.target.value })
                }
                required
                options={[
                  { label: "1 week", value: "1 week" },
                  { label: "2 weeks", value: "2 weeks" },
                  { label: "1 month", value: "1 month" },
                  { label: "3 months", value: "3 months" },
                ]}
              />
            </div>
          </div>

          {/* Movie Selection Preview */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-4">
              Your Ad Will Run Before These Films
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <img
                  src="/api/placeholder/120/180"
                  alt="Movie poster"
                  className="rounded w-full"
                />
                <div className="flex items-center">
                  <FaStar color="#FFD700" size={14} className="mr-1" />
                  <span className="text-white text-xs">8.5</span>
                </div>
                <p className="text-white text-sm">Top Blockbuster</p>
              </div>
              <div className="space-y-2">
                <img
                  src="/api/placeholder/120/180"
                  alt="Movie poster"
                  className="rounded w-full"
                />
                <div className="flex items-center">
                  <FaStar color="#FFD700" size={14} className="mr-1" />
                  <span className="text-white text-xs">7.8</span>
                </div>
                <p className="text-white text-sm">New Release</p>
              </div>
              <div className="space-y-2">
                <img
                  src="/api/placeholder/120/180"
                  alt="Movie poster"
                  className="rounded w-full"
                />
                <div className="flex items-center">
                  <FaStar color="#FFD700" size={14} className="mr-1" />
                  <span className="text-white text-xs">8.1</span>
                </div>
                <p className="text-white text-sm">Family</p>
              </div>
              <div className="space-y-2">
                <img
                  src="/api/placeholder/120/180"
                  alt="Movie poster"
                  className="rounded w-full"
                />
                <div className="flex items-center">
                  <FaStar color="#FFD700" size={14} className="mr-1" />
                  <span className="text-white text-xs">9.0</span>
                </div>
                <p className="text-white text-sm">Premium</p>
              </div>
            </div>
          </div>

          {/* Cinema Theater Gallery */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-white font-medium mb-4">Theater Preview</h3>
            <div className="grid grid-cols-2 gap-4">
              <img
                src="/api/placeholder/250/150"
                alt="Cinema interior"
                className="rounded w-full"
              />
              <img
                src="/api/placeholder/250/150"
                alt="Cinema screen"
                className="rounded w-full"
              />
            </div>
          </div>
          {/* Consent Checkbox */}
          <div className="mt-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, consent: !prev.consent }))
                }
                className="mt-1"
                required
              />
              <span className="ml-2 text-gray-300 text-sm">
                I confirm that all information provided is accurate and I have
                the rights to use the uploaded media. I consent to BigViz
                displaying this advertisement in the selected cinema locations.
              </span>
            </label>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default RenderStepContent;
