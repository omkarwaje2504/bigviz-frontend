import {
  S3Client,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { DecryptData } from "@utils/cryptoUtils";
import MyError from "@services/MyError";
import { ProjectInfo } from "@utils/types";

let bucketName: string,
  awsRegion: string,
  accessKeyId: string,
  secretAccessKey: string;

if (process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "S3") {
  bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "";
  awsRegion = process.env.NEXT_PUBLIC_AWS_S3_REGION || "";
  accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || "";
  secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || "";
} else {
  bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME || "";
  awsRegion = process.env.NEXT_PUBLIC_R2_REGION || "";
  accessKeyId = process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || "";
  secretAccessKey = process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || "";
}

const R2AccountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;

const s3 = new S3Client({
  ...(process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "R2"
    ? { endpoint: `https://${R2AccountId}.r2.cloudflarestorage.com` }
    : null),
  ...(process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "R2"
    ? { forcePathStyle: true }
    : null),

  region:
    process.env.NEXT_PUBLIC_STORAGE_PROVIDER === "S3" ? awsRegion : "auto",
  ...(accessKeyId && secretAccessKey
    ? {
        credentials: {
          accessKeyId: accessKeyId as string,
          secretAccessKey: secretAccessKey as string,
        },
      }
    : {}),
});


async function GenerateFilePath(
  fileName: string,
  projectInfo: ProjectInfo,
  doctorHash: string | null,
) {
  let d_Hash=doctorHash;

  if (!doctorHash) {
    const employeeInfo = DecryptData("empData");
    d_Hash = employeeInfo.hash;
  }

  const year = new Date().getFullYear();
  if (!projectInfo) {
    throw new Error("project info not found");
  }
  const projectName = decodeURIComponent(projectInfo.name)
    .replace(/\s+/g, "-")
    .toLocaleLowerCase();

  return `production/photos/${year}/${projectName}/${d_Hash}/${fileName}`;
}

const UploadFile = async (
  doctorHash: string | null,
  projectData: ProjectInfo,
  file: Blob | Uint8Array,
  fileName: string,
  type?: string,
) => {
  const contentType = (file as File).type || "application/octet-stream";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS credentials are not defined");
  }

  const filePath = await GenerateFilePath(fileName, projectData, doctorHash);
  let buffer: Buffer;
  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (file instanceof Uint8Array) {
    buffer = Buffer.from(file.buffer, file.byteOffset, file.byteLength);
  } else {
    throw new Error("Unsupported file type");
  }
  const uploadUrl = new URL(
    "https://odd-shadow-b47f.rohansakhale-d48.workers.dev",
  );
  uploadUrl.searchParams.set("filename", filePath);

  const fileBlob = new Blob([new Uint8Array(buffer)], { type: contentType });

  try {
    const response = await fetch(uploadUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        ...(contentType === "application/pdf" && {
          "Content-Disposition": "inline",
        }),
      },
      body: fileBlob,
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error("Upload was not successful");
    }

    return createS3Url({ name: filePath });
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(
      `Failed to upload file: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

export const createS3Url = ({ name }: { name: string }) => {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER;
  if (provider === "S3") {
    return `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${name}`;
  } else if (provider === "R2") {
    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${name}`;
  }
  throw new Error("Unsupported storage provider");
};

export const DeleteFile = async (
  doctorHash: string | null,
  name: string,
  projectData: ProjectInfo,
) => {
  const filePath = await GenerateFilePath(name, projectData, doctorHash);
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

export default UploadFile;
