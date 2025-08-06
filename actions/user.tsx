import MyError from "@services/MyError";

const CACHE_KEY_PREFIX = "doctors_";
const CACHE_DURATION_MS = 2 * 60 * 1000; // 5 minutes

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

  // const cacheKey = `${CACHE_KEY_PREFIX}${employeeCode}`;

  // // ✅ Check localStorage cache
  // const cachedData = localStorage.getItem(cacheKey);
  // if (cachedData) {
  //   const parsed = JSON.parse(cachedData);
  //   const isExpired = Date.now() > parsed.expiry;

  //   if (!isExpired) {
  //     return {
  //       success: true,
  //       data: parsed.data,
  //       cached: true,
  //     };
  //   } else {
  //     localStorage.removeItem(cacheKey); // remove expired
  //   }
  // }

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

    // // ✅ Save to localStorage with expiry
    // localStorage.setItem(
    //   cacheKey,
    //   JSON.stringify({
    //     data: result.data,
    //     expiry: Date.now() + CACHE_DURATION_MS,
    //   }),
    // );

    return {
      success: true,
      data: result.data,
      cached: false,
    };
  } catch (error) {
    console.log("FetchDoctors exception:", error);
    MyError(error);
    return {
      success: false,
      message: "Failed to fetch doctors.",
    };
  }
};
