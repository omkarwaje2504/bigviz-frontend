const CACHE_KEY_PREFIX = "doctors_";
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const FetchDoctors = async (employeeHash: string) => {
  if (!employeeHash) {
    console.log("FetchDoctors error: Employee hash is empty or undefined");
    return {
      success: false,
      message: "Employee code cannot be empty or undefined.",
    };
  }

  const cacheKey = `${CACHE_KEY_PREFIX}${employeeHash}`;

  // ✅ Check localStorage cache
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    const isExpired = Date.now() > parsed.expiry;

    if (!isExpired) {
      return {
        success: true,
        data: parsed.data,
        cached: true,
      };
    } else {
      localStorage.removeItem(cacheKey); // remove expired
    }
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/employee/${employeeHash}/contact/list`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      console.log(
        "FetchDoctors error: Failed to fetch doctors. Status:",
        response.status
      );
      return {
        success: false,
        message: "Failed to fetch doctors.",
      };
    }

    const result = await response.json();

    // ✅ Save to localStorage with expiry
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data: result.data,
        expiry: Date.now() + CACHE_DURATION_MS,
      })
    );

    return {
      success: true,
      data: result.data,
      cached: false,
    };
  } catch (error) {
    console.log("FetchDoctors exception:", error);
    return {
      success: false,
      message: "Failed to fetch doctors.",
    };
  }
};
