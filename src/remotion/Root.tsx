import { Composition } from "remotion";
import YogaDay from "./YogaDay";
import "../../styles/global.css";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="YogaDay"
        component={YogaDay}
        durationInFrames={200}
        fps={24}
        width={1280}
        height={720}
        defaultProps={{
            name: "Dr. Sushant Patil singh",
            speciality: "Physician",
            clinic_name: "vedanta clinic",
            clinic_address: "Thane, Maharashtra",
            photo:
              "https://pixpro.s3.ap-south-1.amazonaws.com/production/cropped/2025/01/folic-acid-awareness-2025/krunal-jayantibhai-patel-116214/6e653b57-5eca-4e0a-918c-789682f672e9.png",
            gender: "Female",
            language: "English",
          
        }}
      />
    </>
  );
};