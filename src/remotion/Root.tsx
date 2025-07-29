import { Composition } from "remotion";
import MyVideo from "./Video";
import YogaDay from "./YogaDay"";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={400}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          frame: 0,
          formData: { name: "omkar" },
          download: false,
        }}
      />

      <Composition
        id="YogaDay"
        component={YogaDay}
        durationInFrames={200}
        fps={24}
        width={1280}
        height={720}
        defaultProps={{
          frame: 0,
          formData: {
            name: "Dr. Sushant Patil singh",
            speciality: "Physician",
            clinic_name: "",
            clinic_address: "",
            photo:
              "https://pixpro.s3.ap-south-1.amazonaws.com/production/cropped/2025/01/folic-acid-awareness-2025/krunal-jayantibhai-patel-116214/6e653b57-5eca-4e0a-918c-789682f672e9.png",
            gender: "Female",
            language: "English",
          },
          download: false,
        }}
      />
    </>
  );
};
