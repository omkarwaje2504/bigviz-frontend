// {
//     "function": "pixpro-propmotion",
//     "videoId": "IndependenceDayIPCA",
//     "props": {
//         "name": "Dr. Ved",
//         "photo": "https://pub-1866961b46144251bd1b1f5a7087fd41.r2.dev/production/photos/2025/09/independence-day/1z7mq5dz/dr-ved/caxkv8-1757566615242-cropped.png"
//     }
// }


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
    Sentry.captureException(error);
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
    Sentry.captureException(error);
    return {
      success: false,
      message: "Failure occur while generating Ai Video",
    };
  }
};