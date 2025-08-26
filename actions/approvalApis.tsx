import MyError from "@services/MyError";
import { Doctor, ProjectInfo } from "@utils/types";

export const ApprovalAction = async (
  projectInfo: ProjectInfo,
  employee_hash: string,
  doctor: Doctor,
  approval_status: 1 | 2,
  comments: string | null,
) => {
  if (
    !projectInfo?.project_hash ||
    !employee_hash ||
    !doctor ||
    !approval_status
  ) {
    return { success: false, message: "Invalid input data" };
  }
  try {
    const approveResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/approve`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          project_hash: projectInfo?.project_hash,
          employee_hash: employee_hash,
          doctor_hash: doctor.doctor_hash,
          approval_status,
          comment: comments,
        }),
      },
    );

    const response = await approveResponse.json();
    if (!response.data) {
      throw new Error(
        `Approve fail. Please try again for doctor ${doctor.name} , ${approveResponse.status}`,
      );
    }
    return { success: true, data: response.data };
  } catch (error: any) {
    MyError(error);
    return { success: false, message: error.message };
  }
};
