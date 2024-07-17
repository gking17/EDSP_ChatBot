const API_KEY = "sk-proj-q4Kvxkamq3htM8YcLfXHT3BlbkFJnVQBEMCVPcWdtRJsmOaU"; // Replace with your OpenAI API key
const OPENAI_MODEL = 'gpt-4o'
const INSTRUCTIONS = `You are a helpful assistant. Limit your responses to 1-2 sentences.`

const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;

const createChatLi = (message, className) => {
  const chatLi = document.createElement("li");
  chatLi.classList.add("chat", `${className}`);
  let chatContent =
    className === "outgoing"
      ? `<p></p>`
      : `<span class="material-symbols-outlined">smart_toy</span><p></p>`;
  chatLi.innerHTML = chatContent;
  chatLi.querySelector("p").textContent = message;
  return chatLi;
};

const generateResponse = async (chatElement, userMessage) => {
  const messageElement = chatElement.querySelector("p");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: INSTRUCTIONS,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      stream: false,
    }),
  });

  const body = await res.json()

  messageElement.textContent = body.choices[0].message.content;

  chatbox.scrollTo(0, chatbox.scrollHeight);
};

const handleChat = async () => {
  userMessage = chatInput.value.trim();
  if (!userMessage) return;

  // Clear the input textarea and set its height to default
  chatInput.value = "";
  chatInput.style.height = `${inputInitHeight}px`;

  // Append the user's message to the chatbox
  chatbox.appendChild(createChatLi(userMessage, "outgoing"));
  chatbox.scrollTo(0, chatbox.scrollHeight);

  // Display "Thinking..." message while waiting for the response
  const incomingChatLi = createChatLi("Thinking...", "incoming");
  chatbox.appendChild(incomingChatLi);
  chatbox.scrollTo(0, chatbox.scrollHeight);
  await generateResponse(incomingChatLi, userMessage);
};

chatInput.addEventListener("input", () => {
  // Adjust the height of the input textarea based on its content
  chatInput.style.height = `${inputInitHeight}px`;
  chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
  // If Enter key is pressed without Shift key and the window
  // width is greater than 800px, handle the chat
  if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
    e.preventDefault();
    handleChat();
  }
});

function fetchWithStream(endpoint, init) {
  return (async function* _() {
    const response = await fetch(endpoint, init);

    if (!response.ok || !response.body) {
      throw new Error("Network response was not ok");
    }

    const reader = response.body.getReader();
    const textDecoder = new TextDecoder();

    let index = 0;
    while (true) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          yield {
            id: Math.random().toString(16).slice(2),
            choices: [
              {
                index,
                delta: {
                  content: "",
                },
                finish_reason: "stop",
              },
            ],
            created: Date.now(),
            model: OPENAI_MODEL,
            object: "null",
          };
          break;
        }
        const decodedValue = textDecoder.decode(value);
        console.log(value, decodedValue)
        yield JSON.parse(decodedValue.replace('data: ', '').replace('[DONE]', ''));

        index += 1;
      } catch (err) {
        console.log(err)
        continue
      }
    }
  })()
}

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () =>
  document.body.classList.remove("show-chatbot")
);
chatbotToggler.addEventListener("click", () =>
  document.body.classList.toggle("show-chatbot")
);
