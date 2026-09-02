/// <reference types="nativewind/types" />

// NativeWind processa `import './global.css'` via Metro; o TS só precisa
// saber que o módulo existe.
declare module '*.css';
