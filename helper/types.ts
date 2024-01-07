// declare global {
//     interface Window {
//         _fromMain: (name: string, cb: Listener) => void;
//         _fromMainOnce: (name: string, cb: Listener) => void;
//         _toMain: (name: string, ...props: any[]) => Promise<any>;
//         observerNotionMutation: () => void;
//     }
// }
export interface State {
    publisher: PublisherState;
    toc: TocState;
    aigc: AigcState;
    logs: LogsState;
}
export interface PublisherState {
    data: PublisherConfig;
}

export interface GithubConfig {
    token: string;
    branch: string;
    repo: string;
    owner: string;
}

export interface NotionConfig {
    token: string;
}

export interface OssConfig {
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
}
export interface PublisherConfig {
    configFold?: boolean;
    functionFold?: boolean;
    logFold?: boolean;
}

export interface PublisherOptions {
    aigc: boolean;
    'heading-style': string;
    oss: {
        enable: boolean;
        name: 'tx' | 'ali';
        tx: OssConfig;
    };
    publisher: {
        enable: boolean;
        github: GithubConfig;
        notion: NotionConfig;
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

export interface AigcData {
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
    data: AigcData;
}

export interface LogsState {
    data: string[];
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
