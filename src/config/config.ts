import dotenv from "dotenv";
dotenv.config();

const PORT = parseInt(process.env.PORT as string);

export { PORT };
