"use client";
import CryptoJS from "crypto-js";

const SECRET_KEY = "aslcryywt6964897324bcw9@7439&*0#jbkhv5";

export const EncryptData = (key, data) => {
  const encryptData = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY,
  ).toString();
  localStorage.setItem(key, encryptData);
};

export const DecryptData = (key) => {
  try {
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
  } catch (e) {
    console.log(error);
  }
};

export const RemoveData = async (key) => {
  localStorage.removeItem(key);
};
