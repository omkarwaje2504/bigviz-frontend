"use client";
import CryptoJS from "crypto-js";

const SECRET_KEY = "aslcryywt6964897324bcw9@7439&*0#jbkhv5"; // keep this secure

export const EncryptData = (key, data) => {
  const encryptData = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY,
  ).toString();
  localStorage.setItem(key, encryptData);
};

export const DecryptData = (key) => {
  const cipherText = localStorage.getItem(key);
  if (!cipherText) {
    return null;
  }
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  if (!decryptedData) {
    console.error("Decryption failed or data not found for key:", key);
    return null;
  }
  return JSON.parse(decryptedData);
};

export const RemoveData = async (key) => {
  localStorage.removeItem(key);
};
