import React, { useEffect, useRef, useState } from "react"
import { ReloadOutlined, VerticalAlignTopOutlined, ArrowUpOutlined } from "@ant-design/icons"
import StickyBox from 'react-sticky-box';
import { Provider } from 'react-redux';
import { Storage, } from "@plasmohq/storage"
import { Button, Collapse, Layout, Tabs, theme, Tooltip, ConfigProvider } from "antd"

import type { State, PublisherOptions } from '$types';
import { getPublisherConfig, _toContent } from '$utils';
import store, { setToc, setLogs } from '$store';
import Toc from "$components/toc"
import Publisher from '$components/publisher';
import Aigc from '$components/aigc';
import Req from '$api';

import "./styles.css"

const storage = new Storage();

let enabledTabs: any = {};

class IO {
    constructor() {
        let prevConfigStateJson = '';
        let prevAigcStateJson = '';
        store.subscribe(async () => {
            const currState = store.getState() as State;
            // Note: Pulisher 配置持久化
            const currConfigStateJson = JSON.stringify(currState.publisher);
            if (prevConfigStateJson !== currConfigStateJson) {
                // logToRenderer('tree State:', prevConfigStateJson, currConfigStateJson);
                // window._toMain('config-set', currState.config.data);
                // Note: 持久化
                // FIXME: 后面需要改成 Secure Storage，下同
                await storage.set("publisher-config", currState.publisher.data)
                prevConfigStateJson = currConfigStateJson;
            }
            // Note: aigc 配置持久化
            const currAigcStateJson = JSON.stringify(currState.aigc);
            if (prevAigcStateJson !== currAigcStateJson) {
                // logToRenderer('aigc State:', prevAigcStateJson, currAigcStateJson);
                // window._toMain('aigc-set', currState.aigc.data);
                // Note: 持久化
                await storage.set("aigc-config", currState.aigc.data)
                prevAigcStateJson = currAigcStateJson;
            }
            // TODO: 面板展开、收起状态持久化
        });
        // Note: 初始化
        getPublisherConfig(storage);
        // getAigcConfig(storage);
        store.dispatch(setLogs([]));
    }
}

new IO();

const tabList = [
    {
        key: "basic",
        content: (props, opt) => {
            return {
                key: 'basic',
                label: opt.cn ? "基本" : 'Basic',
                icon: <span>📚</span>,
                children: (
                    <Collapse size="small" activeKey={["basic"]}>
                        <Toc {...props} cn={opt.cn} />
                    </Collapse>
                )
            };
        },
    },
    {
        key: 'publisher',
        content: (props, opt) => {
            return {
                key: 'publisher',
                label: opt.cn ? '发布' : 'Publisher',
                icon: <span>🧑🏻‍💻</span>,
                children: (
                    <Collapse size="small">
                        <Publisher {...props} />
                    </Collapse>
                ),
            };
        }
    },
    {
        key: 'aigc',
        content: (props, opt) => {
            return {
                key: 'aigc',
                label: 'AIGC',
                children: (
                    <Collapse size="small">
                        <Aigc {...props} />
                    </Collapse>
                ),
            };
        }
    },
    {
        key: "plugin",
        content: (props) => {
            return {
                key: "plugin",
                label: props.cn ? "插件" : 'Plugin',
                children: <div>插件列表</div>
            };
        }
    }
];

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
}
if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
}
// Note: 自动切换
window.matchMedia('(prefers-color-scheme: dark)').addListener(function (mediaQueryList) {
    if (mediaQueryList.matches) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
    }
})
window.matchMedia('(prefers-color-scheme: light)').addListener(function (mediaQueryList) {
    if (mediaQueryList.matches) {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
    }
});

function App() {
    const [tabs, setTabs] = useState([]);
    const [tocstyle, setTocStyle] = useState("text");
    const req = useRef(null);
    const cn = navigator.language === 'zh-CN';

    useEffect(() => {
        (async () => {
            const options: PublisherOptions = await storage.get('options');
            enabledTabs = {
                basic: true,
                publisher: !!options?.publisher?.enable,
                aigc: !!options?.aigc?.enable,
                plugin: false,
            };
            if (options) {
                const _publisherOptions = {
                    github: options.publisher.github,
                    notion: options.notion,
                    oss: options.oss[options.oss.name],
                };
                req.current = new Req(_publisherOptions);
            }
            setTabs(Object.keys(enabledTabs).filter((key) => enabledTabs[key]));
            setTocStyle(options?.['heading-style'] || 'text');
        })();
        const cb = (port) => {
            port.onMessage.addListener(function (msg) {
                // console.log('sidePanel 收到消息:', msg);
                const { name, data } = msg;
                // port.postMessage({ type: 'toc', content: 'sidePanel 知道了'});
                switch (name) {
                    case 'toc-update': {
                        store.dispatch(setToc(data));
                        break;
                    }
                }
            });
        };
        // Note: 接受来自 content 的通知
        chrome.runtime.onConnect.addListener(cb);
        return () => {
            chrome.runtime.onConnect.removeListener(cb);
        }
    }, []);

    useEffect(() => {
        storage.watch({
            options: (opt) => {
                console.log('options:', opt);
                const {
                    newValue: { language, 'heading-style': headingStyle, publisher, oss, aigc, plugin, notion},
                    oldValue: { language: preLanguage},
                } = opt;
                if (language !== preLanguage) {
                    window.location.reload();
                }
                const enabledTabs = {
                    basic: true,
                    publisher: !!publisher?.enable,
                    aigc: !!aigc?.enable,
                    plugin: !!plugin?.enable,
                };
                if (publisher.enable) {
                    const _publisherOptions = {
                        github: publisher?.github,
                        notion: notion,
                        oss: oss?.[oss?.name],
                    };
                    req.current = new Req(_publisherOptions);
                }
                setTabs(Object.keys(enabledTabs).filter((key) => enabledTabs[key]));
                setTocStyle(headingStyle);
            }
        });
    }, []);

    // const backToTop = useCallback(() => {
    //     window._toMain('notion-page-backtop');
    // }, []);

    // const refreshNotionPage = useCallback(() => {
    //     window._toMain('notion-page-reload');
    // }, []);
    return (
        <ConfigProvider theme={{
            token: {
                colorPrimary: '#0a85d1',
            }
        }}>
            <Provider store={store}>
                <Layout style={{ padding: 10 }}>
                    <Tabs
                        size={"small"}
                        type={"card"}
                        defaultActiveKey={"basic"}
                        animated={true}
                        tabBarExtraContent={{
                            right: (
                                <>
                                    <Tooltip title={cn ? "Notion 返回顶部" : 'Notion Back To Top'}>
                                        <Button type={"link"} size={"small"}>
                                            <VerticalAlignTopOutlined onClick={() => {
                                                _toContent('notion-page-backtop');
                                            }} />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title={"插件返回顶部"}>
                                        <Button type={"link"} size={"small"}>
                                            <ArrowUpOutlined onClick={() => {
                                                window.document.scrollingElement.scrollTop = 0;
                                            }} />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title={cn ? "Notion 刷新页面" : 'Notion Reload'}>
                                        <Button
                                            type={"link"}
                                            size={"small"}
                                        >
                                            <ReloadOutlined onClick={() => {
                                                _toContent('notion-page-reload');
                                            }} />
                                        </Button>
                                    </Tooltip>
                                </>
                            )
                        }}
                        renderTabBar={(props, DefaultBar) => {
                            return (
                                <StickyBox offsetTop={0}  style={{ zIndex: 999, background: 'rgb(251, 251, 250)' }}>
                                    <DefaultBar
                                        {...props}
                                    />
                                </StickyBox>
                            );
                        }}
                        items={tabList.map(tab => {
                            if (tabs.includes(tab.key)) {
                                return tab.content({ tocstyle, req}, {cn});
                            }
                        }).filter(Boolean)}
                    />
                </Layout>
            </Provider>
        </ConfigProvider>
    );
}

export default App
