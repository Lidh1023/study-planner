declare module "@langchain/openai" {
  export class ChatOpenAI {
    constructor(config?: any);
    invoke(input: any): Promise<any>;
  }
}

declare module "@langchain/core/messages" {
  export class SystemMessage {
    constructor(content: string);
    content: string;
  }
  export class HumanMessage {
    constructor(content: string);
    content: string;
  }
}
