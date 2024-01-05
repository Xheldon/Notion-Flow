import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PublisherConfigState, TocState, TocItem, PublisherConfig, AigcState, AigcData, AigcPrompt, AigcModel } from '$types';

import { logToRenderer } from '$utils';

// TODO: 在 Pannel 中展开的部分也持久化一下
export const publisherConfigSlice = createSlice({
    name: 'publisher',
    initialState: {},
    reducers: {
        setPublisher: (state: PublisherConfigState, action: {payload: PublisherConfig, type: string}) => {
            logToRenderer('initConfig action:', action);
            const {payload} = action;
            state.data = payload;
        },
        setPublisherStatus: (state: PublisherConfigState, action: {payload: string, type: string}) => {
            logToRenderer('plulisher action:', action);
            const {payload} = action;
            state.data.status = payload;
        }
    }
});

export const tocSlice = createSlice({
    name: 'toc',
    initialState: {},
    reducers: {
        setToc: (state: TocState, action: {payload: TocItem[]; type: string}) => {
            const {payload} = action;
            state.data = payload;
        },
    }
});

export const aigcSlice = createSlice({
    name: 'agic',
    initialState: {},
    reducers: {
        setAigc: (state: AigcState, action: {payload: AigcData}) => {
            logToRenderer('init aigc action:', action);
            const {payload} = action;
            state.data = payload;
        },
        /* addPrompt: (state: AigcState, action: {payload: AigcPrompt}) => {
            const {payload} = action;
            const prompts = state.data.prompts.slice();
            prompts.push(payload);
            state.data.prompts = prompts;
        },
        deletePrompt: (state: AigcState, action: {payload: AigcPrompt}) => {
            const {payload} = action;
            const index = state.data.prompts.findIndex(v => v === payload);
            const prompts = state.data.prompts.slice();
            if (index > -1) {
                prompts.splice(index, 1);
            }
            state.data.prompts = prompts;
        }, */
    }
});

export const {setPublisher, setPublisherStatus} = publisherConfigSlice.actions;
export const {setToc} = tocSlice.actions;
export const {setAigc} = aigcSlice.actions;

const store = configureStore({
    reducer: {
        publisher: publisherConfigSlice.reducer,
        toc: tocSlice.reducer,
        aigc: aigcSlice.reducer
    }
});

export default store;
