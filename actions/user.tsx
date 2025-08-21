import MyError from "@services/MyError";
import cleanUrls from "@utils/CleanUrl";

export const FetchDoctors = async (projectData: any, employeeCode: string) => {
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
