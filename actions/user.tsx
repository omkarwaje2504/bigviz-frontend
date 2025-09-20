import MyError from "@services/MyError";
import cleanUrls from "@utils/CleanUrl";
import { DecryptData } from "@utils/cryptoUtils";
import { FormData, ProjectInfo } from "@utils/types";

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
       result:result,
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
    return {
      id: field.id ?? index + 1, 
      value: formData[field.name] ?? field.default_value ?? "",
    };
  });
}

export const SaveDoctors = async (
  projectData: ProjectInfo,
  employeeCode: string,
  formData: any,
  doctorCode: string,
) => {
  
  let prevData = DecryptData("prevData")
  
  if (!projectData?.project_hash) {
    return {
      success: false,
      message: "Something left behind. Please refresh and try again.",
    };
  }

  if (!employeeCode && projectData?.project_hash!=="16qv9pow") {
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

  const apiUrl = process.env.NEXT_PUBLIC_PROJECT_URL;
  if (!apiUrl) {
    throw new Error("API url is missing. Please check");
  }

  const fields = mapFormDataToFields(formData, projectData);
  const countryCode = projectData?.config?.doctor?.country_codes?.[0] || +91;

  const unwantedBase =
    "https://pub-0b6394cfeda24bf196c98e1746afe09b.r2.dev/production/";

  let photo = formData?.photo?.originalImage || "";
  if (photo.startsWith(unwantedBase)) {
    photo = photo.replace(unwantedBase, "");
  }

  let cropped_image = formData?.photo?.croppedImage || "";
  if (cropped_image.startsWith(unwantedBase)) {
    cropped_image = cropped_image.replace(unwantedBase, "");
  }

  try {
    let requestBody: any = {
      project_hash: projectData.project_hash,
      employee_hash: employeeCode,
      doctor_hash: doctorCode,
    };

    let updatedformData = {
      ...formData,
      name: `${formData.prefix}. ${formData.name}`, 
    };
    
    if (prevData && JSON.stringify(prevData) === JSON.stringify(updatedformData)) {
      requestBody.doctor_hash=doctorCode;
      requestBody.name = `${formData?.prefix}. ${formData?.name}`;
    } else {
      requestBody = {
        ...requestBody,
        media: { images: photo, cropped_image },
        name: `${formData?.prefix}. ${formData?.name}`,
        mobile: countryCode + formData?.mobile,
        fields,
      };
    }

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
        `SaveDoctors error: Server responded with status ${response.status}`
      );
      throw new Error(
        `Save Fail:- Server responded with status ${response.status}, Doctor Data: ${JSON.stringify(
          formData
        )}`
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
    throw new Error("API url is missing. Pleach check");
  }
  const countryCode = projectData?.config?.doctor?.country_codes?.[0] || +91;
  try {
    const response = await fetch(`${apiUrl}/doctor/mobile/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        project_hash: projectData.project_hash,
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

    const data = result?.data;

    return {
      success: true,
      data: Array.isArray(data) || typeof data === "object" ? data : [],
      cached: false,
      message:result?.message
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



