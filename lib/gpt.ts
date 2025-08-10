// /lib/gpt.ts
import GPT4AllImport from "gpt4all";

const { GPT4All } = GPT4AllImport as any;

let gptInstance: any;

export async function getGptInstance() {
  if (!gptInstance) {
    gptInstance = new GPT4All("/models/orca-mini-3b.ggmlv3.q4_0.bin");
    await gptInstance.init();
    await gptInstance.open();
  }
  return gptInstance;
}
