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
  const apiKey = "adfljhsdgofsahgalsdfjasadssaflkadnfgasldfsadf";

  if (!id) {
    return {
      success: false,
      message: "No videoId is specified",
    };
  }

  try {
    const response = await fetch(`https://ai.pixpro.app/api/check-video`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        renderId: id,
      }),
    });
    const result = await response.json();
    if (result.status === "OK") {
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

export const Analytics = async (projectInfo, doctorHash, type) => {

  if (!doctorHash || !type || !projectInfo?.project_hash) {
    return { success: false, message: "Invalid input data" };
  }

  try {
    const loginResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PROJECT_URL}/analytics/video`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          project_hash: projectInfo.project_hash,
          doctor_hash: doctorHash,
          type: type,
        }),
      }
    );

    if (!loginResponse.ok) {
      throw new Error(`Server error: ${loginResponse.status}`);
    }

    const text = await loginResponse.text();
    const response = text ? JSON.parse(text) : {};

    return { success: true, data: response };
  } catch (error) {
    console.error("Analytics error:", error);
    return { success: false, message: error.message };
  }
};
