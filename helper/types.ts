
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
    cdn?: string;
    mediaPath?: string;
}

export interface PublisherRequestConfig {
    github: GithubConfig;
    notion: NotionConfig;
    oss: OssConfig;
}

export interface PublisherConfig {
    configFold?: boolean;
    functionFold?: boolean;
    logFold?: boolean;
}

export interface PublisherOptions {
    aigc: {
        enable: boolean;
    };
    plugin: {
        enable: boolean;
    };
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
        'trans-image': boolean;
        'trans-video': boolean;
        'trans-bookmark': boolean;
        'trans-callout': boolean;
        'trans-quote': boolean;
        'headerImgName': string;
        frontMatter: string;
        autoAddLastUpdateTime: boolean;
        setNotionLastUpdateTime: boolean;
        filePath: string;
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
    name: string;
    // cos?: string;
    // tags?: string[];
    // categories?: string;
    // reference?: string;
    // headerStyle?: string;
    // headerMask?: string;
    // path?: string;
    // callout?: string;
    // noCatalog?: boolean;
    date: string;
    // lastUpdateTime?: string;
    [key: string]: string | string[] | boolean | never;
}
