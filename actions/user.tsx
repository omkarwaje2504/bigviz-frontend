import MyError from "@services/MyError";
import cleanUrls from "@utils/CleanUrl";
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
  return project.config.field.map((field, index) => {
    return {
      id: field.id ?? index + 1, // use field.id if available, else fallback to index
      value: formData[field.name] ?? field.default_value ?? "",
    };
  });
}

export const SaveDoctors = async (
  projectData: ProjectInfo,
  employeeCode: string,
  formData: any,
) => {
  console.log(formData)
  if (!projectData?.project_hash) {
    return {
      success: false,
      message: "Something left behind. Please refresh and try again.",
    };
  }

  if (!employeeCode) {
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


  let rxpadImage = "";
  if (projectData?.product_type === "RxPad" && formData?.rxpad_image) {
    rxpadImage = formData.rxpad_image || "";
    if (rxpadImage.startsWith(unwantedBase)) {
      rxpadImage = rxpadImage.replace(unwantedBase, ""); 
    }
  }

  
  try {
    const requestBody: any = {
      project_hash: projectData.project_hash,
      employee_hash: employeeCode,
      image_path: photo,
      name: `${formData?.prefix}. ${formData?.name}`,
      mobile: countryCode + formData?.mobile,
      fields,
    };


    if (projectData?.product_type === "RxPad" && rxpadImage) {
      console.log("hetre")
      requestBody.rxpad = rxpadImage;
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
      doctorHash: responseData.hash
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

