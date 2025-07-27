import MyError from "@services/MyError";

export const LoginSubmission = async (formData: any, projectInfo: any) => {
  if (!formData.code || !projectInfo?.id) {
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
          project_hash: projectInfo?.id,
          code: formData.code,
        }),
      },
    );

    const response = await loginResponse.json();
    if (response.error) {
      throw new Error(response.error);
    }
    return { success: true, data: response.data };
  } catch (error: any) {
    MyError(error);
    return { success: false, message: error.message };
  }
};
