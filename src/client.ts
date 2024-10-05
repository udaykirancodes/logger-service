// client.mjs
import WebSocket from "ws";

const url = "ws://localhost:8080";
const socket = new WebSocket(url);

socket.on("open", () => {
  console.log("Connected to the server");
});

// Function to send a message to the server
function sendMessage(message: string) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message);
    console.log(`Sent to server: ${message}`);
  } else {
    console.error("Unable to send message: WebSocket is not open.");
    setTimeout(() => {
      sendMessage(message);
    }, 1000);
  }
}
console.log("here");
sendMessage("falkdsflakdfl");
socket.on("message", (message) => {
  console.log(`Received from server: ${message}`);
});

// Handle errors
socket.on("error", (error) => {
  console.error(`WebSocket error: ${error}`);
});

// Handle connection close
socket.on("close", () => {
  console.log("Disconnected from the server");
});
