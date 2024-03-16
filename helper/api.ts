/* eslint-disable @typescript-eslint/unbound-method */
import type { PublisherRequestConfig, PublisherOptions, Meta } from '$types';
import { Client, collectPaginatedAPI } from '@notionhq/client';
import { Storage } from "@plasmohq/storage"
import txOSS from 'cos-js-sdk-v5';
import aliOSS from 'ali-oss'
import {
    S3Client,
    HeadObjectCommand,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
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

function updateConfigDeco () {
    return storage.get<PublisherOptions>('options').then(_ => {
        return this.updateConfig({
            github: _.publisher?.github,
            notion: _.notion,
            oss: _.oss?.[_.oss?.name],
            ossName: _.oss?.name,
        });
    });
}

// Note: 不同 OSS 服务商对应的接口配置给统一一下

// const store = new Store<{'config': Config}>();
export default class Req {
    notion: Client | any;
    oss: txOSS | aliOSS | any;
    cdn: any;
    github: Octokit;
    githubCommon: {
        owner: string;
        repo: string;
        branch: string;
    };
/*     ossCommon: {
        Bucket: string;
        Region: string;
    }; */
    // ossDirCache: COS.CosObject[]; // Note: 第一次获取资源目录后缓存起来
    config: PublisherRequestConfig;
    constructor(props: PublisherRequestConfig) {
        // console.log('ppprops:', props);
        this.updateConfig(props);
    }

    getNotionContent(block_id: string) {
        return storage.get<PublisherOptions>('options').then((props) => {
            const {language: lang} = props || {};
            const cn = lang === 'cn';
            return updateConfigDeco.call(this).then(() => {
                if (!this.notion) {
                    logToRenderer('error',
                        cn ? '[Notion] Notion API Token 未配置' : '[Notion] Notion ingetration token not config');
                    return Promise.reject(null);
                }
                return new Promise((res, rej) => {
                    setTimeout(() => {
                        res(collectPaginatedAPI<{[key: string]: string}, any>(this.notion.blocks.children.list, {
                            block_id,
                        }).catch(err => {
                            logToRenderer('error',
                            cn ? '[Notion] collectPaginatedAPI 接口发生错误:' : '[Notion] collectPaginatedAPI API error:', err);
                            rej(null);
                        }));
                    }, 3000 * Math.random());
                });
            }).catch((err) => {
                if (err) {
                    logToRenderer('error',
                            cn ? '[Notion Flow] 接口初始化过程发生错误:' : '[Notion Flow] Init API error:', err);
                }
                return Promise.reject(null);
            });
        });
    }

    // FIXME: 腾讯云限制每秒 20 个请求，节流一下.
    async uploadNotionImageToOSS(props: {url: string; meta: Meta; id: string; debug: boolean; uuid?: string;}): Promise<string> {
        // Note: uuid 的作用是对于头图来说可能会变，但是 id 不变，所以需要唯一识别 用 last_edited_time 即可
        // FIXMED: 因为存在同步更新 github 后写入 publish 为 true 的逻辑（即使之前已经是 true 了），导致 last_edited_time 会变，结果就是每更新一次，头图的地址都
        //  会变化一次...先不管了
        // Note: 上层 fix 了 uuid 问题，取 url 的 pathname 作为 uuid 而不是 last_edited_time
        const {language: lang, oss} = await storage.get<PublisherOptions>('options') || {};
        const cn = lang === 'cn';
        try {
            await updateConfigDeco.call(this);
            if (!this.oss) {
                logToRenderer('warn',
                    cn ? '[OSS] OSS 服务未配置，媒体文件将会被忽略' : '[OSS] OSS service not config, media will be ignored');
                return Promise.resolve(null);
            }
            const cdn = oss?.cdn;
            if (!cdn) {
                logToRenderer('warn',
                    cn ? '[OSS] CDN 地址未配置，媒体文件将会被忽略' : '[OSS] CDN address not config, media will be ignored');
                return Promise.resolve(null);
            }
            const mediaPath = oss?.mediaPath;
            if (!mediaPath) {
                logToRenderer('warn',
                    cn ? '[OSS] 媒体上传路径未配置，媒体文件将会被忽略' : '[OSS] Media path not config, media will be ignored');
                return Promise.resolve(null);
            }
            const {url, meta, id, debug, uuid = ''} = props;
            const pathname = new URL(url).pathname;
            const suffixArr = pathname.split('.');
            const suffix = suffixArr.length > 1 && suffixArr[suffixArr.length - 1];
            const hasSuffix = imgSuffix.includes(suffix);
            const cosPath = parserProperty(mediaPath, {meta});
            // Note: 我的 mediaPath 设置就应该是 img/in-post/{{YYYY}}/{{name}}
            const key = `${cosPath}/${uuid ? btoa(uuid) + '-' : ''}${id}.${(suffix && hasSuffix) ? suffix : 'webp'}`;
            try {
                await new Promise((res, rej) => {
                    setTimeout(() => {
                        this.oss.headObject({
                            key: key,
                        }, {rej, res});
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
                        }
                        try {
                            const uri = `${cdn}/${key}`;
                            if (!debug) {
                                logToRenderer('info',
                                    cn ? `[OSS] 准备上传 ${id}:` : `[OSS] Ready to upload ${id}:`, {key, cdn, full: uri});
                                // Note: 不搞那么复杂，加个随机的延时就行
                                await new Promise((res, rej) => {
                                    setTimeout(() => {
                                        this.oss.putObject({
                                            key,
                                            body: blob
                                        }, {rej, res})
                                    }, 5000 * Math.random());
                                });
                            } else {
                                logToRenderer('info',
                                    cn ? `[Debug OSS] 上传 ${id} 成功:` : `[Debug OSS] Upload ${id} success:`, key);
                            }
                            return uri;
                        } catch (err) {
                            logToRenderer('error',
                                cn ? `[OSS] 上传 ${id} 出错:` : `[OSS] Upload ${id} faild:`, err);
                            throw new Error(err);
                        }
                    } else {
                        logToRenderer('error',
                            cn ? '[Notion] 获取 Notion 图片错误:' : '[Notion] Get Notion image error:', res);
                        throw new Error(err);
                    }
                } else {
                    throw new Error(err);
                }
            }
        } catch (err) {
            logToRenderer('error',
                cn ? '[OSS] 上传媒体过程中发生错误:' : `[OSS] Try upload media err:`, err);
            throw new Error(err);
        }
    }

    getNotionMeta(blockId: string, debug: boolean): Promise<Meta> {
        return storage.get<PublisherOptions>('options').then((props) => {
            const {language: lang, publisher} = props || {};
            const cn = lang === 'cn';
            return updateConfigDeco.call(this).then(() => {
                if (!this.notion) {
                    logToRenderer('error',
                        cn ? '[Notion] Notion API Token 未配置' : '[Notion] Notion ingetration token not config');
                    return Promise.reject(null);
                }
                return this.notion.pages.retrieve({ page_id: blockId }).then(response => {
                    const {
                        title,
                        name,
                        date,
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
                    // Note: 将其上传到 oss 后拿到 url, 图片 id 就以 pageId（blockId 即可）
                    // Note: 既然走到这里，publisher 一定是启用的，所以不判断了 enable 了
                    // Note: 处理一下 上传的 path
                    if (cover && publisher?.['headerImgName']) {
                        const pathname = new URL(cover).pathname;
                        return this.uploadNotionImageToOSS({url: cover, meta, id: blockId, debug, uuid: pathname}).then(coverUrl => {
                            if (!coverUrl) {
                                // Note: coverUrl 不存在，可能是 oss 服务未配置，忽略该属性
                                logToRenderer('warn',
                                    cn ? '[OSS] OSS 服务未配置，头图将会被忽略：' : '[OSS] OSS service not config, cover image will be ignored:');
                            } else {
                                meta[publisher['headerImgName']] = coverUrl;
                            }
                            // Note: 过滤掉空属性
                            Object.keys(meta).forEach(key => {
                                if (!meta[key]) {
                                    delete meta[key];
                                }
                            });
                            return meta;
                        }).catch((err) => {
                            logToRenderer('error',
                                cn ? '[OSS] 上传头图到 OSS 出错, 忽略该属性:' : '[OSS] Upload cover to OSS error, ignore it:', err);
                            Object.keys(meta).forEach(key => {
                                if (!meta[key]) {
                                    delete meta[key];
                                }
                            });
                            return meta;
                        });
                    } else {
                        // Note: 过滤掉空属性
                        Object.keys(meta).forEach(key => {
                            if (!meta[key]) {
                                delete meta[key];
                            }
                        });
                        return meta;
                    }
                }).catch((err) => {
                    logToRenderer('error',
                        cn ? '[Notion] Notion pages.retrieve 接口报错:' : '[Notion] Notion pages.retrieve API error:', err);
                    return Promise.reject(null);
                });
            }).catch((err) => {
                if (err) {
                    logToRenderer('error',
                            cn ? '[Notion Flow] 接口初始化过程发生错误:' : '[Notion Flow] Init API error:', err);
                }
                return Promise.reject(null);
            });
        });
    }

    updateNotionLastUpdateTime(props: {blockId: string; debug: boolean}) {
        return updateConfigDeco.call(this).then(() => {
            return storage.get<PublisherOptions>('options').then((options) => {
                const {language: lang} = options || {};
                const cn = lang === 'cn';
                if (!this.notion) {
                    logToRenderer('error',
                        cn ? '[Notion] Notion API Token 未配置' : '[Notion] Notion ingetration token not config');
                    // Note: 不 reject，因为更新 lastUpdateTime 不是必须的，出错不影响大流程
                    return Promise.resolve(null);
                }
                const { blockId, debug } = props;
                const date = getISODateTime(new Date());
                if (debug) {
                    return true;
                } else {
                    return this.notion.pages.update({
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
            });
        });
    }

    send2Github(props: {meta: Meta, content: string, debug: boolean}):Promise<any> {
        return updateConfigDeco.call(this).then(() => {
            return storage.get<PublisherOptions>('options').then((options) => {
                const {language: lang, publisher} = options || {};
                const cn = lang === 'cn';
                if (!this.github) {
                    logToRenderer('error',
                        cn ? '[Github] Github Personal Token 未配置' : '[Github] Github Personal Token not config');
                    return Promise.reject(null);
                }
                if (!publisher) {
                    return Promise.reject(null);
                }
                // Note: 我的 filePath 设置就应该是 _posts/{{categories}}/{{YYYY}}/{{YYYY}}-{{MM}}-{{DD}}-{{name}}.md
                const _path = parserProperty(publisher.filePath, {meta: props.meta});
                if (!_path) {
                    logToRenderer('error',
                        cn ? '[Github] Github 文件上传路径未配置或不可用' : '[Github] File path not config or invalid');
                    return Promise.reject(null);
                }
                const {meta, content, debug} = props;
                // Note: path 需要 parserProperty 处理一下
                const getContentConfig = {
                    ...this.githubCommon,
                    path: _path,
                };
                const contentBase64 = Buffer.from(content).toString('base64');
                return this.github.rest.repos.getContent(getContentConfig).then((res): any => {
                    const {content, ..._res} = res as any;
                    logToRenderer('info',
                        cn ? '[Github] Github 指定文件已存在，即将更新，文件信息:' : '[Github] File exist, update it now, file info:', _res);
                    
                    const createOrUpdateConfig = {
                        ...this.githubCommon,
                        path: _path,
                        message: `${cn ? '更新' : 'Update'} ${meta.title} !`,
                        // Note: 显然这是一个 octokit 的 bug，它的类型定义里面 data 只能是数组（目录），但实际还可以是对象
                        //  见：https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28#get-repository-content
                        //  和：https://octokit.github.io/rest.js/v20 （搜索 getContent)
                        sha: !Array.isArray(res.data) && res.data?.sha,
                        content: contentBase64,
                    };
                    if (debug) {
                        logToRenderer('info',
                            cn ? '[Debug] createOrUpdateFileContents 方法调用，配置为:' : '[Debug] Call function createOrUpdateFileContents, params is:', createOrUpdateConfig)
                        return cn ? `[Debug] Github 文件「更新」成功` : `[Debug] Github file update success`;
                    } else {
                        return this.github.rest.repos.createOrUpdateFileContents(createOrUpdateConfig).then(res => {
                            logToRenderer('info',
                                cn ? '[Github] Github 更新文件成功:' : '[Github] Update file success:', res);
                            return res;
                        }).catch(err => {
                            logToRenderer('info',
                            cn ? '[Github] Github 更新文件失败:' : '[Github] Update file faild:', err);
                            return Promise.reject(null);
                        });
                    }
                }).catch((err): any => {
                    if (err?.status === 404) {
                        logToRenderer('info',
                            cn ? '[Github] Github 文件不存在，即将新建，路径为:' : '[Github] Github file not exist, create one now, path is:', _path);
                        const createOrUpdateConfig = {
                            ...this.githubCommon,
                            path: _path,
                            message: `${cn ? '创建' : 'Create'} ${meta.title} !`,
                            content: contentBase64,
                        };
                        if (debug) {
                            logToRenderer('info',
                                cn ? '[Debug] createOrUpdateFileContents 方法调用，配置为:' : '[Debug] Call function createOrUpdateFileContents, params is:', createOrUpdateConfig)
                                return cn ? `[Debug] Github 文件「创建」成功` : `[Debug] Github file create success`;
                        } else {
                            return this.github.rest.repos.createOrUpdateFileContents(createOrUpdateConfig).then(res => {
                                logToRenderer('info',
                                    cn ? '[Github] Github 文件创建成功:' : '[Github] Create file success:', res);
                                return res;
                            }).catch(err => {
                                logToRenderer('error',
                                    cn ? '[Github] Github 文件创建失败:' : '[Github] Create file faild:', err);
                                return Promise.reject(null);
                            });
                        }
                    } else {
                        return Promise.reject(null);
                    }
                });
            });
        });
    }
    // Note: 动态修改配置
    updateConfig(props: PublisherRequestConfig) {
        if (props) {
            // Note: 在未配置完毕插件的过程中，(如填写一半的时候自动报错) 会触发 updataConfig，所以这里 try catch 一下
            try {
                const {
                    language: lang,
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
                    },
                    ossName,
                } = props || {};
                if (notionToken) {
                    this.notion = new Client({auth: notionToken});
                }
                if (ossRegion && ossBucket && ossSecretId && ossSecretKey) {
                    this.oss = this.OSSPolyfill(ossName, props.oss, lang === 'cn');
                } else {
                    this.oss = null;
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
            } catch (e) {
                // console.log('updateConfig 出错（可能是插件配置中途的正常情况）');
            }
        }
    }
    // Note: 根据 oss 服务的名字，对外提供统一的接口
    //  因为先接入的腾讯云，就以他作为标准了
    OSSPolyfill(name, ossConfig, cn) {
        const {region, bucket, secretId, secretKey} = ossConfig;
        switch (name) {
            case 'tx': {
                const oss = new txOSS({
                    SecretId: secretId,
                    SecretKey: secretKey,
                });
                return {
                    headObject: (param, opt) => {
                        const {key} = param;
                        const {rej, res} = opt;
                        oss.headObject({
                            Bucket: bucket,
                            Region: region,
                            Key: key,
                        }, (err, data) => {
                            if (err) {
                                logToRenderer('info',
                                    cn ? `[OSS TX] 准备上传 ${key}:` : `[OSS TX] Ready to upload ${key}:`, err);
                                rej(err);
                                return;
                            }
                            logToRenderer('info',
                                cn ? `[OSS TX] 文件已存在，直接返回 ${key}:` : `[OSS TX] File exist，return it directly ${key}:`, data);
                            res(data);
                        });
                    },
                    putObject: (param, opt) => {
                        const {key, body} = param;
                        const {rej, res} = opt;
                        oss.putObject({
                            Bucket: bucket,
                            Region: region,
                            Key: key,
                            Body: body,
                        }, (err, data) => {
                            if (err) {
                                logToRenderer('error',
                                    cn ? `[OSS TX] 上传文件失败 ${key}:` : `[OSS TX] Upload faild ${key}:`, err);
                                rej(err);
                                return;
                            }
                            logToRenderer('info',
                                cn ? `[OSS TX] 上传文件成功 ${key}:` : `[OSS TX] Upload success ${key}:`, data);
                            res(data);
                        });
                    }
                }
            }
            case 'ali': {
                const oss = new aliOSS({
                    accessKeyId: secretId,
                    accessKeySecret: secretKey,
                    bucket,
                    region,
                });
                return {
                    headObject: (param, opt) => {
                        const {key} = param;
                        const {rej, res} = opt;
                        oss.head(key).then(data => {
                            /**
                             * data 格式为：{meta,res: {data,headers,requestUrls,rt,status,statusCode},status:200}
                             */
                            logToRenderer('info',
                                cn ? `[OSS ALI] 文件已存在，直接返回 ${key}:` : `[OSS ALI] File exist，return it directly ${key}:`, data);
                            res(data);
                        }).catch(err => {
                            logToRenderer('info',
                                    cn ? `[OSS ALI] 准备上传 ${key}:` : `[OSS ALI] Ready to upload ${key}:`, err);
                            rej({statusCode: 404});
                        });
                    },
                    putObject: (param, opt) => {
                        const {key, body} = param;
                        const {rej, res} = opt;
                        oss.put(key, body).then(data => {
                            logToRenderer('info',
                                cn ? `[OSS ALI] 上传文件成功 ${key}:` : `[OSS ALI] Upload success ${key}:`, data);
                            res(data);
                        }).catch(err => {
                            if (err) {
                                logToRenderer('error',
                                    cn ? `[OSS ALI] 上传文件失败 ${key}:` : `[OSS ALI] Upload faild ${key}:`, err);
                                rej(err);
                            }
                        });
                    }
                }
            }
            case 'aws': {
                const oss = new S3Client({
                    region,
                    credentials: {
                        accessKeyId: secretId,
                        secretAccessKey: secretKey,
                    }
                });
                return {
                    headObject: (param, opt) => {
                        const {key} = param;
                        const {rej, res} = opt;
                        oss.send(new HeadObjectCommand({
                            Bucket: bucket,
                            Key: key,
                        })).then(data => {
                            logToRenderer('info',
                                cn ? `[OSS AWS] 文件已存在，直接返回 ${key}:` : `[OSS AWS] File exist，return it directly ${key}:`, data);
                            res(data);
                        }).catch(err => {
                            // Note: 这里提示我 UnknownError 奇了怪了，不应该是 NotFoundError 吗？
                            logToRenderer('info',
                                    cn ? `[OSS AWS] 准备上传 ${key}:` : `[OSS AWS] Ready to upload ${key}:`, err);
                            rej({statusCode: 404});
                        });
                    },
                    putObject: (param, opt) => {
                        const {key, body} = param;
                        const {rej, res} = opt;
                        oss.send(new PutObjectCommand({
                            Bucket: bucket,
                            Key: key,
                            Body: body,
                        })).then(data => {
                            /**
                             * data 数据结构形如：{$metadata:{httpStatusCode}, Etag, ServerSideEncryption}
                             */
                            logToRenderer('info',
                                cn ? `[OSS AWS] 上传文件成功 ${key}:` : `[OSS AWS] Upload success ${key}:`, data);
                            res(data);
                        }).catch(err => {
                            if (err) {
                                logToRenderer('error',
                                    cn ? `[OSS AWS] 上传文件失败 ${key}:` : `[OSS AWS] Upload faild ${key}:`, err);
                                rej(err);
                                return;
                            }
                        });
                    }
                };
            }
        }
    };
    
    
    // Note: 这个装饰器用法怎么跟官网的 https://www.tslang.cn/docs/handbook/decorators.html 方法装饰器不一样啊？
    //  第一个指向原型，第二个是属性名，第三个是描述符
    
}
