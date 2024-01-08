import React, { useEffect, useRef, useState } from "react"
import { ReloadOutlined, VerticalAlignTopOutlined, BarsOutlined, AppstoreOutlined } from "@ant-design/icons"
import StickyBox from 'react-sticky-box';
import type { PlasmoCSConfig } from 'plasmo';
import { Provider } from 'react-redux';
import { Storage, } from "@plasmohq/storage"
import { Button, Collapse, Layout, Tabs, theme, Tooltip, Segmented, ConfigProvider } from "antd"

import type { State, PublisherOptions } from '$types';
import { getPublisherConfig, getAigcConfig } from '$utils';
import store, { setToc, setLogs } from '$store';
import Toc from "$components/toc"
import Publisher from '$components/publisher';
import Aigc from '$components/aigc';
import Req from '$api';

import "./styles.css"
 
const storage = new Storage();

// export const config: PlasmoCSConfig = {
//     matches: ['https://www.notion.so/*'],
//     all_frames: true,
// };

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
        getAigcConfig(storage);
        store.dispatch(setLogs([]));
    }
}

new IO();

const tabList = [
    {
        key: "basic",
        content: (props) => {
            return {
                key: 'basic',
                label: "基本",
                children: (
                    <Collapse size="small" activeKey={["basic"]}>
                        <Toc {...props} />
                    </Collapse>
                )
            };
        },
    },
    {
        key: 'publisher',
        content: (props) => {
            return {
                key: 'publisher',
                label: '发布',
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
        content: (props) => {
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
                label: "插件",
                children: <div>插件列表</div>
            };
        }
    }
];

function App() {
    const {
        token: { colorBgContainer }
    } = theme.useToken();

    const [tabs, setTabs] = useState([]);
    const [tocstyle, setTocStyle] = useState("text");
    const req = useRef(null);

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
                    notion: options.publisher.notion,
                    oss: options.oss[options.oss.name],
                };
                req.current = new Req(_publisherOptions);
            }
            setTabs(Object.keys(enabledTabs).filter((key) => enabledTabs[key]));
            setTocStyle(options?.['heading-style'] || 'text');
        })();
        const cb = (port) => {
            port.onMessage.addListener(function (msg) {
                console.log('sidePanel 收到消息:', msg);
                const {name, data} = msg;
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
                const {newValue: {'heading-style': headingStyle, publisher, oss, aigc, plugin}} = opt;
                const enabledTabs = {
                    basic: true,
                    publisher: !!publisher?.enable,
                    aigc: !!aigc?.enable,
                    plugin: !!plugin?.enable,
                };
                if (publisher.enable) {
                    const _publisherOptions = {
                        github: publisher?.github,
                        notion: publisher?.notion,
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
            hashed: false,
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
                        tabBarExtraContent={{
                            right: (
                                <>
                                    <Tooltip title={"Notion 返回顶部"}>
                                        <Button type={"link"} size={"small"}>
                                            <VerticalAlignTopOutlined />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title={"Notion 刷新页面"}>
                                        <Button
                                            type={"link"}
                                            size={"small"}
                                        >
                                            <ReloadOutlined onClick={() => {
                                                chrome.sidePanel.getOptions({}, (options) => {
                                                    console.log('getOptions:', options);
                                                });
                                                chrome.sidePanel.getPanelBehavior((options) => {
                                                    console.log('getOptions:', options);
                                                })
                                            }} />
                                        </Button>
                                    </Tooltip>
                                </>
                            )
                        }}
                        renderTabBar={(props, DefaultBar) => {
                            return (
                                <StickyBox offsetTop={0} style={{zIndex: 1}}>
                                    <DefaultBar
                                        {...props}
                                        style={{
                                            backgroundColor: colorBgContainer,
                                            paddingTop: 10
                                        }}
                                    />
                                </StickyBox>
                            );
                        }}
                        items={tabList.map(tab => {
                            if (tabs.includes(tab.key)) {
                                return tab.content({tocstyle, req});
                            }
                        }).filter(Boolean)}
                    />
                </Layout>
            </Provider>
          </ConfigProvider>
    );
}

export default App
