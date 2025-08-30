import { getAllProjectsCached } from "../../../../utils/projectCache";
import Config from "../../../../utils/Config";
import NotFoundPage from "../NotFoundPage";
import ScratchCard from "../../../components/pages/funzo/ScratchCard";
import fs from 'fs';
import path from 'path';

async function imageToBase64(imagePath) {
  try {
    if (imagePath.startsWith('http')) {
      const response = await fetch(imagePath);
      const buffer = await response.arrayBuffer();
      return `data:image/${imagePath.split('.').pop()};base64,${Buffer.from(buffer).toString('base64')}`;
    }

    const absolutePath = path.join(process.cwd(), 'public', imagePath);
    const imageBuffer = fs.readFileSync(absolutePath);
    return `data:image/${imagePath.split('.').pop()};base64,${imageBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error converting ${imagePath} to base64:`, error);
    return null;
  }
}

async function preloadAllImages() {
  const doctorFrames = Array.from(
    { length: 52 },
    (_, i) => `/doctor/doctor${String(i).padStart(2, "0")}.webp`
  );

  const patientFrames = Array.from(
    { length: 52 },
    (_, i) => `/patient/patient${String(i).padStart(2, "0")}.webp`
  );

  const allImages = [...doctorFrames, ...patientFrames];

  const imagePromises = allImages.map(async (imagePath) => {
    return {
      path: imagePath,
      base64: await imageToBase64(imagePath),
    };
  });

  const images = await Promise.all(imagePromises);

  const imageDict = {};
  images.forEach((img) => {
    if (img.base64) {
      imageDict[img.path] = img.base64;
    }
  });

  return imageDict;
}


export async function generateStaticParams() {
  const projects = await getAllProjectsCached();

  return projects.map((project) => ({
    pathname: project.project_hash?.toString(),
  }));
}

export async function generateMetadata({ params }) {
  const { pathname } = await params;
  const projects = await getAllProjectsCached();

  const projectInfo = projects.find(
    (project) => project.project_hash?.toString() === pathname,
  );

  return {
    title: projectInfo?.seo_title || "Default Title",
    description: projectInfo?.seo_description || "Default description",
    openGraph: {
      title: projectInfo?.seo_title || "Default Title",
      description: projectInfo?.seo_description || "Default description",
      images: [
        `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${projectInfo?.seo_image}` ||
          "/default-image.jpg",
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: projectInfo?.seo_title || "Default Title",
      description: projectInfo?.seo_description || "Default description",
      image:
        `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${projectInfo?.seo_image}` ||
        "/default-image.jpg",
    },
  };
}

export default async function Home({ params }) {
  const { pathname } = await params;
  const projects = await getAllProjectsCached();

  const projectInfo = projects.find(
    (project) => project.project_hash?.toString() === pathname,
  );
  
  const ui = await Config(projectInfo);
  const preloadedImages = await preloadAllImages();
  
  if (projectInfo) {
    if (projectInfo?.config?.game?.scratch_card) {
      return (
        <ScratchCard 
          projectData={projectInfo} 
          projectId={pathname} 
          ui={ui}
          preloadedImages={preloadedImages}
        />
      );
    } else return <div>Game Page</div>;
  } else {
    return <NotFoundPage />;
  }
}