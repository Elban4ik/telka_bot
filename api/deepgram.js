import FormData from "form-data";
import fs from "fs";
import axios from "axios";
import path from 'path';

const voicesDir = path.join(process.cwd(), 'voices');
if (!fs.existsSync(voicesDir)) {
  fs.mkdirSync(voicesDir, { recursive: true });
}

export async function downloadVoiceFile(url, chatId) {
  return new Promise(async (resolve, reject) => {
    try {
      // Генерируем уникальное имя файла
      const timestamp = Date.now();
      const fileName = `voice_${chatId}_${timestamp}.oga`;
      const filePath = path.join(voicesDir, fileName);

      const response = await axios({
        method: "GET",
        url: url,
        responseType: "stream",
      });

      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      writer.on("finish", () => {
        console.log(`Файл сохранен: ${filePath}`);
        resolve(filePath);
      });

      writer.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Функция удаления файла
export async function deleteFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error) {
        console.error(`Ошибка при удалении файла ${filePath}:`, error);
        reject(error);
      } else {
        console.log(`Файл удален: ${filePath}`);
        resolve();
      }
    });
  });
}

export const transcribeVoice = async (url) => {
  const formData = new FormData();
  formData.append("file", fs.createReadStream(url));
  formData.append("model", "whisper-v3-turbo");
  formData.append("temperature", "0");
  formData.append("vad_model", "silero");

  const data = await axios.post(
    "https://audio-turbo.us-virginia-1.direct.fireworks.ai/v1/audio/transcriptions",
    formData,
    { headers: { Authorization: "Bearer fw_3ZPpJFV8JAuzBC7JVE5WhzUZ" } }
  );
  return data.data.text;
};
