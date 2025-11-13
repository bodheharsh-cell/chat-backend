import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true }
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
// Get all messages (with username populated)
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().populate("sender");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { sender, text } = req.body;

    // Create
    const message = await Message.create({ sender, text });

    // Populate
    const fullMessage = await Message.findById(message._id).populate("sender");

    // Emit real-time
    io.emit("new_message", fullMessage);

    // Respond
    res.json({ success: true, message: fullMessage });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

