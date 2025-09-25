import { Telegraf } from "telegraf";
import { getAiResponse, sendVoiceMessage } from "./ai.js";
import {
  deleteFile,
  downloadVoiceFile,
  transcribeVoice,
} from "./api/deepgram.js";
import { createUser, getContext, getUser, saveMessage, updateUser } from "./db/database.js";
import { formattedContext, saveAndReply } from "./api/methods.js";

const bot = new Telegraf("8090227730:AAEt365O0lUQnTGBCqZd06yi32pHSBN-yTg");

bot.start(async (ctx) => {
  const userData = {
    chatId: ctx.chat.id,
    tgName: ctx.chat.username,
  };
  const user = await getUser(chatId);
  if (user) {
    sendVoiceMessage(
      ctx,
      "Привет, как твои дела? Я могу слушать твои голосовые, не стесняйся отправляй свой милый голос"
    );
  } else {
    await createUser(userData);
    sendVoiceMessage(
      ctx,
      "Привет, как твои дела? Я могу слушать твои голосовые, не стесняйся отправляй свой милый голос"
    );
  }
});

bot.on("text", async (ctx) => {
  await ctx.sendChatAction("typing");
  const user = await getUser(ctx.chat.id);
  const context = await getContext(ctx.chat.id)
  if (user.await_message) {
    ctx.reply("Ой... я пока думаю над предыдущим сообщением");
    return;
  }
  await updateUser("await_message", ctx.chat.id, true);
  await saveMessage(ctx.chat.id, ctx.message.text, "user");
  getAiResponse(ctx.message.text, formattedContext(context)).then(async (data) => {
    if (data.length < 100) {
      sendVoiceMessage(ctx, data);
    } else {
      await saveAndReply(ctx, data);
    }
  });
});

bot.on("voice", async (ctx) => {
  try {
    if (ctx.message.voice.duration > 30) {
      ctx.sendChatAction("typing");
      ctx.reply(
        "Слушааай, мне лень слушать такие длинные гс, уложись в 30 секунд :)"
      );
      return;
    }
    const fileId = ctx.message.voice.file_id;
    const chatId = ctx.message.chat.id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const filePath = await downloadVoiceFile(fileLink.href, chatId);
    const transcription = await transcribeVoice(filePath);

    if (ctx.message.voice.duration < 15) {
      getAiResponse(transcription).then((data) => {
        sendVoiceMessage(ctx, data);
        deleteFile(filePath);
      });

      return;
    }

    if (transcription) {
      ctx.sendChatAction("typing");
      getAiResponse(transcription).then((data) => {
        ctx.reply(data);
        deleteFile(filePath);
      });
    } else {
      await ctx.reply("Не удалось распознать речь");
    }
  } catch (error) {
    console.error("Ошибка при обработке голосового сообщения:", error);
    await ctx.reply("Произошла ошибка при обработке голосового сообщения");
  }
});

bot.launch();
