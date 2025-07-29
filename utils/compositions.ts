import YogaDay from "../src/remotion/YogaDay";
// import MyVideo from "../src/remotion/Video";

export const compositions = [
  // {
  //   id: "MyVideo",
  //   component: MyVideo,
  //   width: 1280,
  //   height: 720,
  //   durationInFrames: 200,
  //   fps: 30,
  //   defaultProps: {
  //     frame: 0,
  //     download: false,
  //     name: "omkar",
  //   },
  // },
  {
    id: "YogaDay",
    component: YogaDay,
    durationInFrames: 200,
    fps: 24,
    width: 1280,
    height: 720,
    defaultProps: {
      frame: 0,
      download: false,
      formData: {
        name: "Dr. Sushant Patil singh",
        speciality: "Physician",
        clinic_name: "",
        clinic_address: "",
        photo:
          "https://pixpro.s3.ap-south-1.amazonaws.com/production/cropped/2025/01/folic-acid-awareness-2025/krunal-jayantibhai-patel-116214/6e653b57-5eca-4e0a-918c-789682f672e9.png",
        language: "English",
        gender: "Male",
      },
    },
  },
];
