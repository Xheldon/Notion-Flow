import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PublisherState, TocState, TocItem, PublisherConfig, AigcState, AigcData } from '$types';

// TODO: 在 Pannel 中展开的部分也持久化一下
export const publisherConfigSlice = createSlice({
    name: 'publisher',
    initialState: {},
    reducers: {
        setPublisher: (state: PublisherState, action: {payload: PublisherConfig, type: string}) => {
            const {payload} = action;
            state.data = Object.assign({}, state.data, payload);
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

export const logsSlice = createSlice({
    name: 'logs',
    initialState: {},
    reducers: {
        setLogs: (state: any, action: {payload: string | []}) => {
            const {payload} = action;
            if (Array.isArray(payload)) {
                state.data = payload;
            } else {
                state.data.push(payload);
            }
        }
    }
});

export const {setPublisher} = publisherConfigSlice.actions;
export const {setToc} = tocSlice.actions;
export const {setAigc} = aigcSlice.actions;
export const {setLogs} = logsSlice.actions;

const store = configureStore({
    reducer: {
        publisher: publisherConfigSlice.reducer,
        toc: tocSlice.reducer,
        aigc: aigcSlice.reducer,
        logs: logsSlice.reducer
    }
});

export default store;
