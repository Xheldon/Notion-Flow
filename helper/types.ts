
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

export interface PublisherRequestConfig {
    language: 'en' | 'cn';
    github: GithubConfig;
    notion: NotionConfig;
    oss: OssConfig;
    ossName: OSSName;
}

export interface PublisherConfig {
    functionFold?: boolean;
    pluginFold?: boolean;
    logFold?: boolean;
    pluginCode?: string;
}

export type OSSName = 'tx' | 'ali' | 'aws';
export interface PublisherOptions {
    language: 'en' | 'cn';
    aigc: {
        enable: boolean;
    };
    plugin: {
        enable: boolean;
    };
    'heading-style': string;
    oss: {
        enable: boolean;
        name: OSSName;
        tx?: OssConfig;
        ali?: OssConfig;
        aws?: OssConfig;
        cdn?: string;
        mediaPath?: string;
    };
    notion: NotionConfig;
    publisher: {
        enable: boolean;
        enableFrontMatter: boolean;
        github: GithubConfig;
        'trans-image': boolean;
        'trans-video': boolean;
        'trans-bookmark': boolean;
        'trans-callout': boolean;
        'trans-quote': boolean;
        headerImgName: string;
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
    data: LogItem[];
}

export interface LogItem {
    type: 'error' | 'info' | 'warn';
    header: string; // Note: 简短的 log 通知
    msgs: string; // Note: log 内容，允许 html 标签渲染，为了显示 json 格式内容
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

export interface Req_PostMessageProps {
    type: string;
    block: any;
    id: string;   
}

export interface Req_PostMessageResult {
    id: string;
    result: string;
}
