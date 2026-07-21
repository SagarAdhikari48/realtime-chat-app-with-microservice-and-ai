import { Response } from "express";
import TryCatch from "../config/tryCatch.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import axios from "axios";
import { io, getReceiverSocketId } from "../config/socket.js";

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;

    console.log("[createNewChat] userId:", userId, "otherUserId:", otherUserId);

    if (!otherUserId) {
      res.status(400).json({
        message: "Other userid is required",
      });
      return;
    }

    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });

    if (existingChat) {
      res.json({
        message: "Chat already exists",
        chatId: existingChat._id,
      });
      return;
    }

    const newChat = await Chat.create({
      users: [userId, otherUserId],
    });

    res.status(201).json({
      message: "New Chat Created!",
      chatId: newChat._id,
    });
  },
);

export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(400).json({
      message: "UserId missing",
    });
    return;
  }

  const chat = await Chat.find({ users: userId }).sort({ updatedAt: -1 });
  const chatWithUserData = await Promise.all(
    chat.map(async (chat) => {
      //this is for showing typing indication in the chat messages -
      // we do have two ids in chat database one is mine and another is second person whom i chatted with .
      const otherUserId = chat?.users?.find(
        (id) => id.toString() !== userId.toString(),
      );

      const unseenCount = await Messages.countDocuments({
        chatId: chat.id,
        sender: { $ne: userId },
        seen: false,
      });
      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
        );
        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.log(error);
        return {
          user: {
            user: { _id: otherUserId, name: "Unknown User" },
          },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      }
    }),
  );
  res.json({
    chats: chatWithUserData,
  });
});

export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?._id;
  const { chatId, text } = req.body;
  const imageFile = req.file;

  console.log("[sendMessage] senderId:", senderId, "chatId:", chatId, "text:", text);
  //sender id check 401 unauthorized
  if (!senderId) {
    res.status(401).json({
      messages: "Unauthorized!",
    });
    return;
  }
  // check chat id 400 - Bad request
  if (!chatId) {
    res.status(400).json({
      message: "ChatId Required!",
    });
    return;
  }
  // text or image file - 400 -bad request
  if (!text && !imageFile) {
    res.status(400).json({
      message: "Either text or image is required!",
    });
    return;
  }
  // find chat here if not found 404 status code.
  const chat = await Chat.findById(chatId);
  if (!chat) {
    res.status(404).json({
      message: "Chat not found!",
    });
    return;
  }

  //check the chat belongs to loggedin user or someone else- cannot retrieve others chat messages
  const isUserInChat = chat?.users?.some(
    (userId) => userId.toString() === senderId.toString(),
  );

  if (!isUserInChat) {
    res.status(403).json({
      message: "You are not allowed to see other's chat",
    });
    return;
  }

  //other user id
  const otherUserId = chat?.users?.find(
    (userId) => userId.toString() !== senderId.toString(),
  );
  if (!otherUserId) {
    res.status(401).json({
      messages: "No Other user!",
    });
    return;
  }

  //Socket Setup

  //Create message data
  let messageData: any = {
    chatId: chatId,
    sender: senderId.toString(),
    seen: false,
    seenAt: undefined,
  };

  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      publicId: imageFile.filename,
    };
    messageData.messageType = "image";
    messageData.text = text || "";
  } else {
    messageData.text = text;
    messageData.messageType = "text";
  }

  //const message = new Message created!
  const message = new Messages(messageData);

  //Saved message
  const savedMessage = await message.save();

  //update latest message
  const latestMessageText = imageFile ? "📸 Image" : text;

  //Update chat by id
  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true },
  ); // to update new: true

  // Emit socket to the receiver in real time
  const receiverSocketId = getReceiverSocketId(otherUserId.toString());
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", savedMessage);
  }

  //Updated  response
  res.status(201).json({
    message: savedMessage,
    sender: senderId,
  });
});

export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { chatId } = req.params;

    if (!userId) {
      res.status(401).json({
        message: "Unauthorized!",
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        message: "ChatId required!",
      });
      return;
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      res.status(404).json({
        message: "Chat is not found!",
      });
      return;
    }
    const isUserInChat = chat?.users?.some(
      (id) => id.toString() === userId.toString(),
    );

    if (!isUserInChat) {
      res.status(403).json({
        message: "You are not allowed to see other's chat",
      });
      return;
    }

    const messagesToMarkSeen = await Messages.find({
      chatId: chatId,
      sender: { $ne: userId },
      seen: false,
    });

    await Messages.updateMany(
      {
        chatId: chatId,
        sender: { $ne: userId },
        seen: false,
      },
      {
        seen: true,
        seenAt: new Date(),
      },
    );

    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });
    const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());

    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
      );

      if (!otherUserId) {
        res.status(400).json({
          message: "No other user Bad Request!",
        });
      }

      ///Socket work remaining: -if user is already online and senn mark as seen 

      res.json({
        messages,
        user: data,
      });
    } catch (error) {
      console.log(error);
      res.json({
        messages,
        user: { _id: otherUserId, name: "Unknown User" },
      });
    }
  },
);
