// Global type declarations for packages without TypeScript support

declare module "@tailwindcss/vite" {
  import { Plugin } from "vite";
  
  interface TailwindCSSOptions {
    // Add any specific options if needed
  }
  
  function tailwindcss(options?: TailwindCSSOptions): Plugin;
  export default tailwindcss;
}

declare module "vike/plugin" {
  import { Plugin } from "vite";
  
  interface VikeOptions {
    // Add any specific options if needed
  }
  
  function vike(options?: VikeOptions): Plugin;
  export default vike;
}

// SVG imports
declare module "*.svg" {
  const content: string;
  export default content;
}

// Other asset types
declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}