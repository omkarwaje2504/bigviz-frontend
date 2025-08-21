import MyError from "@services/MyError";

export const LoginSubmission = async (formData: any, projectInfo: any) => {
  if (!formData.code || !projectInfo?.project_hash) {
    return { success: false, message: "Invalid input data" };
  }
  try {
    const loginResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/employee/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          project_hash: projectInfo?.project_hash,
          employee_code: formData.code,
        }),
      },
    );

    const response = await loginResponse.json();
    if (!response.data) {
      if (
        response.message ===
        "Invalid employee code or employee not found in this project."
      ) {
        throw new Error("Employee code is wrong. Please check and retry");
      } else {
        throw new Error("Login fail. Please try again.");
      }
    }
    return { success: true, data: response.data };
  } catch (error: any) {
    MyError(error);
    return { success: false, message: error.message };
  }
};
