"use client";

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from "react";
import type {
  ResumeData,
  PersonalInfo,
  ExperienceItem,
  ProjectItem,
  EducationItem,
  SkillCategory,
} from "@/lib/resume-types";
import {
  DEFAULT_RESUME_DATA,
  EMPTY_EXPERIENCE,
  EMPTY_PROJECT,
  EMPTY_EDUCATION,
  EMPTY_SKILL_CATEGORY,
} from "@/lib/resume-types";

// ---- Actions ----

type ResumeAction =
  | { type: "SET_PERSONAL_INFO"; payload: Partial<PersonalInfo> }
  | { type: "SET_EXPERIENCE_ITEM"; id: string; payload: Partial<ExperienceItem> }
  | { type: "ADD_EXPERIENCE_ITEM" }
  | { type: "REMOVE_EXPERIENCE_ITEM"; id: string }
  | { type: "SET_PROJECT_ITEM"; id: string; payload: Partial<ProjectItem> }
  | { type: "ADD_PROJECT_ITEM" }
  | { type: "REMOVE_PROJECT_ITEM"; id: string }
  | { type: "SET_EDUCATION_ITEM"; id: string; payload: Partial<EducationItem> }
  | { type: "ADD_EDUCATION_ITEM" }
  | { type: "REMOVE_EDUCATION_ITEM"; id: string }
  | { type: "SET_SKILL_CATEGORY"; id: string; payload: Partial<SkillCategory> }
  | { type: "ADD_SKILL_CATEGORY" }
  | { type: "REMOVE_SKILL_CATEGORY"; id: string }
  | { type: "LOAD_RESUME"; payload: ResumeData }
  | { type: "RESET_RESUME" };

// ---- Reducer ----

function resumeReducer(state: ResumeData, action: ResumeAction): ResumeData {
  switch (action.type) {
    case "SET_PERSONAL_INFO":
      return {
        ...state,
        personalInfo: { ...state.personalInfo, ...action.payload },
      };

    case "SET_EXPERIENCE_ITEM":
      return {
        ...state,
        experience: state.experience.map((exp) =>
          exp.id === action.id ? { ...exp, ...action.payload } : exp
        ),
      };

    case "ADD_EXPERIENCE_ITEM":
      return {
        ...state,
        experience: [
          ...state.experience,
          { ...EMPTY_EXPERIENCE, id: crypto.randomUUID() },
        ],
      };

    case "REMOVE_EXPERIENCE_ITEM":
      return {
        ...state,
        experience: state.experience.filter((exp) => exp.id !== action.id),
      };

    case "SET_PROJECT_ITEM":
      return {
        ...state,
        projects: state.projects.map((proj) =>
          proj.id === action.id ? { ...proj, ...action.payload } : proj
        ),
      };

    case "ADD_PROJECT_ITEM":
      return {
        ...state,
        projects: [
          ...state.projects,
          { ...EMPTY_PROJECT, id: crypto.randomUUID() },
        ],
      };

    case "REMOVE_PROJECT_ITEM":
      return {
        ...state,
        projects: state.projects.filter((proj) => proj.id !== action.id),
      };

    case "SET_EDUCATION_ITEM":
      return {
        ...state,
        education: state.education.map((edu) =>
          edu.id === action.id ? { ...edu, ...action.payload } : edu
        ),
      };

    case "ADD_EDUCATION_ITEM":
      return {
        ...state,
        education: [
          ...state.education,
          { ...EMPTY_EDUCATION, id: crypto.randomUUID() },
        ],
      };

    case "REMOVE_EDUCATION_ITEM":
      return {
        ...state,
        education: state.education.filter((edu) => edu.id !== action.id),
      };

    case "SET_SKILL_CATEGORY":
      return {
        ...state,
        skills: state.skills.map((sk) =>
          sk.id === action.id ? { ...sk, ...action.payload } : sk
        ),
      };

    case "ADD_SKILL_CATEGORY":
      return {
        ...state,
        skills: [
          ...state.skills,
          { ...EMPTY_SKILL_CATEGORY, id: crypto.randomUUID() },
        ],
      };

    case "REMOVE_SKILL_CATEGORY":
      return {
        ...state,
        skills: state.skills.filter((sk) => sk.id !== action.id),
      };

    case "LOAD_RESUME":
      return action.payload;

    case "RESET_RESUME":
      return DEFAULT_RESUME_DATA;

    default:
      return state;
  }
}

// ---- Context ----

interface ResumeContextValue {
  data: ResumeData;
  dispatch: React.Dispatch<ResumeAction>;
  updatePersonalInfo: (payload: Partial<PersonalInfo>) => void;
  updateExperience: (id: string, payload: Partial<ExperienceItem>) => void;
  addExperience: () => void;
  removeExperience: (id: string) => void;
  updateProject: (id: string, payload: Partial<ProjectItem>) => void;
  addProject: () => void;
  removeProject: (id: string) => void;
  updateEducation: (id: string, payload: Partial<EducationItem>) => void;
  addEducation: () => void;
  removeEducation: (id: string) => void;
  updateSkillCategory: (id: string, payload: Partial<SkillCategory>) => void;
  addSkillCategory: () => void;
  removeSkillCategory: (id: string) => void;
  loadResume: (data: ResumeData) => void;
  resetResume: () => void;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(resumeReducer, DEFAULT_RESUME_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ascent-resume-data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        dispatch({ type: "LOAD_RESUME", payload: parsed });
      } catch (e) {
        console.error("Failed to parse resume data from local storage", e);
      }
    }
    // This effect only initializes data if not already loaded
    setTimeout(() => setIsLoaded(true), 0);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("ascent-resume-data", JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updatePersonalInfo = useCallback(
    (payload: Partial<PersonalInfo>) =>
      dispatch({ type: "SET_PERSONAL_INFO", payload }),
    []
  );

  const updateExperience = useCallback(
    (id: string, payload: Partial<ExperienceItem>) =>
      dispatch({ type: "SET_EXPERIENCE_ITEM", id, payload }),
    []
  );

  const addExperience = useCallback(
    () => dispatch({ type: "ADD_EXPERIENCE_ITEM" }),
    []
  );

  const removeExperience = useCallback(
    (id: string) => dispatch({ type: "REMOVE_EXPERIENCE_ITEM", id }),
    []
  );

  const updateProject = useCallback(
    (id: string, payload: Partial<ProjectItem>) =>
      dispatch({ type: "SET_PROJECT_ITEM", id, payload }),
    []
  );

  const addProject = useCallback(
    () => dispatch({ type: "ADD_PROJECT_ITEM" }),
    []
  );

  const removeProject = useCallback(
    (id: string) => dispatch({ type: "REMOVE_PROJECT_ITEM", id }),
    []
  );

  const updateEducation = useCallback(
    (id: string, payload: Partial<EducationItem>) =>
      dispatch({ type: "SET_EDUCATION_ITEM", id, payload }),
    []
  );

  const addEducation = useCallback(
    () => dispatch({ type: "ADD_EDUCATION_ITEM" }),
    []
  );

  const removeEducation = useCallback(
    (id: string) => dispatch({ type: "REMOVE_EDUCATION_ITEM", id }),
    []
  );

  const updateSkillCategory = useCallback(
    (id: string, payload: Partial<SkillCategory>) =>
      dispatch({ type: "SET_SKILL_CATEGORY", id, payload }),
    []
  );

  const addSkillCategory = useCallback(
    () => dispatch({ type: "ADD_SKILL_CATEGORY" }),
    []
  );

  const removeSkillCategory = useCallback(
    (id: string) => dispatch({ type: "REMOVE_SKILL_CATEGORY", id }),
    []
  );

  const loadResume = useCallback(
    (resumeData: ResumeData) => dispatch({ type: "LOAD_RESUME", payload: resumeData }),
    []
  );

  const resetResume = useCallback(
    () => dispatch({ type: "RESET_RESUME" }),
    []
  );

  return (
    <ResumeContext.Provider
      value={{
        data,
        dispatch,
        updatePersonalInfo,
        updateExperience,
        addExperience,
        removeExperience,
        updateProject,
        addProject,
        removeProject,
        updateEducation,
        addEducation,
        removeEducation,
        updateSkillCategory,
        addSkillCategory,
        removeSkillCategory,
        loadResume,
        resetResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) {
    throw new Error("useResume must be used within a ResumeProvider");
  }
  return ctx;
}