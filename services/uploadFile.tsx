import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { DecryptData } from "@utils/cryptoUtils";
import MyError from "@services/MyError";

const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
const awsRegion = process.env.NEXT_PUBLIC_AWS_S3_REGION;
const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

const s3 = new S3Client({
  region: awsRegion,
  ...(accessKeyId && secretAccessKey
    ? {
        credentials: {
          accessKeyId: accessKeyId as string,
          secretAccessKey: secretAccessKey as string,
        },
      }
    : {}),
});

async function GenerateFilePath(fileName: string, projectInfo: any) {
  const employeeInfo = DecryptData("empData");

  const monthData = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];

  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  if (!projectInfo) {
    throw new Error("project info not found");
  }
  const { slug } = await extractDomainAndSlug(projectInfo?.web_link);

  return `production/photos/${year}/${monthData[month]}/${slug}/${employeeInfo.hash}/${fileName}`;
}

const UploadFile = async (
  projectData: any,
  imageData: Blob | Uint8Array,
  fileName: string,
  type: string,
) => {
  const contentType =
    type === "image"
      ? "image/png"
      : type === "video"
        ? "video/mp4"
        : type === "audio"
          ? "audio/wav"
          : type === "pdf"
            ? "application/pdf"
            : null;

  if (contentType == null) {
    throw new Error("Unsupported file type");
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are not defined");
  }

  const filePath = await GenerateFilePath(fileName, projectData);

  let buffer: Buffer;

  if (imageData instanceof Blob) {
    const arrayBuffer = await imageData.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (imageData instanceof Uint8Array) {
    buffer = Buffer.from(
      imageData.buffer,
      imageData.byteOffset,
      imageData.byteLength,
    );
  } else {
    throw new Error("Unsupported image data type");
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filePath,
    Body: buffer,
    ACL: "public-read",
    ContentType: contentType,
    ...(contentType === "application/pdf" && {
      ContentDisposition: "inline",
    }),
    CacheControl: "public, max-age=31536000",
    Metadata: {
      "Access-Control-Allow-Origin": "*",
    },
  });

  await s3.send(command);
  return createS3Url({ name: filePath });
};

export const createS3Url = ({ name }: { name: string }) => {
  return `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${name}`;
};

export default UploadFile;

export const DeleteFile = async (name: any, projectData: any) => {
  const filePath = await GenerateFilePath(name, projectData);
  const bucketParams = {
    Bucket: bucketName,
    Key: filePath,
  };

  try {
    await s3.send(new DeleteObjectCommand(bucketParams));
    return true;
  } catch (err) {
    console.log("Error", err);
    return false;
  }
};

export async function extractDomainAndSlug(webLink: string) {
  try {
    const url = new URL(webLink);
    const hostParts = url.hostname.split(".");
    const subDomain = hostParts.length > 2 ? hostParts[0] : "";
    const pathParts = url.pathname.split("/").filter(Boolean);
    const slug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";

    if (!subDomain || !slug) {
      const error = new Error("Failed to extract domain or slug from web link");
      MyError(error);
      throw error;
    }

    return { subDomain, slug };
  } catch (error: unknown) {
    MyError(error);
    if (error instanceof Error) {
      throw new Error(`Failed to parse web link: ${error.message}`);
    } else {
      throw new Error("Failed to parse web link: Unknown error");
    }
  }
}
