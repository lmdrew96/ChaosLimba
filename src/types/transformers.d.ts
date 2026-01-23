import '@xenova/transformers';

declare module '@xenova/transformers' {
  interface Env {
    HUGGINGFACE_API_TOKEN?: string;
  }
}
