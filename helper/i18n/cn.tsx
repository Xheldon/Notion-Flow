import React from 'react';
import {Typography} from 'antd';

const {Text, Link} = Typography;


export default {
    Options: {
        Common: {
            More: '参见',
            Export: '导出配置',
            Import: '导入配置',
            ExportAndImport: '导入导出',
            Basic: '基础功能',
            Advance: '高级功能',
            Message: {
                OptionsSaveSucc: '设置保存成功',
                OptionsSaveErr: '部分必填项存在错误，请检查！',
                OptionsExportSucc: '导出配置成功',
                OptionsExportFail: '导出配置失败',
                OptionsImportSucc: '导入配置成功',
                OptionsImportFail: '导入配置失败',
            },
        },
        Basic: {
            Toc: {
                Label: '分级标题样式',
                Text: '文本（H1 H2 H3）',
                Number: '数字（1. 2. 3.）',
                None: '无（仅缩进）'
            },
            ScrollAnimation: '分级标题定位动画',
            Language: '语言',
            ReloadRxplain: '修改此处将会刷新本页面和插件界面',
            MoreFeature: '后续将开放更多可配置选项，如滚动 Notion 时的动画滚动速度、通知类型、主题颜色、Markdown 语法风格等，敬请期待。',
        },
        Notion: {
            Label: 'Notion API Token',
            Message: '请输入 Notion Token',
            Desc: (
                <>
                    <Text type="secondary">Notion Flow 需要使用 Notion API 来获取 Notion 内容。如何获取及更多信息详见<Link href='https://www.xheldon.com' target='_blank'>Notion Token</Link></Text>
                </>
            ),
        },
        Publisher: {
            Common: {
                PublishToGithub: '发布到 Github',
                EnableFrontMatter: {
                    Label: '启用 Front Matter',
                    Desc: (
                        <>
                            <Text type="secondary">如果你的博客系统支持 Front Matter，则需要启用该选项，如 Jekyll、VitePress 等。这会在 Markdown 内容的顶部插入以三个短斜线 `---` 开始和结尾的内容，中间包裹着的就是 Front Matter。</Text>
                            <br />
                            <Text strong type="secondary">注意，如果此处选项关闭，则本页面下方的「添加 lastUpdateTime」设置也将无效。</Text>
                        </>
                    ),
                },
                Desc: (
                <>
                    <Text type="secondary">发布功能可以让你能够将 Notion 内容以 Markdown 格式发布到 Github Pages（需要配置如文件路径、CDN、图片等，可选是否包含 Front Matter）。</Text>
                    <br />
                    <Text type="secondary" strong>注意，这需要您熟悉 Github Person Token、Notion 集成、OSS Token 等相关概念。</Text>
                </>),
                Alert: (
                    <>
                        <Text strong type="danger">重要！使用前必读：</Text>
                        <Text strong><Link href='https://xheldon.notion.site/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4' target='_blank'>发布等高级功能使用说明及答疑</Link></Text>。
                    </>
                ),
            },
            Github: {
                Token: {
                    Label: 'Github Personal Token',
                    Tooltips: '如何获取 Github Token',
                    Message: '请输入 Github Token',
                },
                Repo: {
                    Label: 'Github 仓库',
                    Tooltips: '如何获取 Github Repo 名',
                    Message: '请输入 Blog 所在的仓库名',
                },
                Branch: {
                    Label: 'Github 分支',
                    Tooltips: '如何获取 Github 分支名',
                    Message: '请输入 Blog 仓库分支名',
                },
                User: {
                    Label: 'Github 用户名',
                    Tooltips: '如何获取 Github Username',
                    Message: '如何获取 Github Username 名',
                },
                FilePath: {
                    Label: '上传文件路径',
                    Placeholder: '输入发布到 Github 仓库的文件路径',
                    Extra: (
                        <>
                            <Text type="secondary">在这里设置发布到 Github 仓库的文件路径，支持使用 {"{{}}"} 引用 Notion Page Property 的字段以及 YYYY、YY、MM、DD 等变量，详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何设置上传文件路径？</Link></Text>
                        </>
                    ),
                    Tooltips: '如何设置上传文件路径',
                    Message: '请输入上传文件路径',
                },
                AddLastUpdateTime: {
                    Label: '添加「lastUpdateTime」',
                    Extra: (
                        <>
                            <Text type="secondary"><Text strong>（需要启用 Front Matter）</Text>从 Notion Flow 发布博客的时候，自动添加一个固定的 lastUpdateTime 的字段到在 Front Matter 中，你可以在博客中使用该字段，以告诉读者最后更新日期，详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用 lastUpdateTime？</Link></Text>
                        </>
                    ),
                },
                UpdateNotionLastUpdateTime: {
                    Label: '更新「lastUpdateTime」',
                    Extra: (
                        <>
                            <Text type="secondary">从 Notion Flow 发布博客成功后，更新 Notion Page 的 lastUpdateTime Property，以方便你在 Notion 中查看该文章何时最后发布。需要提前添加好该字段。详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何在 Notion 中查看页面最后更新时间？</Link></Text>
                        </>
                    ),
                },
                FrontMatter: {
                    Label: '其他 Front Matter 字段',
                    Extra: (
                        <>
                            <Text type="secondary"><Text strong>（需要启用 Front Matter）</Text>一般情况你应该在 Pages 的 Property 中写与页面有关的 Front Matter，在这里写固定的 Front Matter，如我的使用 case 是给每个通过 Notion Flow 发布的博客文章设置一个 layout: post 属性。详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何设置固定的 Front Matter？</Link></Text>
                        </>
                    ),
                    Placeholder: '输入将要在博客中使用的其他固定 Front Matter 字段，英文半角逗号分隔'
                },
                HeaderImgName: {
                    Label: '头图字段名',
                    Extra: (
                        <>
                            <Text type="secondary"><Text strong>（需要启用 Front Matter）</Text>Notion Page 的头图，可以作为博客的头图，需要在此设置将 Noiton 头图设置为 Front Matter 的哪个字段，然后在博客中使用该字段（图片会上传到 OSS）。<Text italic type="secondary">（不填表示不使用）</Text>详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用头图字段？</Link></Text>
                        </>
                    ),
                    Placeholder: '留空表示不使用'
                },
                Transform: {
                    Label: '模块转换 :',
                    Desc: (
                        <>
                            <Text strong type="warning">目前仅支持 Jekyll 博客系统，后续会看用户反馈支持更多博客系统，敬请期待！</Text>
                            <Text type="secondary">Notion 中含有非标准 Markdown 格式，如 Bookmark、Video。但是通过一定配置和少量代码书写，你也可以在自己博客上支持你想要的模块，需要一定样式设置。详见：<Link href='https://www.notion.so/xheldon/Notion-Flow-WiKi-5904baba92464f55ba03d8a8a68eae0b?pvs=4#82254baee3524131b6b36a777e72fc0a' target='_blank'>如何使用内置处理插件？</Link></Text>  
                        </>
                    ),
                    Image: '图片',
                    Bookmark: 'Bookmark',
                    Callout: 'Callout',
                    Quoteblock: 'Quoteblock',
                }
            },
            Oss: {
                Label: 'OSS 服务提供商',
                Extra: (
                    <>
                        <Text type="secondary">Notion 图片地址有效期较短，因此获取 Notion 中的图片后需要及时转存到自己的 OSS 服务提供商中，必须配合 CDN 使用，否则裸连 OSS 费用高昂。视频教程见<Link href="www.xheldon.com">详细设置新手教程</Link>。</Text>
                        <br />
                        <Text strong type="secondary">更多 OSS 服务提供商开发中...</Text>
                    </>
                ),
                TX: {
                    Label: '腾讯云',
                    SecretId: {
                        Label: 'SecretId',
                        Message: '请输入腾讯云 SecretId'
                    },
                    SecretKey: {
                        Label: 'SecretKey',
                        Message: '请输入腾讯云 SecretKey'
                    },
                    Bucket: {
                        Label: 'Bucket',
                        Message: '请输入腾讯云 Bucket'
                    },
                    Region: {
                        Label: 'Region',
                        Message: '请输入腾讯云 Region'
                    },
                },
                ALI: {
                    Label: '阿里云',
                    SecretId: {
                        Label: 'AccessKey Id',
                        Tooltips: '如何获取阿里云 AccessKey Id',
                        Message: '请输入阿里云 AccessKey Id'
                    },
                    SecretKey: {
                        Label: 'AccessKey Secret',
                        Message: '请输入阿里云 AccessKey Secret'
                    },
                    Bucket: {
                        Label: 'Bucket',
                        Message: '请输入阿里云 Bucket'
                    },
                    Region: {
                        Label: 'Region',
                        Message: '请输入阿里云 Region'
                    },
                },
                AWS: {
                    Label: 'AWS',
                    SecretId: {
                        Label: 'Access key',
                        Message: '请输入 AWS Access key'
                    },
                    SecretKey: {
                        Label: 'Secret Access Key',
                        Message: '请输入 AWS Secret Access Key'
                    },
                    Bucket: {
                        Label: 'Bucket',
                        Message: '请输入 AWS Bucket'
                    },
                    Region: {
                        Label: 'Region',
                        Message: '请输入 AWS Region'
                    },
                },
                CDN: {
                    Label: 'CDN 地址',
                    Message: '请输入 CDN 地址'
                },
                MediaPath: {
                    Label: '图片路径',
                    Message: '请输入 CDN 地址'
                },
            },
        },
        AIGC: {
            Label: 'AI（敬请期待）',
            Extra: (
                <>
                    <Text type="secondary">AIGC 功能可以让你通过 OpenAI API 的形式来使用 AIGC 功能，虽然不如 Notion AI 方便（如需要选中内容，然后生成内容后再粘贴；或者选中块后再点击插入），但是其自由度更高，成本更低。</Text>
                    <br />
                    <Text strong type="secondary">您可以自由的选择是否启用 AIGC 功能，注意，这需要您提供 OpenAI API。</Text>
                </>
            ),
        },
        Plugin: {
            Label: '插件（敬请期待）',
            Extra: (
                <>
                    <Text type="secondary">插件功能可以让你通过编写代码的方式，参与到 Notion 博客内容构建中去，如自定义 Notion Block 处理函数以生成特定格式内容，然后再自定义博客插件（如 Jekyll 的 ruby 插件）来处理该特定内容以生成特定 HTML，典型的用法就是处理在 Notion 的非标准 Markdown 语法的 Bookmark 元素。</Text>
                    <br />
                    <Text type="secondary">插件的另一个典型用法是可以让你在发布成功之后，修改 Notoin 页面内容，如更新 lastUpdateTime 字段等。</Text>
                    <br />
                    <Text strong type="secondary">您可以自由的选择是否启用 插件爱你 功能，注意，这需要您熟悉 JavaScript 和 Ruby 以及 Notion API，同时理解本插件的构建原理。</Text>
                </>
            ),
        },
        About: {
            Label: '关于',
        }
    },
    Log: {
        
    },
}