import { ReloadOutlined, VerticalAlignTopOutlined } from "@ant-design/icons"
import StickyBox from 'react-sticky-box';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import type { State } from '$types';
import { getPublisherConfig, getAigcConfig, logToRenderer } from '$utils';
import { Storage } from "@plasmohq/storage"

import store, { setToc } from '$store';
import Toc from "$components/toc"
import { Button, Collapse, Layout, Tabs, theme, Tooltip } from "antd"
import React, { useCallback, useEffect } from "react"


import Publisher from '$components/publisher';
import Aigc from '$components/aigc';

import "./styles.css"
 
const storage = new Storage()
 
/* await storage.set("key", "value")
const data = await storage.get("key") // "value"
 
await storage.set("capt", { color: "red" })
const data2 = await storage.get("capt") // { color: "red" }
 */
class IO {
    constructor() {
        let prevConfigStateJson = '';
        let prevAigcStateJson = '';
        store.subscribe(async () => {
            const currState = store.getState() as State;
            // Note: Pulisher 配置持久化
            const currConfigStateJson = JSON.stringify(currState.publisher);
            if (prevConfigStateJson !== currConfigStateJson) {
                logToRenderer('tree State:', prevConfigStateJson, currConfigStateJson);
                // window._toMain('config-set', currState.config.data);
                // Note: 持久化
                // FIXME: 后面需要改成 Secure Storage，下同
                await storage.set("publisher-config", currState.publisher.data)
                prevConfigStateJson = currConfigStateJson;
            }
            // Note: aigc 配置持久化
            const currAigcStateJson = JSON.stringify(currState.aigc);
            if (prevAigcStateJson !== currAigcStateJson) {
                logToRenderer('aigc State:', prevAigcStateJson, currAigcStateJson);
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
    }
}

new IO();

function App() {
    const {
        token: { colorBgContainer }
    } = theme.useToken();

    useEffect(() => {
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


   /*  useEffect(() => {
        document.body.addEventListener('click', () => {
            chrome.tabs.query({active: true, lastFocusedWindow: true}, ([tab]) => {
                const port = chrome.tabs.connect(tab.id, {name: 'toc'});
                port.postMessage({type: 'toc', content: 'sidePanel 要你定位！'});
                port.onMessage.addListener(function(msg) {
                    console.log('牛逼，我服了');
                });
            })
        });
    }, []); */

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
                                    <Button type={"link"} size={"small"} /* onClick={backToTop} */>
                                        <VerticalAlignTopOutlined />
                                    </Button>
                                </Tooltip>
                                <Tooltip title={"Notion 刷新页面"}>
                                    <Button
                                        type={"link"}
                                        size={"small"} /* onClick={refreshNotionPage} */
                                    >
                                        <ReloadOutlined />
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
                    items={[
                        {
                            key: "basic",
                            label: "基本",
                            children: (
                                <Collapse size="small" activeKey={["basic"]}>
                                    <Toc />
                                </Collapse>
                            )
                        },
                        {
                            key: 'publisher',
                            label: '发布',
                            children: (
                                <Collapse size="small">
                                    <Publisher />
                                </Collapse>
                            ),
                        },
                        {
                            key: 'ai',
                            label: 'AIGC',
                            children: (
                                <Collapse size="small">
                                    <Aigc />
                                </Collapse>
                            ),
                        },
                        {
                            key: "plugin",
                            label: "插件",
                            children: <div>插件列表</div>
                        }
                    ]}
                />
            </Layout>
            </Provider>
          </ConfigProvider>
    );
}

export default App
