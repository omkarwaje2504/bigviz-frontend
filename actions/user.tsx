import MyError from "@services/MyError";

function cleanUrls(dataArray: any) {
  return dataArray.map((item: any) => {
    const cleanUrl = (url: string): string => {
      return url.replace(/\/\d+\/production/, "/production");
    };

    return {
      ...item,
      image: cleanUrl(item.image),
      download_url: cleanUrl(item.download_url),
    };
  });
}

export const FetchDoctors = async (projectData: any, employeeCode: string) => {
  if (!projectData) {
    console.log("FetchDoctors error: ProjectData is empty or undefined");
    return {
      success: false,
      message: "ProjectData is missing. Please Login again",
    };
  }

  if (!employeeCode) {
    console.log("FetchDoctors error: Employee hash is empty or undefined");
    return {
      success: false,
      message: "Employee code cannot be empty or undefined. Please Login again",
    };
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/doctor/fetch`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          project_hash: projectData?.project_hash,
          employee_hash: employeeCode,
        }),
      },
    );

    if (!response.ok) {
      console.log(
        "FetchDoctors error: Failed to fetch doctors. Status:",
        response.status,
      );
      throw new Error("No Response");
    }

    const result = await response.json();
    if (projectData?.name === "Lloyd") {
      const data = result.data;
      const updatedArray = cleanUrls(data);
      return {
        success: true,
        data: updatedArray,
        cached: false,
      };
    } else {
      return {
        success: true,
        data: result.data,
        cached: false,
      };
    }
  } catch (error) {
    MyError(error);
    return {
      success: false,
      message: "Failed to fetch doctors.",
    };
  }
};
