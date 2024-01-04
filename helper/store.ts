import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { ConfigState, TocState, TocItem, Config, AigcState, Aigc, AigcPrompt, AigcModel } from '$types';

import { logToRenderer } from '$utils';

// TODO: 在 Pannel 中展开的部分也持久化一下
export const configSlice = createSlice({
    name: 'config',
    initialState: {},
    reducers: {
        setConfig: (state: ConfigState, action: {payload: Config, type: string}) => {
            logToRenderer('initConfig action:', action);
            const {payload} = action;
            state.data = payload;
        },
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
        setAigc: (state: AigcState, action: {payload: Aigc}) => {
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

export const {setConfig} = configSlice.actions;
export const {setToc} = tocSlice.actions;
export const {setAigc} = aigcSlice.actions;

const store = configureStore({
    reducer: {
        config: configSlice.reducer,
        toc: tocSlice.reducer,
        aigc: aigcSlice.reducer
    }
});

export default store;
