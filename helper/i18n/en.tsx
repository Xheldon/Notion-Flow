import React from 'react';
import {Typography} from 'antd';

const {Text} = Typography;

export default {
    Options: {
        Common: {
            More: 'See',
            Export: 'Export Setting',
            Import: 'Import Setting',
            ExportAndImport: 'Import & Export',
            Basic: 'Basic',
            Advance: 'Advance',
            Message: {
                OptionsSaveSucc: 'Setting saved successfully',
                OptionsExportSucc: 'Export setting successfully',
                OptionsExportFail: 'Export setting failed',
                OptionsImportSucc: 'Import setting successfully',
                OptionsImportFail: 'Import setting failed',
            },
        },
        Basic: {
            Toc: {
                Label: 'Heading Style',
                Text: 'Text（H1 H2 H3）',
                Number: 'Number（1. 2. 3.）',
                None: 'None（Only Intent）'
            },
            ScrollAnimation: 'Locate Heading Animation',
            MoreFeature: 'More configurable options will be made available later on, such as whether to use animations when scrolling in Notion, scroll speed, types of notifications, theme colors, Markdown syntax styles, etc. Please stay tuned.',
        },
        Publisher: {
            Common : {
                PublishToGithub: 'Publish to Github',
                Desc: (
                <>
                    <Text>The Publisher function allows you to publish content from Notion to GitHub Pages<Text strong mark type="danger">(Currently only supports Jekyll blogging system.).</Text></Text>
                    <br />
                    <Text>In the future, it will also support writing Ruby plugins directly in the plugin that are supported by the Jekyll blog system for Github Pages. This will allow the correct display of Notion's non-standard Markdown modules in the blog, with the Bookmark module being a typical example.</Text>
                    <br />
                    <Text strong>You are free to choose whether to enable the publishing function, but please be aware that this requires you to be familiar with concepts such as Github Personal Token, Notion integration, OSS Token, etc.</Text>
                </>),
            },
            Notion: {
                Label: 'Notion Token',
                Tooltips: 'How to get notion token',
                Message: 'Notion token is required',
            },
            Github: {
                Token: {
                    Label: 'Github Personal Token',
                    Tooltips: 'How to get github personal token',
                    Message: 'Github personal token is required',
                },
                Repo: {
                    Label: 'Github repo',
                    Tooltips: 'How to get github repo name',
                    Message: 'Repo name is required',
                },
                Branch: {
                    Label: 'Github branch',
                    Tooltips: 'How to get github branch name',
                    Message: 'Branch name is required',
                },
                User: {
                    Label: 'Github owner',
                    Tooltips: 'How to get github username',
                    Message: 'Owner is required',
                }
            },
            Oss: {
                TX: {
                    Label: 'Tencent Cloud',
                    SecretId: {
                        Label: 'SecretId',
                        Tooltips: 'How to get tecent cloud secretId',
                        Message: 'SecretId is required'
                    },
                    SecretKey: {
                        Label: 'SecretKey',
                        Tooltips: 'How to get tecent cloud SecretKey',
                        Message: 'SecretKey is required'
                    },
                    Bucket: {
                        Label: 'Bucket',
                        Tooltips: 'How to get tecent cloud bucket',
                        Message: 'Bucket is required'
                    },
                    Region: {
                        Label: 'Region',
                        Tooltips: 'How to get tecent cloud region',
                        Message: 'Region is required'
                    },
                    CDN: {
                        Label: 'CDN address',
                        Tooltips: 'How to set tecent cloud CDN address',
                        Message: 'Cdn address is required'
                    },
                    MediaPath: {
                        Label: 'Media path',
                        Tooltips: 'How to set tecent cloud media path',
                        Message: 'Media path is required'
                    },
                },
            },
        }
    }
}