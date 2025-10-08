import MyError from "@services/MyError";
import cleanUrls from "@utils/CleanUrl";
import { DecryptData } from "@utils/cryptoUtils";
import { FormData, ProjectInfo } from "@utils/types";

interface CalendarImage {
  id: number;
  name: string;
  needsCropping: boolean;
  month: string;
  [key: string]: string | number | boolean;
}

export const FetchDoctors = async (
  projectData: ProjectInfo,
  employeeCode: string,
) => {
  if (!projectData?.project_hash) {
    return {
      success: false,
      message: "Something left behind. Please refresh and try again.",
    };
  }

  if (!employeeCode) {
    return {
      success: false,
      message: "Employee code is required. Please login again.",
    };
  }

  const apiUrl = process.env.NEXT_PUBLIC_PROJECT_URL;

  if (!apiUrl) {
    throw new Error("API url is missing. Pleach check");
  }

  try {
    const response = await fetch(`${apiUrl}/doctor/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        project_hash: projectData.project_hash,
        employee_hash: employeeCode,
      }),
    });

    if (!response.ok) {
      console.error(
        `FetchDoctors error: Server responded with status ${response.status}`,
      );
      throw new Error(`Server responded with status ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonErr) {
      console.error("FetchDoctors error: Failed to parse JSON", jsonErr);
      throw new Error("Invalid server response format.");
    }

    const isVlpProject = projectData.project_hash === "vlp6k2ze";
    const data = result?.data;

    if (isVlpProject && Array.isArray(data)) {
      const cleanedData = cleanUrls(data);

      return {
        success: true,
        data: cleanedData,
        cached: false,
      };
    }

    return {
      success: true,
      result: result,
      data: Array.isArray(data) || typeof data === "object" ? data : [],
      cached: false,
    };
  } catch (error: any) {
    MyError(error);
    console.error("FetchDoctors catch block error:", error?.message || error);
    return {
      success: false,
      message:
        error?.message ||
        "An unexpected error occurred while fetching doctors.",
    };
  }
};

export const FetchDoctor = async (
  projectData: ProjectInfo,
  doctorHash: string,
) => {
  if (!projectData?.project_hash) {
    return {
      success: false,
      message: "Something left behind. Please refresh and try again.",
    };
  }

  if (!doctorHash) {
    return {
      success: false,
      message: "DoctorHash Required",
    };
  }

  const apiUrl = process.env.NEXT_PUBLIC_PROJECT_URL;

  if (!apiUrl) {
    throw new Error("API url is missing. Pleach check");
  }

  try {
    const response = await fetch(`${apiUrl}/doctor/single/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        project_hash: projectData.project_hash,
        doctor_hash: doctorHash,
      }),
    });

    if (!response.ok) {
      console.error(
        `FetchDoctors error: Server responded with status ${response.status}`,
      );
      throw new Error(`Server responded with status ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonErr) {
      console.error("FetchDoctors error: Failed to parse JSON", jsonErr);
      throw new Error("Invalid server response format.");
    }

    const isVlpProject = projectData.project_hash === "vlp6k2ze";
    const data = result?.data;

    if (isVlpProject && Array.isArray(data)) {
      const cleanedData = cleanUrls(data);

      return {
        success: true,
        data: cleanedData,
        cached: false,
      };
    }

    return {
      success: true,
      data: Array.isArray(data) || typeof data === "object" ? data : [],
      cached: false,
    };
  } catch (error: any) {
    MyError(error);
    console.error("FetchDoctors catch block error:", error?.message || error);
    return {
      success: false,
      message:
        error?.message ||
        "An unexpected error occurred while fetching doctors.",
    };
  }
};

function mapFormDataToFields(formData: FormData, project: ProjectInfo) {
  return project?.config?.field?.map((field, index) => {
    let value = formData[field.name] ?? field.default_value ?? "";

    if (value === "Other" && formData?.[`other-${field.name}`]) {
      value = formData[`other-${field.name}`];
    }

    return {
      id: field.id ?? index + 1,
      value: value,
    };
  });
}

export const SaveDoctors = async (
  projectData: ProjectInfo,
  employeeCode: string,
  formData: any,
  doctorCode: string,
) => {
  let prevData;

  const apiUrl = process.env.NEXT_PUBLIC_PROJECT_URL;
  if (!apiUrl) {
    throw new Error("API url is missing. Please check");
  }
  if (doctorCode) {
    prevData = DecryptData(`${doctorCode}-prevData`);
  }
  if (!projectData?.project_hash) {
    return {
      success: false,
      message: "Something left behind. Please refresh and try again.",
    };
  }
  if (projectData?.config?.employee && !employeeCode) {
    return {
      success: false,
      message: "Employee code is required. Please logout and login again.",
    };
  }
  if (!formData) {
    return {
      success: false,
      message: "Data missed. Please logout and login again.",
    };
  }

  const countryCode = projectData?.config?.doctor?.country_codes
    ? projectData?.config?.doctor?.country_codes?.[0] || +91
    : null;

  const fields = mapFormDataToFields(formData, projectData);

  const trailingPath =
    "https://pub-0b6394cfeda24bf196c98e1746afe09b.r2.dev/production";

  let photo = formData?.photo?.originalImage || "";
  if (photo.startsWith(trailingPath)) {
    photo = photo?.replace(trailingPath, "");
  }

  let cropped_image = formData?.photo?.croppedImage || "";
  if (cropped_image.startsWith(trailingPath)) {
    cropped_image = cropped_image?.replace(trailingPath, "");
  }

  // -------------- Name with Prefix Logic ----------------
  const name = projectData?.config?.doctor?.disable_doctor_prefix
    ? `${formData?.name}`
    : `${formData?.prefix}. ${formData?.name}`;

  // -------------- Calendar Images Logic ----------------
  const calendarData: Record<string, string> = {};

  const MONTH_NAMES = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  if (
    projectData?.product_type === "DeskCalendar" &&
    formData?.calendar_images?.length > 0
  ) {
    const images = formData?.calendar_images || [];
    const totalMonths = 12;

    // ✅ Step 1: Pre-fill all months with empty strings
    MONTH_NAMES.forEach((m) => {
      calendarData[m] = "";
      calendarData[`${m}_cropped`] = "";
    });

    // ✅ Step 2: Generate filled array (cycle through uploaded images)
    const filledImages: CalendarImage[] = Array.from(
      { length: totalMonths },
      (_, i) => {
        if (images.length === 0) {
          return {} as CalendarImage;
        } else if (images?.length === 1) {
          return images[0];
        } else if (images?.length === 2) {
          return images[i % 2];
        } else {
          return images[i % images?.length];
        }
      },
    );

    // ✅ Step 3: Assign URLs for each month
    filledImages.forEach((img, index) => {
      const month = MONTH_NAMES[index]; // directly map to fixed month order
      if (!img) return;

      // Prefer the image matching that month's data
      const monthUrl = img[month] || img[img.month?.toLowerCase()] || "";
      const monthCroppedUrl =
        img[`${month}_cropped`] ||
        img[`${img.month?.toLowerCase()}_cropped`] ||
        "";

      calendarData[month] = String(monthUrl);
      calendarData[`${month}_cropped`] = String(monthCroppedUrl);
    });
  }

  console.log("Calendar Data:", calendarData);
  try {
    const requestBody = {
      project_hash: projectData.project_hash,
      doctor_hash: doctorCode,
      employee_hash: projectData?.config?.employee ? employeeCode : null,
      name,
      fields,
      mobile: projectData?.config?.doctor?.disable_mobile_number
        ? null
        : countryCode + formData?.mobile,
      media: {
        images: photo,
        cropped_image,
        calendarData,
      },
    };

    const response = await fetch(`${apiUrl}/doctor/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(
        `SaveDoctors error: Server responded with status ${response.status}`,
      );
      throw new Error(
        `Save Fail:- Server responded with status ${response.status}, Doctor Data: ${JSON.stringify(
          formData,
        )}`,
      );
    }

    const responseData = await response.json();

    return {
      success: true,
      message: "Doctor Register Successfully",
      doctorHash: responseData.hash,
    };
  } catch (error: any) {
    MyError(error);
    console.error("SaveDoctors catch block error:", error?.message || error);
    return {
      success: false,
      message:
        error?.message || "An unexpected error occurred while saving doctors.",
    };
  }
};

export const CheckMobile = async (
  projectData: ProjectInfo,
  mobile: string,
  employeeHash: string,
) => {
  if (!projectData?.project_hash) {
    return {
      success: false,
      message: "Something left behind. Please refresh and try again.",
    };
  }

  if (!mobile) {
    return {
      success: false,
      message: "mobile Required",
    };
  }

  const apiUrl = process.env.NEXT_PUBLIC_PROJECT_URL;

  if (!apiUrl) {
    throw new Error("API url is missing. Please check");
  }

  const countryCode = projectData?.config?.doctor?.country_codes?.[0] || "+91";

  try {
    const response = await fetch(`${apiUrl}/doctor/mobile/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        project_hash: projectData.project_hash,
        employee_hash: employeeHash,
        mobile: countryCode + mobile,
      }),
    });

    if (!response.ok) {
      console.error(
        `FetchDoctors error: Server responded with status ${response.status}`,
      );
      throw new Error(`Server responded with status ${response.status}`);
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonErr) {
      console.error("FetchDoctors error: Failed to parse JSON", jsonErr);
      throw new Error("Invalid server response format.");
    }

    // Return the complete result object, not just data
    return {
      success: result.success,
      exists: result.exists,
      other_employee: result.other_employee,
      message: result.message,
      data: result.data || {},
      cached: false,
    };
  } catch (error: any) {
    MyError(error);
    console.error("FetchDoctors catch block error:", error?.message || error);
    return {
      success: false,
      message:
        error?.message ||
        "An unexpected error occurred while fetching doctors.",
    };
  }
};
