import WebSocket from "ws";
class ClientLogger {
  #socket;
  constructor({ url }: { url: string }) {
    this.#socket = new WebSocket(url);

    // Listen for the 'open' event
    this.#socket.on("open", () => {
      console.log("Connected to the server");
      this.sendMessage("Hello I am Client"); // Send message once connected
    });

    // Handle messages from the server
    this.#socket.on("message", (data) => {
      console.log(`Received from server: ${data}`);
    });

    // Handle errors
    this.#socket.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });

    // Handle connection close
    this.#socket.on("close", () => {
      console.log("Disconnected from the server");
    });
  }

  sendMessage(data: string) {
    if (this.#socket.readyState === WebSocket.OPEN) {
      this.#socket.send(data);
    } else {
      console.error("Unable to send message: WebSocket is not open.");
    }
  }
  info(data: string) {}
  error(data: string) {}
  debug(data: string) {}
}

export default ClientLogger;
