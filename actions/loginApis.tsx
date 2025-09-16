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


export const RegisterEmployee = async (formData: any, projectInfo: any) => {
  if (!formData.code || !projectInfo?.project_hash) {
    return { success: false, message: "Invalid input data" };
  }
  try {
    const loginResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/employee/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          project_hash: projectInfo?.project_hash,
          name: formData?.name,
          code: formData?.code,
          email:formData?.email,
          password:formData?.password,
          mobile:formData?.mobile,
          role:1,
          manager_id:formData?.manger_id,
          area:formData?.area,
          hq:formData?.hq,
          state:formData?.state,
          region:formData?.region,
          zone:formData?.zone,
        }),
      },
    );

    const response = await loginResponse.json();
   
    if (!response) {
      if (
        response.message ===
        "The Code has alreday been taken"
      ) {
        throw new Error("Employee code is already taken. Please check and retry");
      } else {
        throw new Error("Register fail. Please try again.");
      }
    }
    return { success: true, data: response };
  } catch (error: any) {
    MyError(error);
    return { success: false, message: error.message };
  }
};
