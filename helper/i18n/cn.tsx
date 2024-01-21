import React from 'react';
import {Typography} from 'antd';

const {Text} = Typography;


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
            MoreFeature: '后续将开放更多可配置选项，如是否滚动 Notion 时候使用动画、滚动速度、通知类型、主题颜色、Markdown 语法风格等，敬请期待。',
        },
        Publisher: {
            Common: {
                PublishToGithub: '发布到 Github',
                Desc: (
                <>
                    <Text>发布功能可以让你能够将 Notion 内容发布到 Github Pages<Text strong mark type="danger">（目前仅支持 Jekyll 博客系统）。</Text></Text>
                    <br />
                    <Text>在将来，还支持直接在插件中写 Github Pages 的 Jekyll 博客系统所支持的 Ruby 插件，以在博客中正确展示 Notion 的非 Markdown 标准模块，典型的有 Bookmark 模块。</Text>
                    <br />
                    <Text strong>您可以自由的选择是否启用发布功能，注意，这需要您熟悉 Github Person Token、Notion 集成、OSS Token 等相关概念。</Text>
                </>),
            },
            Notion: {
                Label: 'Notion Token',
                Tooltips: '如何获取 Notion Token',
                Message: '请输入 Notion Token',
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
                    Tooltips: '如何获取 Github Branch 名',
                    Message: '请输入 Blog 分支名',
                },
                User: {
                    Label: 'Github 用户名',
                    Tooltips: '如何获取 Github User',
                    Message: '如何获取 Github Owner 名',
                }
            },
            Oss: {
                TX: {
                    Label: '腾讯云',
                    SecretId: {
                        Label: 'SecretId',
                        Tooltips: '如何获取腾讯云 SecretId',
                        Message: '请输入腾讯云 SecretId'
                    },
                    SecretKey: {
                        Label: 'SecretKey',
                        Tooltips: '如何获取腾讯云 SecretKey',
                        Message: '请输入腾讯云 SecretKey'
                    },
                    Bucket: {
                        Label: 'Bucket',
                        Tooltips: '如何获取腾讯云 Bucket',
                        Message: '请输入腾讯云 Bucket'
                    },
                    Region: {
                        Label: 'Region',
                        Tooltips: '如何获取腾讯云 Region',
                        Message: '请输入腾讯云 Region'
                    },
                    CDN: {
                        Label: 'CDN 地址',
                        Tooltips: '如何设置 CDN 地址',
                        Message: '请输入 CDN 地址'
                    },
                    MediaPath: {
                        Label: '图片路径',
                        Tooltips: '如何设置 CDN 地址',
                        Message: '请输入 CDN 地址'
                    },
                },
            },
        }
    }
}