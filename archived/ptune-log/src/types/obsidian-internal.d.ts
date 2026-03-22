import 'obsidian';

declare module 'obsidian' {
  interface DataAdapter {
    basePath?: string; // desktop のみ
  }

  interface InternalPlugins {
    plugins: Record<string, { enabled: boolean }>;
  }

  interface PluginManager {
    enabledPlugins: Set<string>;
    plugins: Record<string, unknown>;
  }

  interface App {
    internalPlugins?: InternalPlugins;
    plugins?: PluginManager;
  }
}
