"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Confetti from "react-confetti";

const images = [
  "/puzzle/part1.jpg",
  "/puzzle/part2.jpg",
  "/puzzle/part3.jpg",
  "/puzzle/part4.jpg",
];

const correctOrder = [0, 1, 2, 3];

const arraysEqual = (a, b) =>
  a.length === b.length && a.every((val, i) => val === b[i]);

const shuffleArray = (arr) =>
  arr
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);

export default function Puzzle() {
  const [order, setOrder] = useState(shuffleArray(correctOrder));
  const [draggedItem, setDraggedItem] = useState(null);
  const [showPuzzle,setShowPuzzle] = useState(true)
  const [solved, setSolved] = useState(false);
  const [filpCard,setFilpCard] = useState(false)
  const [showCongrats,setShowCongrats] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false);

  const swapItems = (arr, aIndex, bIndex) => {
    const copy = [...arr];
    [copy[aIndex], copy[bIndex]] = [copy[bIndex], copy[aIndex]];
    return copy;
  };

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDrop = (targetItem) => {
    if (draggedItem === null) return;

    const newOrder = [...order];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetItem);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const swapped = swapItems(newOrder, draggedIndex, targetIndex);
    setOrder(swapped);
    setDraggedItem(null);

  };

  const handleDragOver = (e) => e.preventDefault();

  useEffect(() => {
    if (!solved && arraysEqual(order, correctOrder)) {
      setSolved(true);
      setTimeout(()=>{
        setShowPuzzle(false)
        setFilpCard(true)
      },2000)
      setTimeout(()=>{
        setFilpCard(false)
        setShowCongrats(true)
      },8000)
    }
  }, [order, solved]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6">
      
      {
        (showPuzzle && !filpCard && !showCongrats) && (
          <div>
            <h1 className="text-2xl text-center font-bold mb-4 text-[#f39500]">🧩 Drag & Drop Puzzle</h1>
            <div className="grid grid-cols-2  bg-[#00acdf] p-2 rounded-xl shadow-md">
              {order.map((item, gridIndex) => (
                <div
                  key={item}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDrop={() => handleDrop(item)}
                  onDragOver={handleDragOver}
                  className="relative w-40 h-40  overflow-hidden cursor-move hover:scale-105 transition-transform duration-200"
                >
              
                  <span className="absoluten hidden left-1 top-1 z-10 bg-white/80 text-xs px-1 rounded">
                    G:{gridIndex} I:{item}
                  </span>

                  <Image
                    src={images[item]}
                    alt={`Part ${item + 1}`}
                    width={160}
                    height={160}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        )
      }
      {filpCard && !showPuzzle && !showCongrats && (
        <div className="bg-[#58237b] rounded-xl shadow-2xl p-4 transform transition-all duration-1000 animate-flip">
          <img
            src="/game/scratch-card/scratch-card-zambia/packet.webp"
            alt="Prize Card"
            className="rounded-lg border-4 border-[#f39500]"
          />
        </div>
      )}
      {
        (showCongrats && !showPuzzle && !filpCard) && (
          <div className="absolute px-4 inset-0 flex items-center justify-center z-50 bg-black/60">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-lg animate-fadeIn">
            <h2 className="text-3xl font-bold text-[#58247b] mb-4">
              🎉 Congratulations
            </h2>
            <p className="text-gray-700 text-lg md:text-xl mb-6">
              {/* {congratsConfig?.[projectId]?.message} */}
            </p>
            <div>
              <button
                className="w-fit px-3 py-2 font-bold mx-auto text-white bg-[#00acdf] text-lg border rounded-lg cursor-pointer"
                onClick={()=>{setShowPuzzle(true)}}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
        )
      }
      { 
        (showCongrats && !showPuzzle && !filpCard) && (
          <div className="fixed inset-0 z-[9999] pointer-events-none">
            <Confetti
              width="100%"
              height="100%"
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />
          </div>
        )
      }

       <style jsx global>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes flip {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out forwards;
        }
        .animate-flip {
          animation: flip 1.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
