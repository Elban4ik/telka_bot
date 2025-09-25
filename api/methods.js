import { saveMessage, updateUser } from "../db/database.js";

export const saveAndReply = async (ctx, text) => {
  await saveMessage(ctx.chat.id, text, "system");
  await updateUser("await_message", ctx.chat.id, false);
  ctx.reply(text);
};

export const formattedContext = (data) => {
  return data
    .map((message) => {
      return { role: message.role, content: message.message_text };
    })
    .reverse();
};
