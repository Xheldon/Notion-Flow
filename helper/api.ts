/* eslint-disable @typescript-eslint/unbound-method */
import type { PublisherConfig, Meta } from '$types';
import { Client, collectPaginatedAPI } from '@notionhq/client';
// import Store from 'electron-store';
import COS from 'cos-nodejs-sdk-v5';
// import { dialog } from 'electron';
import axios from 'axios';
import sharp from 'sharp';
import { _inline, logToRenderer, getISODateTime } from '$utils';
import { Octokit } from 'octokit';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';

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
    config: PublisherConfig;
    constructor(props: PublisherConfig) {
        this.updateConfig(props);
    }

    @Req.updateConfigDeco
    async getNotionContent(block_id: string) {
        try {
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
    @Req.updateConfigDeco
    async uploadNotionImageToOSS(props: {url: string; meta: Meta; id: string; debug: boolean; uuid?: string;}): Promise<string> {
        // Note: uuid 的作用是对于头图来说可能会变，但是 id 不变，所以需要唯一识别 用 last_edited_time 即可
        // FIXMED: 因为存在同步更新 github 后写入 publish 为 true 的逻辑（即使之前已经是 true 了），导致 last_edited_time 会变，结果就是每更新一次，头图的地址都
        //  会变化一次...先不管了
        // Note: 上层 fix 了 uuid 问题，取 url 的 pathname 作为 uuid 而不是 last_edited_time
        try {
            const {url, meta: {cos}, id, debug, uuid = ''} = props;
            const pathname = new URL(url).pathname;
            const suffixArr = pathname.split('.');
            const suffix = suffixArr.length > 1 && suffixArr[suffixArr.length - 1];
            const hasSuffix = imgSuffix.includes(suffix);
            const key = `img/in-post/${cos}/${uuid ? btoa(uuid) + '-' : ''}${id}.${(suffix && hasSuffix) ? suffix : 'webp'}`;
            try {
                await new Promise((res) => {
                    setTimeout(() => {
                        res(this.oss.headObject({
                            ...this.ossCommon,
                            Key: key,
                        }));
                    }, 1000 * Math.random());
                });
                logToRenderer(`资源 ${key} 已存在`);
                // FIXME: 设置自定义 cdn 参数
                return `https://static.xheldon.cn/${key}`;
            } catch (err) {
                if (err.statusCode === 404) {
                    const res = await axios({
                        method: 'get',
                        url,
                        responseType: 'arraybuffer',
                    });
                    if (res.status === 200) {
                        let buffer: Buffer = res.data;
                        if (!hasSuffix) {
                            buffer = await sharp(res.data)
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
                            });
                        }
                        try {
                            logToRenderer('准备上传', key);
                            const uri = `https://static.xheldon.cn/${key}`;
                            if (!debug) {
                                // Note: 不搞那么复杂，加个随机的延时就行
                                await new Promise((res) => {
                                    setTimeout(() => {
                                        res(this.oss.putObject({
                                            ...this.ossCommon,
                                            Key: key,
                                            Body: buffer
                                        }));
                                    }, 1000 * Math.random());
                                });
                                logToRenderer(`上传 ${key} 成功！，准备刷新缓存！`);
                                // FIXME: 先获取其中图片总数，然后在最后一次性刷新，而不是上传一次刷新一次
                                const res = await this.cdn.PurgeUrlsCache({
                                    Urls: [uri]
                                });
                                logToRenderer(`刷新 ${key} 结果:`, res);
                            } else {
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
            logToRenderer(`image err: ${err}`);
            throw new Error(err);
        }
    }

    @Req.updateConfigDeco
    async getNotionMeta(blockId: string, debug: boolean): Promise<Meta> {
        try {
            const response = await this.notion.pages.retrieve({ page_id: blockId });
            const {
                tags,
                categories,
                cos,
                reference,
                headerStyle,
                headerMask,
                path,
                callout,
                noCatalog,
                title,
                date,
                lastUpdateTime,
                notion,
            } = response.properties;
            let cover = '';
            if (response.cover) {
                cover = response.cover[response.cover.type]?.url;
            }
            const getValue = (obj: any) => {
                return obj[obj?.type];
            };
            const getCompuValue = (obj: any) => {
                return obj[obj?.type][obj[obj?.type]?.type]
            };
            const meta = {
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
            };
            // Note: 将其上传到 oss 后拿到 url, 图片 id 就以 pageId（blockId 即可）
            if (cover) {
                const pathname = new URL(cover).pathname;
                const coverUrl = await this.uploadNotionImageToOSS({url: cover, meta, id: blockId, debug, uuid: pathname});
                meta.headerImg = coverUrl;
            }
            return meta;
        } catch (e) {
            logToRenderer('获取页面 meta 信息错误:', e);
        }
    }

    @Req.updateConfigDeco
    async updateNotionLastUpdateTime(props: {blockId: string; debug: boolean}): Promise<boolean> {
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

    @Req.updateConfigDeco
    async send2Github(props: {meta: Meta, content: string, debug: boolean}):Promise<any> {
        const {meta, content, debug} = props;
        // Note: 
        const getContentConfig = {
            ...this.githubCommon,
            path: meta.path,
        };
        const contentBase64 = Buffer.from(content).toString('base64');
        try {
            const res = await this.github.rest.repos.getContent(getContentConfig);
            logToRenderer('获取信息成功:', res);
            
            const createOrUpdateConfig = {
                ...this.githubCommon,
                path: meta.path,
                message: `更新 ${meta.title} !`,
                sha: res.data?.sha,
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
                    path: meta.path,
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
    updateConfig(props: Config) {
        if (props) {
            const {
                notion: {token: notionToken},
                oss: {
                    region: ossRegion,
                    bucket: ossBucket,
                    secretId: ossSecretId,
                    secretKey: ossSecretKey,
                },
                github: {
                    owner: githubOwner,
                    repo: githubRepo,
                    branch: githubBranch,
                    token: githubToken,
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
                this.cdn = new tencentcloud.cdn.v20180606.Client({
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
                });
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
    static updateConfigDeco (_: Req, __: string, desc: PropertyDescriptor) {
        const value = desc.value;
        desc.value = function(...args: any[]) {
            // const config = store.get('config');
            // this.updateConfig(config);
            return value.call(this, ...args);
        };
    }
}
