export interface Workflow {
  workflowMasterId?: number;
  wfdName: string;
  wfdDesc: string;
  wfdStatus: 'active' | 'inactive';
  stages: Stage[];
}

export interface Stage {
  idwfdStages?: number;
  wfId?: number;
  seqNo: number;
  stageName: string;
  stageDesc: string;
  noOfUploads: number;
  actorType: 'role' | 'user';
  actorCount: number;
  anyAllFlag: 'any' | 'all';
  conflictCheck: number;
  documentRequired: number;
  roleId?: number | null;
  userId?: number | null;
  actions?: Action[];
}

export interface Action {
  idwfdStagesActions?: number;
  stageId?: number;
  tempId?: string;
  actionName: string;
  actionDesc?: string;
  nextStageType: 'next' | 'prev' | 'complete' | 'specific'; // Fixed typo: 'spe' → 'specific'
  nextStageId?: number;
  requiredCount: number;
  roleId?: number | null; // Added to match backend schema
  userId?: number | null; // Added to match backend schema
}