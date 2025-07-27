import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  SpeechConfig,
  SpeechSynthesisResult,
  SpeechSynthesizer,
  ResultReason,
  AudioConfig,
  AudioOutputStream,
  CancellationDetails,
} from "microsoft-cognitiveservices-speech-sdk";
import { getAudioDurationInSeconds } from "@remotion/media-utils";

// Constants
const MAX_FILENAME_LENGTH = 40;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_FAILURE_DURATION = 10;
const BREAK_TIME_MS = "100ms";
const AWS_REGION = "ap-south-1";
const S3_BUCKET = "remotionlambda-apsouth1-m61gk15thb";

// Voice configuration
const voices = [
  "enAarav",
  "enAashi",
  "enPrabhat",
  "hiAarav",
  "enNeerja",
  "hiAnanya",
  "taValluvar",
  "taPallavi",
  "teMohan",
  "teShruti",
  "knGagan",
  "knSapna",
  "mlMidhun",
  "mlSobhana",
  "guNiranjan",
  "guDhwani",
  "mrManohar",
  "mrAarohi",
  "bnBashkar",
  "bnTanishaa",
  "paOjas",
  "paVaani",
  "asPriyom",
  "asYashica",
  "orSukant",
  "orSubhasini",
  "urSalman",
  "urGul",
] as const;

export type Voice = (typeof voices)[number];

const voiceMap: Record<Voice, string> = {
  enAarav: "en-IN-AaravNeural",
  enAashi: "en-IN-AashiNeural",
  enPrabhat: "en-In-PrabhatNeural",
  enNeerja: "en-IN-NeerjaNeural",
  hiAarav: "hi-IN-AaravNeural",
  hiAnanya: "hi-IN-AnanyaNeural",
  taValluvar: "ta-IN-ValluvarNeural",
  taPallavi: "ta-IN-PallaviNeural",
  teMohan: "te-IN-MohanNeural",
  teShruti: "te-IN-ShrutiNeural",
  knGagan: "kn-IN-GaganNeural",
  knSapna: "kn-IN-SapnaNeural",
  mlMidhun: "ml-IN-MidhunNeural",
  mlSobhana: "ml-IN-SobhanaNeural",
  guNiranjan: "gu-IN-NiranjanNeural",
  guDhwani: "gu-IN-DhwaniNeural",
  mrManohar: "mr-IN-ManoharNeural",
  mrAarohi: "mr-IN-AarohiNeural",
  bnBashkar: "bn-IN-BashkarNeural",
  bnTanishaa: "bn-IN-TanishaaNeural",
  paOjas: "pa-IN-OjasNeural",
  paVaani: "pa-IN-VaaniNeural",
  asPriyom: "as-IN-PriyomNeural",
  asYashica: "as-IN-YashicaNeural",
  orSukant: "or-IN-SukantNeural",
  orSubhasini: "or-IN-SubhasiniNeural",
  urSalman: "ur-IN-SalmanNeural",
  urGul: "ur-IN-GulNeural",
};

// Initialize S3 client with memoization
let s3Client: S3Client | null = null;

const getS3Client = (): S3Client => {
  if (!s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials are not configured");
    }

    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: { accessKeyId, secretAccessKey },
      maxAttempts: 3,
    });
  }
  return s3Client;
};

// Utility functions
const sanitizeString = (str: string): string => {
  return str.replace(/[^\w\s]/gi, "").replace(/\s+/g, "");
};

const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
};

const generateFileName = (params: {
  name: string;
  text: string;
  voice: Voice;
}): string => {
  const cleanName = sanitizeString(params.name);
  const cleanText = truncateString(
    sanitizeString(params.text),
    MAX_FILENAME_LENGTH,
  );

  return `video-data/${cleanName}/${cleanText}${params.voice}.mp3`;
};

const createS3Url = (params: {
  name: string;
  text: string;
  voice: Voice;
}): string => {
  const filename = generateFileName(params);
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${filename}`;
};

const escapeSSML = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const generateSSML = (text: string, voice: Voice): string => {
  const voiceName = voiceMap[voice];
  if (!voiceName) throw new Error(`Voice ${voice} not found in voice map`);

  return `<speak version="1.0" xml:lang="en-US">
            <voice name="${voiceName}">
              <break time="${BREAK_TIME_MS}"/>${escapeSSML(text)}
            </voice>
          </speak>`;
};

// Storage operations
const silentlyCheckFileExistsInS3 = async (
  fileName: string,
): Promise<boolean> => {
  const client = getS3Client();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: fileName,
      }),
    );
    return true;
  } catch (error) {
    // Completely silent handling - no logging, no rethrowing
    return false;
  }
};

const uploadToS3 = async (
  data: ArrayBuffer,
  fileName: string,
): Promise<void> => {
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: new Uint8Array(data),
      ACL: "public-read",
      ContentType: "audio/mpeg",
    }),
  );
};

// TTS Synthesis
const synthesizeWithAzure = async (
  text: string,
  voice: Voice,
): Promise<ArrayBuffer> => {
  const speechConfig = SpeechConfig.fromSubscription(
    process.env.AZURE_TTS_KEY!,
    process.env.AZURE_TTS_REGION!,
  );

  const stream = AudioOutputStream.createPullStream();
  const audioConfig = AudioConfig.fromStreamOutput(stream);
  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

  try {
    const ssml = generateSSML(text, voice);
    const result = await new Promise<SpeechSynthesisResult>(
      (resolve, reject) => {
        synthesizer.speakSsmlAsync(ssml, resolve, reject);
      },
    );

    if (
      result.reason !== ResultReason.SynthesizingAudioCompleted ||
      !result.audioData
    ) {
      const cancellation = CancellationDetails.fromResult(result);
      throw new Error(`Synthesis failed: ${cancellation.errorDetails}`);
    }

    return result.audioData;
  } finally {
    synthesizer.close();
  }
};

// Main function
export const synthesizeSpeech = async (
  name: string,
  text: string,
  voice: Voice,
  maxRetries: number = DEFAULT_RETRY_ATTEMPTS,
): Promise<{ downloadUrl: string; duration: number }> => {
  if (!text.trim()) {
    return {
      downloadUrl: "Error: Empty text provided",
      duration: DEFAULT_FAILURE_DURATION,
    };
  }

  const fileName = generateFileName({ name, text, voice });
  const s3Url = createS3Url({ name, text, voice });

  // Check cache first
  try {
    const fileExists = await silentlyCheckFileExistsInS3(fileName);
    if (fileExists) {
      const duration = await getAudioDurationInSeconds(s3Url);
      return { downloadUrl: s3Url, duration };
    }
  } catch (error) {
    console.error("Cache check failed, proceeding with synthesis", error);
  }

  // Perform synthesis with retries
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const audioData = await synthesizeWithAzure(text, voice);
      await uploadToS3(audioData, fileName);

      const duration = await getAudioDurationInSeconds(s3Url);
      return { downloadUrl: s3Url, duration };
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000),
        );
      }
    }
  }

  return {
    downloadUrl: `Error: ${lastError instanceof Error ? lastError.message : "Unknown error"}`,
    duration: DEFAULT_FAILURE_DURATION,
  };
};