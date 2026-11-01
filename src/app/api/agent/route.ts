import { handleAgentPost } from "../../../server/agent/index.ts";

export const POST = handleAgentPost;
// Il servizio si ferma a 45 s; la funzione deve vivere abbastanza da chiudere lo stato.
export const maxDuration = 60;
