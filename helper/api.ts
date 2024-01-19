/* eslint-disable @typescript-eslint/unbound-method */
import type { PublisherRequestConfig, PublisherOptions, Meta } from '$types';
import { Client, collectPaginatedAPI } from '@notionhq/client';
import { Storage } from "@plasmohq/storage"
import COS from 'cos-js-sdk-v5';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
// import sharp from 'sharp';
import { _inline, logToRenderer, getISODateTime, getPropertyValue, getPropertyCompuValue, parserProperty } from '$utils';
import { Octokit } from 'octokit';

// Note: 除了数组中的元素不转为 webp，其他的都转成 webp
const imgSuffix = [
    // 'apng',
    // 'avif',
    // 'bmp',
    'gif',
    // 'ico',
    // 'cur',
    // 'jpg',
    // 'jpeg',
    // 'jfif',
    // 'pjpeg',
    // 'pjp',
    // 'png',
    'svg',
    // 'tif',
    // 'tiff', // 这俩网页显示不了，转一下
    'webp',
    // 以下为 video 标签支持的视频格式
    'mp4',
    'webm',
    'ogg',
];

const storage = new Storage();

async function updateConfigDeco (that: Req) {
        const _: PublisherOptions = await storage.get('options');
    this.updateConfig({
        github: _.publisher.github,
        notion: _.publisher.notion,
        oss: _.oss[_.oss.name],
    });
}

// const store = new Store<{'config': Config}>();
export default class Req {
    notion: Client | any;
    oss: COS;
    cdn: any;
    github: Octokit;
    githubCommon: {
        owner: string;
        repo: string;
        branch: string;
    };
    ossCommon: {
        Bucket: string;
        Region: string;
    };
    ossDirCache: COS.CosObject[]; // Note: 第一次获取资源目录后缓存起来
    config: PublisherRequestConfig;
    constructor(props: PublisherRequestConfig) {
        // console.log('ppprops:', props);
        this.updateConfig(props);
    }

    async getNotionContent(block_id: string) {
        try {
            await updateConfigDeco.bind(this);
            if (!this.notion) {
                logToRenderer('getNotionContent Notion Token 未配置');
                return Promise.resolve(null);
            }
            return new Promise((res, rej) => {
                setTimeout(() => {
                    res(collectPaginatedAPI<{[key: string]: string}, any>(this.notion.blocks.children.list, {
                        block_id,
                    }).catch(err => {rej(err)}));
                }, 3000 * Math.random());
            });
            
        } catch (e) {
            logToRenderer('getNotionContent 函数错误:', e);
            // store.set('log', e);
            return null;
        }
    }

    // FIXME: 腾讯云限制每秒 20 个请求，节流一下.
    async uploadNotionImageToOSS(props: {url: string; meta: Meta; id: string; debug: boolean; uuid?: string;}): Promise<string> {
        // Note: uuid 的作用是对于头图来说可能会变，但是 id 不变，所以需要唯一识别 用 last_edited_time 即可
        // FIXMED: 因为存在同步更新 github 后写入 publish 为 true 的逻辑（即使之前已经是 true 了），导致 last_edited_time 会变，结果就是每更新一次，头图的地址都
        //  会变化一次...先不管了
        // Note: 上层 fix 了 uuid 问题，取 url 的 pathname 作为 uuid 而不是 last_edited_time
        try {
            await updateConfigDeco.bind(this);
            if (!this.oss) {
                logToRenderer('uploadNotionImageToOSS 错误，OSS 未配置');
                return Promise.resolve(null);
            }
            const {oss, publisher} = await storage.get('options') as PublisherOptions;
            const cdn = oss[oss.name].cdn;
            if (!cdn) {
                logToRenderer('uploadNotionImageToOSS 错误，CDN 未配置');
                return Promise.resolve(null);
            }
            const {url, meta, id, debug, uuid = ''} = props;
            const pathname = new URL(url).pathname;
            const suffixArr = pathname.split('.');
            const suffix = suffixArr.length > 1 && suffixArr[suffixArr.length - 1];
            const hasSuffix = imgSuffix.includes(suffix);
            const cosPath = parserProperty(oss[oss.name].mediaPath, {meta});
            // Note: 我的 mediaPath 设置就应该是 img/in-post/{{YYYY}}/{{name}}
            const key = `${cosPath}/${uuid ? btoa(uuid) + '-' : ''}${id}.${(suffix && hasSuffix) ? suffix : 'webp'}`;
            try {
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        this.oss.headObject({
                            ...this.ossCommon,
                            Key: key,
                        }, (err, data) => {
                            if (err) {
                                rej(err);
                                return;
                            }
                            if (data) {
                                logToRenderer(`资源 ${key} 已存在，不再上传，直接返回地址`);
                                // console.log('res data:', data);
                                res(data);
                                return;
                            }
                        });
                    }, 5000 * Math.random());
                });
                // FIXME: 设置自定义 cdn 参数
                return `${cdn}/${key}`;
            } catch (err) {
                if (err.statusCode === 404) {
                    const res = await axios({
                        method: 'get',
                        url,
                        responseType: 'blob',
                    });
                    if (res.status === 200) {
                        let blob: any = res.data;
                        if (!hasSuffix) {
                            blob = await imageCompression(blob, {
                                fileType: 'image/webp',
                                initialQuality: 0.8,
                                alwaysKeepResolution: true,
                                useWebWorker: false,
                            });
                            /* blob = await imageConversion.compress(blob, {
                                quality: 0.8,
                                type: "image/webp",
                                width: 300,
                                height: 200,
                                orientation:2,
                                scale: 0.5,
                              }); */
                            /* buffer = await sharp(res.data)
                            .withMetadata({
                                exif: {
                                    IFD0: {
                                        Copyright: 'image from xheldon.com'
                                    }
                                }
                            })
                            .webp({
                                quality: 75
                            })
                            .toBuffer({resolveWithObject: true})
                            .then(({data}) => {
                                return data;
                            }); */
                        }
                        try {
                            const uri = `${cdn}/${key}`;
                            if (!debug) {
                                logToRenderer('准备上传', key);
                                // Note: 不搞那么复杂，加个随机的延时就行
                                await new Promise((res, rej) => {
                                    setTimeout(() => {
                                        this.oss.putObject({
                                            ...this.ossCommon,
                                            Key: key,
                                            Body: blob
                                        }, (err, data) => {
                                            if (err) {
                                                rej(err);
                                                logToRenderer(`上传 ${key} 失败！e:`, err);
                                                return;
                                            }
                                            res(data);
                                            logToRenderer(`上传 ${key} 成功！，刷新缓存暂时需要手动！，地址是 ${cdn}/${key}`);
                                        })
                                    }, 5000 * Math.random());
                                });
                                // logToRenderer(`上传 ${key} 成功！，刷新缓存暂时需要手动！，地址是 ${url}`);
                                // FIXME: 先获取其中图片总数，然后在最后一次性刷新，而不是上传一次刷新一次
                                /* const res = await this.cdn.PurgeUrlsCache({
                                    Urls: [uri]
                                });
                                logToRenderer(`刷新 ${key} 结果:`, res); */
                            } else {
                                logToRenderer('[debug]准备上传', key);
                                logToRenderer(`[debug] 上传 ${key} 成功！，准备刷新缓存！`);
                                logToRenderer(`[debug] 刷新 ${key} 结果:`, '成功');
                            }
                            return uri;
                        } catch (err) {
                            // dialog.showErrorBox('处理图片错误', `上传 ${key} 时遇到错误！e: ${err}`);
                            logToRenderer('处理图片错误:上传', key, '时遇到错误！e:', err);
                            throw new Error(err);
                        }
                    } else {
                        logToRenderer('获取 Notion 图片错误:', res);
                        // dialog.showErrorBox('处理图片错误', `获取 Notion 图片错误: ${res}`);
                    }
                } else {
                    throw new Error(err);
                }
            }
        } catch (err) {
            logToRenderer(`upload image err: ${err}`);
            throw new Error(err);
        }
    }

    async getNotionMeta(blockId: string, debug: boolean): Promise<Meta> {
        try {
            await updateConfigDeco.bind(this);
            if (!this.notion) {
                logToRenderer('getNotionMeta 错误，Notion Token 未配置');
                return Promise.resolve(null);
            }
            const response = await this.notion.pages.retrieve({ page_id: blockId });
            const {
                // tags,
                // categories,
                // cos,
                // reference,
                // headerStyle,
                // headerMask,
                // path,
                // callout,
                // noCatalog,
                title,
                name,
                date,
                // lastUpdateTime,
                // notion,
                ...rest // Note: 用户自定义 Page Property 会放在这里
            } = response.properties;
            // Note: 其他的根据插件配置生成的部分，如果页面配置了，则用页面写死的，否则根据规则生成，且不写到 Markdown 文件中:
            // 1. cos 根据配置生成，支持引用页面的其他 property 变量，内置的变量有（取自必填项 date 属性） YYYY、YY、MM、DD，如 {{YYYY}}/{{MM}}/{{DD}}/{{title}}/{{name}} 这种
            // 2. 文件 path 同理，Jekyll 博客强制 post 位于 _posts 目录下，因此这个可以不用配置，剩余的变量同上

            // 目前 Property 只支持单选框 checkbox、多选 multi_select、文本 rich_text、日期 date、链接格式 url、formula
            // 如果有头图，默认是 cover 属性

            let cover = '';
            if (response.cover) {
                cover = response.cover[response.cover.type]?.url;
            }
            let meta = {
                title: _inline(getPropertyValue(title)),
                name: _inline(getPropertyValue(name)),
                date: getPropertyValue(date)?.start,
            };
            Object.keys(rest).forEach(key => {
                const obj = rest[key];
                if (!obj) return;
                switch (obj.type) {
                    case 'rich_text':
                        meta[key] = _inline(getPropertyValue(obj));
                        break;
                    case 'multi_select':
                        meta[key] = getPropertyValue(obj).map((tag: {name: string;}) => tag.name) || [];
                        break;
                    case 'select':
                        meta[key] = getPropertyValue(obj).name;
                        break;
                    case 'date':
                        meta[key] = getPropertyValue(obj)?.start;
                        break;
                    case 'url':
                        meta[key] = getPropertyValue(obj);
                        break;
                    case 'formula':
                        meta[key] = getPropertyCompuValue(obj);
                        break;
                    default:
                        break;
                }
            });
            /* const meta = {
                tags: getValue(tags).map((tag: {name: string;}) => tag.name),
                categories: getCompuValue(categories),
                cos: getCompuValue(cos),
                reference: getValue(reference) || '',
                headerStyle: getCompuValue(headerStyle),
                headerMask: getCompuValue(headerMask),
                path: getCompuValue(path),
                callout: _inline(getValue(callout)) || '',
                noCatalog: getValue(noCatalog) || '',
                title: _inline(getValue(title)),
                date: getValue(date)?.start || '',
                lastUpdateTime: getValue(lastUpdateTime)?.start || '',
                notion: getValue(notion) || '',
                headerImg: '',
            }; */
            // Note: 将其上传到 oss 后拿到 url, 图片 id 就以 pageId（blockId 即可）
            const {publisher} = await storage.get('options') as PublisherOptions;
            // Note: 既然走到这里，publisher 一定是启用的，所以不判断了 enable 了
            // Note: 处理一下 上传的 path
            if (cover && publisher['headerImgName']) {
                const pathname = new URL(cover).pathname;
                const coverUrl = await this.uploadNotionImageToOSS({url: cover, meta, id: blockId, debug, uuid: pathname});
                    meta[publisher['headerImgName']] = coverUrl;
            }
            // Note: 过滤掉空属性
            Object.keys(meta).forEach(key => {
                if (!meta[key]) {
                    delete meta[key];
                }
            });
            return meta;
        } catch (e) {
            logToRenderer('获取页面 meta 信息错误:', e);
        }
    }

    async updateNotionLastUpdateTime(props: {blockId: string; debug: boolean}): Promise<boolean> {
        await updateConfigDeco.bind(this);
        if (!this.notion) {
            logToRenderer('updateNotionLastUpdateTime 错误， Notion Token 未配置');
            return Promise.resolve(null);
        }
        const { blockId, debug } = props;
        const date = getISODateTime(new Date());
        if (debug) {
            logToRenderer('更新 Notion 属性成功:', date);
            return true;
        } else {
            return await this.notion.pages.update({
                page_id: blockId,
                properties: {
                    lastUpdateTime: {
                        date: {
                            start: date,
                            end: null,
                            time_zone: null
                        }
                    }
                }
            });
        }
    }

    async send2Github(props: {meta: Meta, content: string, debug: boolean}):Promise<any> {
        await updateConfigDeco.bind(this);
        if (!this.github) {
            logToRenderer('send2Github 错误， Github Token 未配置');
            return Promise.resolve(null);
        }
        const {publisher} = await storage.get('options') as PublisherOptions;
        // Note: 我的 filePath 设置就应该是 _posts/{{categories}}/{{YYYY}}/{{YYYY}}-{{MM}}-{{DD}}-{{name}}.md
        const _path = parserProperty(publisher.filePath, {meta: props.meta});
        if (!_path) {
            logToRenderer('send2Github 错误， 上传文件路径配置错误');
            return Promise.resolve(null);
        }
        const {meta, content, debug} = props;
        // Note: path 需要 parserProperty 处理一下
        const getContentConfig = {
            ...this.githubCommon,
            path: _path,
        };
        const contentBase64 = Buffer.from(content).toString('base64');
        try {
            const res = await this.github.rest.repos.getContent(getContentConfig);
            // Note: content 是 base64 编码的，输出太占空间，所以不打印了
            const {content, ..._res} = res as any;
            console.log('rrrr:', content, res);
            logToRenderer('get info success:', _res);
            
            const createOrUpdateConfig = {
                ...this.githubCommon,
                path: _path,
                message: `更新 ${meta.title} !`,
                // Note: 显然这是一个 octokit 的 bug，它的类型定义里面 data 只能是数组（目录），但实际还可以是对象
                //  见：https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
                //  和：https://octokit.github.io/rest.js/v20 （搜索 getContent)
                sha: !Array.isArray(res.data) && res.data?.sha,
                content: contentBase64,
            };
            try {
                if (debug) {
                    logToRenderer('[debug] createOrUpdateFileContents 方法调用，配置为:', createOrUpdateConfig)
                    return `[debug] github 文件「更新」成功`;
                } else {
                    const res = await this.github.rest.repos.createOrUpdateFileContents(createOrUpdateConfig);
                    logToRenderer('更新文件成功:', res);
                    return res;
                }
            } catch (err) {
                logToRenderer('更新文件失败:', err.status, err);
            }
        } catch (err) {
            logToRenderer('文件可能不存在（正常）err:', err);
            if (err.status === 404) {
                const createOrUpdateConfig = {
                    ...this.githubCommon,
                    path: _path,
                    message: `创建 ${meta.title} !`,
                    content: contentBase64,
                };
                try {
                    if (debug) {
                        logToRenderer('[debug] createOrUpdateFileContents 方法调用，配置为:', createOrUpdateConfig)
                        return `[debug] github 文件「创建」成功`;
                    } else {
                        const res = await this.github.rest.repos.createOrUpdateFileContents(createOrUpdateConfig);
                        logToRenderer('创建文件成功:', res);
                        return res;
                    }
                } catch (err) {
                    logToRenderer('创建文件失败:', err.status, err);
                }
            }
        }
    }
    // Note: 动态修改配置
    updateConfig(props: PublisherRequestConfig) {
        if (props) {
            const {
                notion: {
                    token: notionToken
                },
                github: {
                    owner: githubOwner,
                    repo: githubRepo,
                    branch: githubBranch,
                    token: githubToken,
                },
                oss: {
                    region: ossRegion,
                    bucket: ossBucket,
                    secretId: ossSecretId,
                    secretKey: ossSecretKey,
                }
            } = props || {};
            if (notionToken) {
                this.notion = new Client({auth: notionToken});
            }
            if (ossRegion && ossBucket && ossSecretId && ossSecretKey) {
                this.oss = new COS({
                    SecretId: ossSecretId,
                    SecretKey: ossSecretKey,
                });
                // Note: 用于刷新 cdn 缓存，但是这个接口不支持浏览器环境，所以暂时不用
                /* this.cdn = new tencentcloud.cdn.v20180606.Client({
                    credential: {
                        secretId: ossSecretId,
                        secretKey: ossSecretKey,
                    },
                    region: '',
                    profile: {
                        httpProfile: {
                            endpoint: 'cdn.tencentcloudapi.com',
                        }
                    }
                }); */
                this.ossCommon = {
                    Bucket: ossBucket,
                    Region: ossRegion,
                };
            }
            // Note: todo 通知 renderer 信息不完整，禁用发布等按钮
            if (githubOwner && githubRepo && githubBranch && githubToken) {
                this.github = new Octokit({auth: githubToken});
                this.githubCommon = {
                    owner: githubOwner,
                    repo: githubRepo,
                    branch: githubBranch,
                };
            }
        }
    }
    
    // Note: 这个装饰器用法怎么跟官网的 https://www.tslang.cn/docs/handbook/decorators.html 方法装饰器不一样啊？
    //  第一个指向原型，第二个是属性名，第三个是描述符
    
}
