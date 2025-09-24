import MyError from "@services/MyError";
import { DecryptData } from "@utils/cryptoUtils";
import data from "@utils/types";

export const VideoRender = async (videoId, videoProps) => {
  const apiKey = "adfljhsdgofsahgalsdfjasadssaflkadnfgasldfsadf";

  if (!videoId) {
    return {
      success: false,
      message: "No videoId is specified",
    };
  }
  try {
    const response = await fetch(`https://ai.pixpro.app/api/video-processor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        function: "pixpro-propmotion",
        videoId: videoId,
        props: videoProps,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Failed to generate Ai Video",
      };
    }

    const result = await response.json();

    return {
      success: true,
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to generate Ai Video",
    };
  }
};

export const GetRenderStatus = async (id) => {
  if (!id) {
    return {
      success: false,
      message: "No videoId is specified",
    };
  }

  try {
    const response = await fetch(
      `https://remotionlambda-apsouth1-m61gk15thb.s3.ap-south-1.amazonaws.com/renders/${id}/progress.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    const result = await response.json();

    if (result?.errors?.length > 0) {
      let errorMsg = "Error during video rendering.";
      
      return {
        success: false,
        isError: result?.errors?.length > 0,
        message: errorMsg,
      };
    }

    if (result?.postRenderData?.outputFile) {
      return {
        success: true,
        data: result,
      };
    } else {
      return {
        success: false,
        message: "Video processing is still in progress",
      };
    }
  } catch (error) {

    return {
      success: false,
      message: "Failure occur while generating Ai Video",
    };
  }
};

export const GenerateVideoAPI = async (
  projectInfo,
  doctorHash,
  type,
  videourl,
  employee_hash,
  cost,
  renderid,
  outputsize,
  timetaken,
) => {
  if (!doctorHash || !type || !projectInfo?.project_hash) {
    return { success: false, message: "Invalid input data" };
  }

  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

    let visitor_hash = DecryptData("visitorHash");

    const payload = {
      project_hash: projectInfo.project_hash,
      data: [
        {
          doctor_hash: doctorHash,
          visitor_hash,
          type,
          timestamp,
          extras: {
            video_cost: cost,
            video_url: videourl,
            time_taken: timetaken,
            render_id: renderid,
            output_size: outputsize,
          },
        },
      ],
    };

    if (employee_hash && projectInfo?.config?.employee) {
      payload.data[0].employee_hash = employee_hash;
    }

    const GenrateVideoResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/analytics`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!GenrateVideoResponse.ok) {
      throw new Error(`Server error: ${GenrateVideoResponse.status}`);
    }

    const response = await GenrateVideoResponse.json();

    return { success: true, data: response };
  } catch (error) {
    console.error("Analytics error:", error);
    return { success: false, message: error.message };
  }
};

export const Download = async (
  projectInfo,
  doctorHash,
  type,
  employee_hash,
) => {
  if (!doctorHash || !type || !projectInfo?.project_hash) {
    return { success: false, message: "Invalid input data" };
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");

  try {
    let visitor_hash = DecryptData("visitorHash");

    const payload = {
      project_hash: projectInfo.project_hash,
      data: [
        {
          doctor_hash: doctorHash,
          visitor_hash,
          type,
          timestamp,
        },
      ],
    };

    if (employee_hash && projectInfo?.config?.employee) {
      payload.data[0].employee_hash = employee_hash;
    }

    const Downloadesponse = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/analytics`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!Downloadesponse.ok) {
      throw new Error(`Server error: ${Downloadesponse.status}`);
    }

    const text = await Downloadesponse.text();
    const response = text ? JSON.parse(text) : {};

    return { success: true, data: response };
  } catch (error) {
    console.error("Analytics error:", error);
    return { success: false, message: error.message };
  }
};
