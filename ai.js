import OpenAI from "openai";
import fs from "fs";
import axios from "axios";
import { join } from "path";
import { tmpdir } from "os";
import Ffmpeg from "fluent-ffmpeg";
import { saveAndReply } from "./api/methods.js";
import { getContext } from "./db/database.js";

const openai = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: "sk-1bb794f2729c479fb0dae57308be81f3",
});

const extractUserFacts = (args) => {
  console.log(args);
  return { success: true, facts: args.facts, response: args.response };
};

export const getAiResponse = async (text, context) => {
  let systemMessage =
    `Ты девушка-собеседник. Отвечай на русском языке естественно и непринужденно. Не отвечай длинными сообщениями, сложными словами. ` +
    `Говори как друг по переписке. ВОЗВРАЩАЙ ОТВЕТ В ФОРМАТЕ JSON:
    {
      "response": "текст ответа",
      "mood": "настроение",
      "should_voice": true/false,
      "reaction": "короткая реакция"
      "type_of_message": "photo"/"text"/"voice"
    }`;

  const tools = [
    {
      type: "function",
      function: {
        name: "extractUserFacts",
        description:
          "Извлекает из запроса пользователя личные данные, если такие есть в сообщении и возвращает ответ на запрос пользователя. Например: сохранение любимых дел, даты рождения, любимых фильмов и ответ на запрос пользователя",
        parameters: {
          type: "object",
          properties: {
            facts: {
              type: "string",
              description:
                "Список извлеченных фактов о пользователе. Каждый факт должен быть в формате 'тип: значение', например, 'имя: Андрей' или 'хобби: футбол'.",
              items: { type: "string" },
            },
            response: {
              type: "object",
              description: `Здесь ответ на запрос пользователя в формате {
                "response": "текст ответа",
                "mood": "настроение",
                "should_voice": true/false,
                "reaction": "короткая реакция"
              }`,
              items: { type: "string" },
            },
          },
          required: ["facts", "response"],
        },
      },
    },
  ];
  console.log(context)
  try {
    const response = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        ...context,
        { role: "user", content: text },
      ],
      tools: tools,
      tool_choice: "auto", // Автоматический выбор инструментов
      model: "deepseek-chat",
      temperature: 0.7, // Уменьшил температуру для более предсказуемых результатов
    });
    const choice = response.choices[0];
    const message = choice.message;

    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.function.name === "extractUserFacts") {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            const result = extractUserFacts(args);
            return result.response.response;
          } catch (error) {
            console.error("Error parsing function arguments:", error);
          }
        }
      }
    }
    if (message.content) {
      try {
        const parsedResponse = JSON.parse(message.content);
        return parsedResponse.response;
      } catch (e) {
        console.log("AI Response:", message.content);
        return message.content;
      }
    } else {
      return "Извини, я подумаю над ответом...";
    }
  } catch (error) {
    console.error("Error in getAiResponse:", error);
    return "Произошла ошибка при обработке сообщения 😔";
  }
};

export const sendVoiceMessage = async (ctx, data) => {
  // const tts = await axios.post("https://spicy-pets-hope.loca.lt/predict", {
  //   text: data.replace(/[^\w\sа-яА-ЯёЁ.,!?;:()'"-]/gu, ""),
  //   speaker: "pinigin_44",
  // });
  // const audioBuffer = Buffer.from(tts.data.output, "base64");

  // // Создаем временный WAV файл
  // const tempWavPath = join(tmpdir(), `temp_${Date.now()}.wav`);
  // const tempOggPath = join(tmpdir(), `temp_${Date.now()}.ogg`);

  try {
    //   // Сохраняем WAV файл
    //   fs.writeFileSync(tempWavPath, audioBuffer);

    //   // Конвертируем в OGG
    //   await new Promise((resolve, reject) => {
    //     Ffmpeg(tempWavPath)
    //       .audioCodec("libopus")
    //       .audioBitrate("64k")
    //       .format("ogg")
    //       .on("error", reject)
    //       .on("end", resolve)
    //       .save(tempOggPath);
    //   });

    //   // Отправляем результат
    //   await ctx.sendVoice({ source: fs.createReadStream(tempOggPath) });
    await saveAndReply(ctx, "Это голосовое сообщение с текстом:\n" + data);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Удаляем временные файлы
    try {
      fs.unlinkSync(tempWavPath);
    } catch {}
    try {
      fs.unlinkSync(tempOggPath);
    } catch {}
  }
};
