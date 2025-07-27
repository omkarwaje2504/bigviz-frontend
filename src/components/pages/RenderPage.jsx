"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import { Player } from "@remotion/player";
import { DecryptData } from "@utils/cryptoUtils";
import MyVideo from "src/remotion/Video";
import { PrepareVideo } from "@services/PrepareVideo";
import loadScript from "@utils/LoadScript";
import YogaDay from "../../remotion/IPCA/YogaDay";

const quizQuestions = [
  {
    question: "Which vitamin is essential for healthy eyesight?",
    options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"],
    answer: "Vitamin A",
  },
  {
    question: "What is the normal human body temperature?",
    options: ["96.8°F", "98.6°F", "100.4°F", "97.4°F"],
    answer: "98.6°F",
  },
  {
    question: "Which organ detoxifies the blood?",
    options: ["Lungs", "Liver", "Kidneys", "Heart"],
    answer: "Liver",
  },
  {
    question: "How many chambers does the human heart have?",
    options: ["2", "3", "4", "5"],
    answer: "4",
  },
];

export default function RenderPage({ projectData, projectId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [url, setUrl] = useState();
  const [type, setType] = useState("video");
  const [selected, setSelected] = useState("");
  const [formData, setFormData] = useState();
  const [compositionMetadata, setCompositionMetadata] = useState();
  const [renderVideoStatus, setRenderVideoStatus] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const getFormData = DecryptData("formData");
    if (getFormData) {
      setFormData(getFormData);
    }
    getCompositionsData();
  }, []);

  const getCompositionsData = async () => {
    try {
      await loadScript("/bundle.js");
      const compositions = await window.getCompositions?.();
      console.log(compositions);
      if (!compositions) throw new Error("getCompositions() missing.");

      // const comp = compositions.find(
      //   (c) => c.id === projectData?.artwork?.id || "YogaDay",
      // );
      const comp = compositions.find((c) => c.id === "YogaDay");

      if (!comp)
        throw new Error(`Composition "${projectData?.artwork?.id}" not found.`);
      setCompositionMetadata(comp);
    } catch (error) {
      console.error("Error fetching compositions:", error);
    }
  };

  useEffect(() => {
    const random =
      quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    setQuiz(random);

    const timer = setTimeout(() => {
      setLoading(false);
      setUrl("data");
    }, 6000);
    return () => clearTimeout(timer);
  }, []);
  const handleDownload = async () => {
    try {
      const videoBlob = await PrepareVideo({
        compositionName: "MyVideo",
        props: {
          download: true,
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
        }, // or any dynamic props
        onProgress: (msg, frame, total) =>
          setRenderVideoStatus(Math.round((frame / total) * 100, 0)),
      });

      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rendered-video.mp4";
      a.click();
    } catch (err) {
      console.error("Render failed:", err);
    }
  };

  const triggerWorkflow = async () => {
    setStatus("Triggering render...");

    const trigger = await fetch(
      `https://api.github.com/repos/omkarwaje2504/bigviz-frontend/actions/workflows/render-video.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          ref: "master",
          inputs: {
            formData: JSON.stringify({
              name: "Dr. Sushant Patil singh",
              speciality: "Physician",
              clinic_name: "",
              clinic_address: "",
              photo:
                "https://pixpro.s3.ap-south-1.amazonaws.com/production/cropped/2025/01/folic-acid-awareness-2025/krunal-jayantibhai-patel-116214/6e653b57-5eca-4e0a-918c-789682f672e9.png",
              gender: "Male",
              language: "English",
            }),
          },
        }),
      },
    );
    

    if (trigger.ok) {
      setStatus("Triggered! Check GitHub Actions for progress.");
    } else {
      setStatus("Failed to trigger workflow.");
    }
  };

  if (loading || !url) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          Rendering in progress...
        </h1>
        <p className="text-gray-400 mb-6 text-sm">
          While you wait, try this quick quiz!
        </p>

        {quiz && (
          <div className="bg-gray-800 rounded-lg p-4 w-full max-w-md text-left">
            <p className="mb-3 font-medium">{quiz.question}</p>
            <ul className="space-y-2">
              {quiz.options.map((option) => (
                <li
                  key={option}
                  className={`cursor-pointer px-3 py-2 rounded border hover:bg-gray-700 ${
                    selected === option
                      ? option === quiz.answer
                        ? "bg-green-600"
                        : "bg-red-600"
                      : ""
                  }`}
                  onClick={() => setSelected(option)}
                >
                  {option}
                </li>
              ))}
            </ul>
            {selected && (
              <p className="mt-3 text-sm text-yellow-300">
                {selected === quiz.answer
                  ? "Correct! 🎉"
                  : `Oops! The correct answer is "${quiz.answer}"`}
              </p>
            )}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-500">Preparing your download...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-3s">
      <div className="w-full max-w-4xl bg-gray-900 rounded-lg p-1 shadow-lg">
        <button onClick={triggerWorkflow}>Render MyVideo</button>
        {type === "video" ? (
          <Player
            component={MyVideo}
            inputProps={{
              download: false,
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
            }}
            compositionWidth={compositionMetadata?.width || 1280}
            compositionHeight={compositionMetadata?.height || 720}
            fps={compositionMetadata?.fps || 30}
            durationInFrames={compositionMetadata?.durationInFrames || 300}
            controls
            style={{
              width: "100%",
              borderRadius: "8px",
              border: "1px solid #444",
            }}
          />
        ) : (
          <img
            src={url}
            alt="Rendered Preview"
            className="w-full rounded-md border border-gray-700"
          />
        )}

        <div className="mt-1 flex justify-between p-4">
          <button
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <button
            onClick={handleDownload}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white flex items-center"
          >
            <FaDownload className="mr-2" />
            {renderVideoStatus}% - Download {type}
          </button>
        </div>
      </div>
    </div>
  );
}
