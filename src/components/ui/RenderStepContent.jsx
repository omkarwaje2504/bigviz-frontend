"use client";
import { useEffect, useState } from "react";
import InputField from "./InputField";
import PhotoUploadEditor from "./PhotoUpload";
import AudioUploadEditor from "./AudioUploadEditor";
import { FaStar } from "react-icons/fa";
import CalendarPage from "@components/ui/Calendar";
import MyError from "@services/MyError";

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

  useEffect(() => {
    if (formData?.name?.length > 5) {
      setFormData({ ...formData, name: cleanName(formData?.name) });
    }
  }, [formData?.name]);

  const handleValidationChange = (key) => (isValid) => {
    setValidationStatus((prev) => ({ ...prev, [key]: isValid }));
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
              />
            </div>

            {!projectData?.features?.includes("disable_mobile_number") && (
              <div>
                <InputField
                  id="mobile"
                  label="Mobile Number*"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => {
                    let val = e.target.value;

                    try {
                      const regex = new RegExp(
                        projectData?.config?.doctor?.regex?.replace(
                          /^\/|\/$/g,
                          "",
                        ),
                      );

                      if (regex.test(val)) {
                        if (!val.startsWith(countryCode)) {
                          val = `${countryCode}${val}`;
                        }
                      }
                    } catch (err) {
                      console.warn("Invalid regex from backend:", err);
                      MyError(err);
                    }

                    setFormData({ ...formData, mobile: val });
                  }}
                  required
                  placeholder={`e.g. ${countryCode}9876543210`}
                  validation={{
                    regex: new RegExp(
                      projectData?.config?.doctor?.regex?.replace(
                        /^\/|\/$/g,
                        "",
                      ),
                    ),
                    message: `Enter a valid Indian mobile number with ${countryCode} prefix`,
                    trim: true,
                    maxLength: 13,
                  }}
                  onValidationChange={handleValidationChange("mobile_number")}
                />
              </div>
            )}
          </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* {console.log(dynamicFields)} */}
              {dynamicFields.map((field) =>
                field?.additional_config?.includes("backstage_only") ? null : (
                  <InputField
                    key={field.id}
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
                ),
              )}
            </div>
        </div>
      );
    case 2:
      return (
        <div className="space-y-6">
          {projectData?.product_type === "DeskCalendar" ? (
            <CalendarPage
              projectData={projectData}
              formData={formData}
              setFormData={setFormData}
              ui={ui}
            />
          ) : (
            !projectData?.config?.doctor?.disable_photo_upload && (
              <PhotoUploadEditor
                ui={ui}
                projectData={projectData}
                setPhotoUploadStatus={setPhotoUploadStatus}
                formData={formData}
                setFormData={setFormData}
              />
            )
          )}
        </div>
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
