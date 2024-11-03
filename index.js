
import "expo-router/entry";
import { ReadableStream } from "web-streams-polyfill";
globalThis.ReadableStream = ReadableStream;
console.log("hey ya");