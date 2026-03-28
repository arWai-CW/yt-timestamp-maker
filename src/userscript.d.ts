interface Tampermonkey {
  GM_addStyle(css: string): void;
  GM_setValue(key: string, value: unknown): void;
  GM_getValue<T = unknown>(key: string, defaultValue?: T): T;
  GM_registerMenuCommand(caption: string, onClick: () => void): number;
  GM_unregisterMenuCommand(menuId: number): void;
}

declare const GM_addStyle: Tampermonkey["GM_addStyle"];
declare const GM_setValue: Tampermonkey["GM_setValue"];
declare const GM_getValue: Tampermonkey["GM_getValue"];
declare const GM_registerMenuCommand: Tampermonkey["GM_registerMenuCommand"];
declare const GM_unregisterMenuCommand: Tampermonkey["GM_unregisterMenuCommand"];
