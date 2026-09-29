import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CurrentProject {
  id: string;
  title: string;
}

export interface CurrentProjectMember {
  role: number | string;
  roleText: string;
  isLeader: boolean;
}

interface ProjectState {
  currentProject: CurrentProject | null;
  currentProjectMember: CurrentProjectMember | null;
  paperPoolSteps: Record<string, number>;
}

const initialState: ProjectState = {
  currentProject: null,
  currentProjectMember: null,
  paperPoolSteps: {},
};

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    setCurrentProject: (state, action: PayloadAction<CurrentProject>) => {
      state.currentProject = action.payload;
    },
    setProjectMember: (state, action: PayloadAction<CurrentProjectMember>) => {
      state.currentProjectMember = action.payload;
    },
    setPaperPoolStep: (state, action: PayloadAction<{ projectId: string; step: number }>) => {
      if (!state.paperPoolSteps) {
        state.paperPoolSteps = {};
      }
      state.paperPoolSteps[action.payload.projectId] = action.payload.step;
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
      state.currentProjectMember = null;
    },
    clearProjectMember: (state) => {
      state.currentProjectMember = null;
    },
  },
});

export const {
  setCurrentProject,
  setProjectMember,
  setPaperPoolStep,
  clearCurrentProject,
  clearProjectMember,
} = projectSlice.actions;

export default projectSlice.reducer;
