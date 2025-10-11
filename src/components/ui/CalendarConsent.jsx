"use client";

import { useEffect, useState } from "react";
import generateCalendarPreviewBlob from "./CalendarPreviewKonva";
import InputField from "./InputField";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Calendar preview mockup configuration
export const CALENDAR_PREVIEW_CONFIG = {
  baseImageUrl: "/calendar.png", // Your mockup image path
  x: 716.5,
  y: 265,
  width: 184,
  height: 177,
  borderRadius: 10,
  perspective: {
    skewX: 0,
    skewY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  },
};

const CalendarConsent = ({
  projectData,
  ui,
  doctorHash,
  formData,
  setFormData,
}) => {
  const [calendarPreviews, setCalendarPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generatePreviews = async () => {
      const images = formData?.calendar_images || [];
      if (images.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const totalMonths = 12;

        // ✅ Always create 12 months — cycle through images if fewer
        const filledImages = Array.from({ length: totalMonths }, (_, i) => {
          if (images.length === 1) return images[0];
          if (images.length === 2) return images[i % 2];
          return images[i % images.length];
        });

        // ✅ Generate previews for each month
        const blobUrls = await Promise.all(
          filledImages.map(async (calendarItem, index) => {
            const monthKey =
              calendarItem?.month?.toLowerCase() ||
              MONTH_NAMES[index]?.toLowerCase();
            const displayMonthName =
              monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

            // ✅ Prefer cropped > original > fallback (blank)
            const previewSrc =
              calendarItem?.[`${monthKey}_cropped`] ||
              calendarItem?.[monthKey] ||
              "";

            // Skip if no valid image URL
            if (!previewSrc) {
              return {
                monthName: MONTH_NAMES[index],
                blobUrl: "",
                originalData: calendarItem,
              };
            }

            const blobUrl = await generateCalendarPreviewBlob(
              previewSrc,
              CALENDAR_PREVIEW_CONFIG,
            );

            return {
              monthName: displayMonthName,
              blobUrl,
              originalData: calendarItem,
            };
          }),
        );

        // ✅ Always set previews for all 12 months
        setCalendarPreviews(blobUrls);
      } catch (error) {
        console.error("Failed to generate calendar previews:", error);
        setError("Failed to generate previews. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    generatePreviews();

    // ✅ Cleanup previous blob URLs to prevent memory leaks
    return () => {
      calendarPreviews.forEach((preview) => {
        if (preview.blobUrl) URL.revokeObjectURL(preview.blobUrl);
      });
    };
  }, [formData?.calendar_images]);

  return (
    <div className="bg-gray-900 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-2">Review Your Design</h2>
      <div className="text-gray-400 text-sm mb-6">
        <h3 className="text-white text-md font-medium mb-2">
          It will be printed like this preview. Make sure you are happy before
          continuing.
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Are all text and images clear and easy to read?</li>
          <li>Do the design elements fit in the safety area?</li>
          <li>Does the background fill out to the edges?</li>
          <li>Is everything spelled correctly?</li>
        </ul>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-red-400 mb-4 text-sm bg-red-900 bg-opacity-30 p-3 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-white text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Generating calendar previews...</p>
          <p className="text-sm text-gray-400 mt-2">This may take a moment</p>
        </div>
      ) : (
        <>
          {/* Preview Grid */}
          {calendarPreviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 mt-4">
              <div className="w-full overflow-x-auto">
                <div className="flex space-x-4 pb-2">
                  {calendarPreviews.map((calendar, index) => (
                    <div
                      key={index}
                      className="min-w-[250px] bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200"
                    >
                      <img
                        src={calendar.blobUrl}
                        alt={`${calendar.monthName} calendar preview`}
                        className="w-full h-auto"
                      />
                      <div className="p-1 text-center">
                        <p className="text-white text-base font-semibold">
                          {calendar.monthName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 text-center">
                Scroll to check all the months
              </p>

              <div className="col-span-full mt-4">
                <input
                  type="checkbox"
                  name="calendar_consent"
                  id="calendar_consent"
                  value={formData?.calendar_consent}
                  className="h-4 w-4 text-green-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={formData?.calendar_consent || false}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      calendar_consent: e.target.checked,
                    }))
                  }
                />
                <label
                  htmlFor="calendar_consent"
                  className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  I confirm that I have reviewed the calendar design and approve
                  it for printing.
                </label>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No calendar images to preview</p>
              <p className="text-sm mt-2">Upload images to see previews here</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarConsent;
