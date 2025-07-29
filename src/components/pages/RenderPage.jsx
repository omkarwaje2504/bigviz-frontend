"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { DecryptData } from "@utils/cryptoUtils";

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

export default function RenderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [url, setUrl] = useState(null);
  const [selected, setSelected] = useState("");
  const [formData, setFormData] = useState(null);
  const [status, setStatus] = useState("");
  const [renderId, setRenderId] = useState("");

  useEffect(() => {
    const data = DecryptData("formData");
    if (data) setFormData(data);
  }, []);

  useEffect(() => {
    const random = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    setQuiz(random);
    setLoading(false);
  }, []);

  const triggerWorkflow = async () => {
    const newRenderId = uuidv4();
    setRenderId(newRenderId);
    setStatus("Triggering render...");

    const res = await fetch(
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
            name: "omkar",
            renderId: newRenderId,
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
      }
    );

    if (res.ok) {
      setStatus("Workflow triggered. Checking status...");
      pollForArtifact(newRenderId);
    } else {
      setStatus("Failed to trigger workflow.");
    }
  };

  const pollForArtifact = async (renderId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `https://api.github.com/repos/omkarwaje2504/bigviz-frontend/actions/artifacts`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
              Accept: "application/vnd.github+json",
            },
          }
        );

        const data = await response.json();
        const match = data.artifacts.find((a) => a.name === `video-${renderId}`);

        if (match) {
          clearInterval(interval);
          setStatus("Render complete! Download ready.");
          setUrl(match.archive_download_url);
        } else {
          setStatus("Still rendering... checking again.");
        }
      } catch (err) {
        clearInterval(interval);
        setStatus("Error while checking status.");
      }
    }, 10000); 
  };

  if (!url) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Rendering in progress...</h1>
        <p className="text-gray-400 mb-6 text-sm">While you wait, try this quick quiz!</p>

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

        <p className="mt-6 text-xs text-yellow-400">{status}</p>
        <button
          onClick={triggerWorkflow}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Start Rendering
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-gray-900 rounded-lg p-4 shadow-lg">
        <h2 className="text-xl mb-4">Your video is ready!</h2>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 text-white"
        >
          Download Video
        </a>
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => router.back()}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
        </div>
      </div>
    </div>
  );
}
