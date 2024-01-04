// declare global {
//     interface Window {
//         _fromMain: (name: string, cb: Listener) => void;
//         _fromMainOnce: (name: string, cb: Listener) => void;
//         _toMain: (name: string, ...props: any[]) => Promise<any>;
//         observerNotionMutation: () => void;
//     }
// }
export interface State {
    config: ConfigState;
    toc: TocState;
    aigc: AigcState;
}
export interface ConfigState {
    data: Config;
}

export interface Config {
    github: {
        token: string;
        branch: string;
        repo: string;
        owner: string;
    }
    oss: {
        secretId: string;
        secretKey: string;
        bucket: string;
        region: string;
    },
    notion: {
        token: string;
    }
}
export interface TocState {
    data: TocItem[];
}

export interface TocItem {
    level: number;
    key: string;
    title: string;
}

export type AigcPrompt = string;
export type AigcModel = 'ChatGPT' | 'Claude' | string;

// export type Aigc = Record<AigcModel, {
//     prompts: AigcPrompt[];
//     lastPrompt: AigcPrompt;
//     key?: string;
// } | undefined>;

export interface Aigc {
    key: {
        [k in AigcModel]: string;
    },
    prompts: string[],
    model: AigcModel,
    temperature: string,
    contextNum: string,
    prompt: string;
}

export interface AigcState {
    data: Aigc;
}

export interface Meta {
    title: string;
    cos: string;
    tags: string[];
    categories: string;
    reference: string;
    headerStyle: string;
    headerMask: string;
    path: string;
    callout: string;
    noCatalog: boolean;
    date: string;
    lastUpdateTime: string;
    [key: string]: string | string[] | boolean;
}
