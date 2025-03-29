import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { ArrowRight, Plus, Save, AlertCircle, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface WorkflowResponse {
  workflowMasterId?: number;
  wfdName: string;
  wfdDesc: string;
  wfdStatus: 'active' | 'inactive';
}

interface Workflow extends WorkflowResponse {
  stages: Stage[];
}

interface Stage {
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
  actions?: Action[];
}

interface Action {
  idwfdStagesActions?: number;
  stageId?: number;
  tempId?: string;
  actionName: string;
  actionDesc?: string;
  nextStageType: 'next' | 'prev' | 'complete' | 'specific';
  nextStageId?: number;
  requiredCount: number;
}

interface Role {
  idrbRoleMaster: number;
  rbRoleName: string;
}

interface WorkflowWizardProps {
  onComplete: (workflow: Workflow) => void;
  existingWorkflow?: Workflow;
  onCancel?: () => void;
}

type WizardStep = 1 | 2 | 3;

const inputStyles = "mt-1 block w-full rounded-md border-2 border-purple-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 focus:ring-opacity-50";

const WorkflowWizard: React.FC<WorkflowWizardProps> = ({ onComplete, existingWorkflow, onCancel }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [workflowName, setWorkflowName] = useState(existingWorkflow?.wfdName || '');
  const [workflowDesc, setWorkflowDesc] = useState(existingWorkflow?.wfdDesc || '');
  const [workflowStatus, setWorkflowStatus] = useState<'active' | 'inactive'>(existingWorkflow?.wfdStatus || 'active');
  const [stages, setStages] = useState<Stage[]>(existingWorkflow?.stages || []);
  const [currentStage, setCurrentStage] = useState<{
    name: string;
    description: string;
    actorType: 'role' | 'user';
    roleId: number | null;
    actorCount: number;
    anyAllFlag: 'any' | 'all';
    conflictCheck: boolean;
    documentCount: number;
    documents: { required: boolean }[];
    actions: Action[];
  }>({
    name: '',
    description: '',
    actorType: 'role',
    roleId: null,
    actorCount: 1,
    anyAllFlag: 'any',
    conflictCheck: false,
    documentCount: 0,
    documents: [],
    actions: [],
  });
  const [workflowId, setWorkflowId] = useState<number | null>(existingWorkflow?.workflowMasterId || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requireDocuments, setRequireDocuments] = useState(false);
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const userRoles = (location.state as { roles: string[] })?.roles || [];

  const canCreateWorkflow = userRoles.includes('workflow-designer');

  useEffect(() => {
    console.log('Checking user role for workflow creation:', userRoles);
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can create or manage workflows.');
      return;
    }

    const fetchRoles = async () => {
      try {
        const response = await axios.get<Role[]>('http://localhost:5000/api/roles');
        setAvailableRoles(response.data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        setError('Failed to fetch roles');
      }
    };

    const fetchWorkflow = async () => {
      if (existingWorkflow?.workflowMasterId) {
        try {
          setLoading(true);
          console.log('Fetching existing workflow with ID:', existingWorkflow.workflowMasterId);
          const response = await axios.get<Workflow>(`http://localhost:5000/api/workflows/${existingWorkflow.workflowMasterId}`);
          console.log('Fetched existing workflow:', response.data);
          const workflowData = response.data;
          setWorkflowName(workflowData.wfdName);
          setWorkflowDesc(workflowData.wfdDesc);
          setWorkflowStatus(workflowData.wfdStatus);
          setStages(workflowData.stages.map(stage => ({
            idwfdStages: stage.idwfdStages,
            wfId: stage.wfId,
            seqNo: stage.seqNo,
            stageName: stage.stageName,
            stageDesc: stage.stageDesc,
            noOfUploads: stage.noOfUploads,
            actorType: stage.actorType,
            actorCount: stage.actorCount,
            anyAllFlag: stage.anyAllFlag,
            conflictCheck: stage.conflictCheck,
            documentRequired: stage.documentRequired,
            roleId: stage.roleId,
            actions: (stage.actions || []).map(action => ({
              ...action,
              tempId: `action-${Date.now()}-${Math.random()}`,
            })),
          })));
          setWorkflowId(workflowData.workflowMasterId || null);
          setLoading(false);
        } catch (err) {
          const error = err as AxiosError<{ message?: string }>;
          console.error('Error fetching workflow:', error.response?.data || error.message);
          setError(`Failed to load workflow data: ${error.response?.data?.message || error.message || 'Network error'}`);
          setLoading(false);
        }
      }
    };

    fetchRoles();
    fetchWorkflow();
  }, [existingWorkflow, canCreateWorkflow]);

  const validateStep1 = () => {
    console.log('Validating Step 1 - Workflow Details:', { workflowName, workflowDesc, workflowStatus });
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can create workflows.');
      return false;
    }
    if (!workflowName.trim()) {
      setError('Workflow name is required');
      return false;
    }
    if (!workflowDesc.trim()) {
      setError('Workflow description is required');
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    console.log('Validating Step 2 - Stages:', stages);
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can manage stages.');
      return false;
    }
    if (stages.length === 0) {
      setError('At least one stage is required');
      return false;
    }
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (!stage.actions || stage.actions.length === 0) {
        setError(`Stage ${i + 1} (${stage.stageName}) must have at least one action.`);
        return false;
      }
      for (const action of stage.actions) {
        if (action.nextStageType === 'specific' && !action.nextStageId) {
          setError(`A specific stage must be selected for action "${action.actionName}" in Stage ${i + 1} (${stage.stageName}).`);
          return false;
        }
      }
    }
    const lastStage = stages[stages.length - 1];
    if (!lastStage.actions?.some(a => a.nextStageType === 'complete')) {
      setError("At least one 'Complete' action is required to complete the workflow.");
      return false;
    }
    setError(null);
    return true;
  };

  const validateCurrentStage = () => {
    console.log('Validating Current Stage:', currentStage);
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can add or edit stages.');
      return false;
    }
    if (!currentStage.name.trim()) {
      setError('Stage name is required');
      return false;
    }
    if (!currentStage.description.trim()) {
      setError('Stage description is required');
      return false;
    }
    if (currentStage.actorType === 'role' && !currentStage.roleId) {
      setError('A role must be selected');
      return false;
    }
    if (currentStage.actorCount < 1) {
      setError('Actor count must be at least 1');
      return false;
    }
    if (!['role', 'user'].includes(currentStage.actorType)) {
      setError('Actor type must be either "role" or "user"');
      return false;
    }
    if (!['any', 'all'].includes(currentStage.anyAllFlag)) {
      setError('Any/All flag must be either "any" or "all"');
      return false;
    }
    if (currentStage.actions.length === 0) {
      setError('At least one action is required for this stage.');
      return false;
    }
    for (const action of currentStage.actions) {
      if (!action.actionName.trim()) {
        setError('Action name is required for all actions');
        return false;
      }
      if (!['next', 'prev', 'complete', 'specific'].includes(action.nextStageType)) {
        setError('Action result type must be "next", "prev", "complete", or "specific"');
        return false;
      }
      if (action.nextStageType === 'specific') {
        if (!action.nextStageId) {
          setError('A specific stage must be selected for this action.');
          return false;
        }
        const stageExists = stages.some(stage => stage.idwfdStages === action.nextStageId);
        if (!stageExists) {
          setError('The selected specific stage does not exist.');
          return false;
        }
      }
      if (action.requiredCount < 1 || action.requiredCount > currentStage.actorCount) {
        setError(`Required count must be between 1 and ${currentStage.actorCount}`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const createWorkflowIfNeeded = async (): Promise<number | null> => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can create workflows.');
      return null;
    }
    if (workflowId) {
      console.log('Workflow already exists with ID:', workflowId);
      return workflowId;
    }

    try {
      setLoading(true);
      console.log('Creating new workflow with:', { workflowName, workflowDesc, workflowStatus });
      const response = await axios.post<WorkflowResponse>('http://localhost:5000/api/workflows', {
        wfdName: workflowName,
        wfdDesc: workflowDesc,
        wfdStatus: workflowStatus,
      });
      const newWorkflowId = response.data.workflowMasterId;
      if (!newWorkflowId) {
        throw new Error('Failed to retrieve new workflow ID');
      }
      console.log('New workflow created with ID:', newWorkflowId);
      setWorkflowId(newWorkflowId);
      setLoading(false);
      return newWorkflowId;
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error creating workflow:', error.response?.data || error.message);
      setError(`Failed to create workflow: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
      return null;
    }
  };

  const handleAddStage = async () => {
    if (!validateCurrentStage()) return;

    const wfId = await createWorkflowIfNeeded();
    if (!wfId || !canCreateWorkflow) {
      console.log('Cannot add stage: Workflow ID not found or user lacks permission');
      return;
    }

    const stageData = {
      seqNo: stages.length + 1,
      stageName: currentStage.name,
      stageDesc: currentStage.description,
      noOfUploads: currentStage.documentCount,
      actorType: currentStage.actorType,
      roleId: currentStage.actorType === 'role' ? currentStage.roleId : null,
      actorCount: currentStage.actorCount,
      anyAllFlag: currentStage.anyAllFlag,
      conflictCheck: currentStage.conflictCheck ? 1 : 0,
      documentRequired: requireDocuments ? 1 : 0,
      actions: currentStage.actions.map(action => ({
        actionName: action.actionName,
        actionDesc: action.actionDesc || null,
        nextStageType: action.nextStageType,
        nextStageId: action.nextStageType === 'specific' ? action.nextStageId : null,
        requiredCount: action.requiredCount || 1,
      })),
    };

    console.log('Sending stageData to backend:', stageData);

    try {
      setLoading(true);
      const response = await axios.post<Stage>(`http://localhost:5000/api/workflows/${wfId}/stages`, stageData);
      console.log('Stage added successfully with response:', response.data);
      const updatedStage = {
        ...response.data,
        actions: (response.data.actions || []).map(action => ({
          ...action,
          tempId: `action-${Date.now()}-${Math.random()}`,
        })),
      };
      setStages([...stages, updatedStage]);
      setCurrentStage({
        name: '',
        description: '',
        actorType: 'role',
        roleId: null,
        actorCount: 1,
        anyAllFlag: 'any',
        conflictCheck: false,
        documentCount: 0,
        documents: [],
        actions: [],
      });
      setRequireDocuments(false);
      setEditingStageIndex(null);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error adding stage:', error.response?.data || error.message);
      setError(`Failed to add stage: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const handleEditStage = async (index: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can edit stages.');
      return;
    }
    const stageToEdit = stages[index];
    if (!stageToEdit || !stageToEdit.idwfdStages) {
      setError('Invalid stage selected for editing.');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching stage for editing:', stageToEdit.idwfdStages);
      const response = await axios.get<Stage>(`http://localhost:5000/api/workflows/${workflowId}/stages/${stageToEdit.idwfdStages}`);
      const fetchedStage = response.data;
      console.log('Fetched stage for editing:', fetchedStage);
      setEditingStageIndex(index);
      setCurrentStage({
        name: fetchedStage.stageName,
        description: fetchedStage.stageDesc,
        actorType: fetchedStage.actorType,
        roleId: fetchedStage.roleId,
        actorCount: fetchedStage.actorCount,
        anyAllFlag: fetchedStage.anyAllFlag,
        conflictCheck: !!fetchedStage.conflictCheck,
        documentCount: fetchedStage.noOfUploads,
        documents: fetchedStage.noOfUploads > 0 ? Array(fetchedStage.noOfUploads).fill({ required: !!fetchedStage.documentRequired }) : [],
        actions: (fetchedStage.actions || []).map(action => ({
          ...action,
          tempId: `action-${Date.now()}-${Math.random()}`,
        })),
      });
      setRequireDocuments(!!fetchedStage.documentRequired);
      setCurrentStep(2);
      setLoading(false);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error fetching stage for editing:', error.response?.data || error.message);
      setError(`Failed to load stage for editing: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const handleUpdateStage = async () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can update stages.');
      return;
    }
    if (!validateCurrentStage() || editingStageIndex === null || !stages[editingStageIndex]?.idwfdStages) {
      setError('Invalid stage or validation failed.');
      return;
    }

    const wfId = workflowId;
    if (!wfId) {
      setError('Workflow ID not found.');
      return;
    }

    const stageData = {
      seqNo: stages[editingStageIndex].seqNo,
      stageName: currentStage.name,
      stageDesc: currentStage.description,
      noOfUploads: currentStage.documentCount,
      actorType: currentStage.actorType,
      roleId: currentStage.actorType === 'role' ? currentStage.roleId : null,
      actorCount: currentStage.actorCount,
      anyAllFlag: currentStage.anyAllFlag,
      conflictCheck: currentStage.conflictCheck ? 1 : 0,
      documentRequired: requireDocuments ? 1 : 0,
      actions: currentStage.actions.map(action => ({
        actionName: action.actionName,
        actionDesc: action.actionDesc || null,
        nextStageType: action.nextStageType,
        nextStageId: action.nextStageType === 'specific' ? action.nextStageId : null,
        requiredCount: action.requiredCount || 1,
      })),
    };

    try {
      setLoading(true);
      console.log('Updating stage with data:', stageData);
      const response = await axios.put<Stage>(`http://localhost:5000/api/workflows/${wfId}/stages/${stages[editingStageIndex].idwfdStages}`, stageData);
      console.log('Stage updated successfully with response:', response.data);
      const updatedStages = [...stages];
      updatedStages[editingStageIndex] = {
        ...response.data,
        actions: (response.data.actions || []).map(action => ({
          ...action,
          tempId: `action-${Date.now()}-${Math.random()}`,
        })),
      };
      setStages(updatedStages);
      setCurrentStage({
        name: '',
        description: '',
        actorType: 'role',
        roleId: null,
        actorCount: 1,
        anyAllFlag: 'any',
        conflictCheck: false,
        documentCount: 0,
        documents: [],
        actions: [],
      });
      setRequireDocuments(false);
      setEditingStageIndex(null);
      setLoading(false);
      console.log('Stage updated successfully');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      console.error('Error updating stage:', error.response?.data || error.message);
      setError(`Failed to update stage: ${error.response?.data?.message || error.message || 'Network error'}`);
      setLoading(false);
    }
  };

  const handleDeleteStage = async (index: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can delete stages.');
      return;
    }
    if (!stages[index]?.idwfdStages) {
      setError('Invalid stage selected for deletion.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this stage?')) {
      const wfId = workflowId;
      if (!wfId) {
        setError('Workflow ID not found.');
        return;
      }

      try {
        setLoading(true);
        console.log('Deleting stage:', stages[index].idwfdStages);
        await axios.delete(`http://localhost:5000/api/workflows/${wfId}/stages/${stages[index].idwfdStages}`);
        const updatedStages = stages.filter((_, i) => i !== index);
        updatedStages.forEach((stage, i) => stage.seqNo = i + 1);
        setStages(updatedStages);
        setLoading(false);
        console.log('Stage deleted successfully');
      } catch (err) {
        const error = err as AxiosError<{ message?: string }>;
        console.error('Error deleting stage:', error.response?.data || error.message);
        setError(`Failed to delete stage: ${error.response?.data?.message || error.message || 'Network error'}`);
        setLoading(false);
      }
    }
  };

  const handleAddAction = () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can add actions.');
      return;
    }
    console.log('Adding new action to current stage. Current actions:', currentStage.actions);
    setCurrentStage(prevStage => {
      const newAction = {
        tempId: `action-${Date.now()}-${Math.random()}`,
        actionName: '',
        actionDesc: '',
        nextStageType: 'next' as 'next' | 'prev' | 'complete' | 'specific',
        requiredCount: 1,
      };
      const newActions = [...prevStage.actions, newAction];
      console.log('New actions after adding:', newActions);
      return {
        ...prevStage,
        actions: newActions,
      };
    });
  };

  const handleUpdateAction = (index: number, field: keyof Action, value: any) => {
    console.log(`Updating action at index ${index}, field ${field} with value:`, value);
    setCurrentStage(prevStage => {
      const updatedActions = [...prevStage.actions];
      updatedActions[index] = { ...updatedActions[index], [field]: value };

      // If nextStageType is changed to 'next', 'prev', or 'complete', clear nextStageId
      if (field === 'nextStageType' && value !== 'specific') {
        updatedActions[index].nextStageId = undefined;
      }

      return { ...prevStage, actions: updatedActions };
    });
  };

  const handleDeleteAction = (index: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can delete actions.');
      return;
    }
    console.log('Deleting action at index:', index);
    const updatedActions = currentStage.actions.filter((_, i) => i !== index);
    setCurrentStage({ ...currentStage, actions: updatedActions });
  };

  const handleSubmit = async () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can save workflows.');
      return;
    }

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting workflow with data:', { workflowName, workflowDesc, workflowStatus, stages });
      let response;
      if (workflowId) {
        response = await axios.put<WorkflowResponse>(`http://localhost:5000/api/workflows/${workflowId}`, {
          wfdName: workflowName,
          wfdDesc: workflowDesc,
          wfdStatus: workflowStatus,
        });
      } else {
        response = await axios.post<WorkflowResponse>('http://localhost:5000/api/workflows', {
          wfdName: workflowName,
          wfdDesc: workflowDesc,
          wfdStatus: workflowStatus,
        });
        setWorkflowId(response.data.workflowMasterId || null);
      }

      const workflowData: Workflow = {
        ...response.data,
        stages: stages,
      };
      console.log('Workflow saved successfully:', workflowData);
      onComplete(workflowData);
      navigate('/dashboard', { state: { userId: location.state?.userId, roles: userRoles } });
      setLoading(false);
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError(`Failed to save workflow: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can proceed.');
      return;
    }
    let isValid = false;
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    }

    if (isValid) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep((prev) => (prev < 3 ? (prev + 1) as WizardStep : prev));
      setError(null);
    }
  };

  const handleDocumentCountChange = (count: number) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can modify document requirements.');
      return;
    }
    console.log('Updating document count to:', count);
    const newDocuments = Array(count).fill({ required: false });
    setCurrentStage({
      ...currentStage,
      documentCount: count,
      documents: newDocuments,
    });
  };

  const handleDocumentRequiredChange = (index: number, required: boolean) => {
    if (!canCreateWorkflow) {
      setError('Access Denied: Only Workflow Designers can modify document requirements.');
      return;
    }
    console.log(`Setting document ${index + 1} required to:`, required);
    const newDocuments = [...currentStage.documents];
    newDocuments[index] = { required };
    setCurrentStage({
      ...currentStage,
      documents: newDocuments,
    });
  };

  const getRoleName = (roleId: number | null | undefined): string => {
    if (!roleId) return 'N/A';
    const role = availableRoles.find(r => r.idrbRoleMaster === roleId);
    return role ? role.rbRoleName : 'Unknown Role';
  };

  const getStageName = (stageId: number | undefined): string => {
    if (!stageId) return 'N/A';
    const stage = stages.find(s => s.idwfdStages === stageId);
    return stage ? stage.stageName : 'Unknown Stage';
  };

  if (!canCreateWorkflow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only Workflow Designers can access this page.</p>
          <button
            onClick={() => {
              navigate('/dashboard');
              if (onCancel) onCancel();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {existingWorkflow ? 'Edit Workflow' : 'Create New Workflow'}
            </h1>
            {onCancel && (
              <button
                onClick={() => {
                  setError(null);
                  onCancel();
                }}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancel
              </button>
            )}
          </div>

          {loading && (
            <div className="mb-4 p-4 bg-purple-50 border-l-4 border-purple-300 text-purple-700 flex items-center">
              <span className="animate-spin mr-2">⏳</span>
              Loading...
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`rounded-full h-10 w-10 flex items-center justify-center ${step <= currentStep ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`h-1 w-24 ${step < currentStep ? 'bg-purple-600' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Workflow Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Workflow Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className={inputStyles}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={workflowDesc}
                  onChange={(e) => setWorkflowDesc(e.target.value)}
                  rows={4}
                  className={inputStyles}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={workflowStatus}
                  onChange={(e) => setWorkflowStatus(e.target.value as 'active' | 'inactive')}
                  className={inputStyles}
                  required
                  disabled={loading}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Stage Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={currentStage.name}
                    onChange={(e) => setCurrentStage({ ...currentStage, name: e.target.value })}
                    className={inputStyles}
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stage Description <span className="text-red-500">*</span></label>
                  <textarea
                    value={currentStage.description}
                    onChange={(e) => setCurrentStage({ ...currentStage, description: e.target.value })}
                    rows={3}
                    className={inputStyles}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Actor Type <span className="text-red-500">*</span></label>
                    <select
                      value={currentStage.actorType}
                      onChange={(e) => setCurrentStage({ ...currentStage, actorType: e.target.value as 'role' | 'user', roleId: null })}
                      className={inputStyles}
                      required
                      disabled={loading}
                    >
                      <option value="role">Role</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div>
                    {currentStage.actorType === 'role' && (
                      <>
                        <label className="block text-sm font-medium text-gray-700">
                          Role <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={currentStage.roleId || ''}
                          onChange={(e) => setCurrentStage({ ...currentStage, roleId: parseInt(e.target.value) || null })}
                          className={inputStyles}
                          required
                          disabled={loading}
                        >
                          <option value="">Select a role</option>
                          {availableRoles.map((role) => (
                            <option key={role.idrbRoleMaster} value={role.idrbRoleMaster}>
                              {role.rbRoleName}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actor Count <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={currentStage.actorCount}
                    onChange={(e) => setCurrentStage({ ...currentStage, actorCount: parseInt(e.target.value) || 1 })}
                    className={inputStyles}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Any/All Flag <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentStage.anyAllFlag}
                    onChange={(e) => setCurrentStage({ ...currentStage, anyAllFlag: e.target.value as 'any' | 'all' })}
                    className={inputStyles}
                    required
                    disabled={loading}
                  >
                    <option value="any">Any</option>
                    <option value="all">All</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={currentStage.conflictCheck}
                      onChange={(e) => setCurrentStage({ ...currentStage, conflictCheck: e.target.checked })}
                      className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700">Enable Conflict of Interest Check</span>
                  </label>
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Document Requirements</h3>
                  <div>
                    <label className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        checked={requireDocuments}
                        onChange={(e) => {
                          setRequireDocuments(e.target.checked);
                          if (!e.target.checked) handleDocumentCountChange(0);
                        }}
                        className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">This stage requires documents</span>
                    </label>
                  </div>

                  {requireDocuments && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Number of Documents Required
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={currentStage.documentCount}
                          onChange={(e) => handleDocumentCountChange(parseInt(e.target.value) || 1)}
                          className={inputStyles}
                          disabled={loading}
                        />
                      </div>

                      {currentStage.documents.map((doc, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">Document {index + 1}</span>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={doc.required}
                              onChange={(e) => handleDocumentRequiredChange(index, e.target.checked)}
                              className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                              disabled={loading}
                            />
                            <span className="text-sm text-gray-700">Required</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Actions for this Stage</h3>
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'}`}
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Action
                  </button>

                  {currentStage.actions.map((action, index) => (
                    <div key={action.tempId || index} className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Action Name</label>
                            <input
                              type="text"
                              value={action.actionName}
                              onChange={(e) => handleUpdateAction(index, 'actionName', e.target.value)}
                              className={inputStyles}
                              required
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Action Description (optional)</label>
                            <textarea
                              value={action.actionDesc || ''}
                              onChange={(e) => handleUpdateAction(index, 'actionDesc', e.target.value)}
                              rows={2}
                              className={inputStyles}
                              disabled={loading}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Result Type</label>
                            <select
                              value={action.nextStageType}
                              onChange={(e) => {
                                const newType = e.target.value as 'next' | 'prev' | 'complete' | 'specific';
                                handleUpdateAction(index, 'nextStageType', newType);
                                if (newType !== 'specific') {
                                  handleUpdateAction(index, 'nextStageId', undefined);
                                }
                              }}
                              className={inputStyles}
                              required
                              disabled={loading}
                            >
                              <option value="next">Move to Next Stage</option>
                              <option value="prev">Return to Previous Stage</option>
                              <option value="complete">Complete Workflow</option>
                              <option value="specific">Move to Specific Stage</option>
                            </select>
                          </div>
                          {action.nextStageType === 'specific' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Select Specific Stage</label>
                              <select
                                value={action.nextStageId || ''}
                                onChange={(e) => handleUpdateAction(index, 'nextStageId', parseInt(e.target.value) || undefined)}
                                className={inputStyles}
                                disabled={loading}
                              >
                                <option value="">Select a stage</option>
                                {stages.map((stage, stageIndex) => (
                                  <option key={stageIndex} value={stage.idwfdStages}>
                                    Stage {stageIndex + 1}: {stage.stageName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Required Count</label>
                            <input
                              type="number"
                              min="1"
                              max={currentStage.actorCount}
                              value={action.requiredCount}
                              onChange={(e) => handleUpdateAction(index, 'requiredCount', parseInt(e.target.value) || 1)}
                              className={inputStyles}
                              required
                              disabled={loading}
                            />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteAction(index)}
                            className={`p-1 text-gray-500 hover:text-red-600 transition-colors ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                            title="Delete Action"
                            disabled={loading}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      {index < currentStage.actions.length - 1 && (
                        <div className="mt-2 flex items-center">
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Next Action</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={editingStageIndex !== null ? handleUpdateStage : handleAddStage}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'}`}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {editingStageIndex !== null ? 'Update Stage' : 'Add Stage'}
                </button>
              </div>

              {stages.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Added Stages</h3>
                  <div className="space-y-4">
                    {stages.map((stage, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{stage.stageName}</h4>
                            <p className="text-sm text-gray-600">{stage.stageDesc}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-500">
                                Actor: {stage.actorType === 'role' ? getRoleName(stage.roleId) : 'N/A'} ({stage.actorType})
                              </p>
                              <p className="text-sm text-gray-500">Any/All: {stage.anyAllFlag}</p>
                              <p className="text-sm text-gray-500">Conflict Check: {stage.conflictCheck ? 'Yes' : 'No'}</p>
                              <p className="text-sm text-gray-500">Documents Required: {stage.noOfUploads} ({stage.documentRequired ? 'Yes' : 'No'})</p>
                              {stage.actions && stage.actions.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-500 font-medium">Actions:</p>
                                  <ul className="list-disc list-inside ml-2">
                                    {stage.actions.map((action, aIndex) => (
                                      <li key={aIndex} className="text-sm text-gray-600">
                                        {action.actionName} → {action.nextStageType === 'specific' ? `Stage: ${getStageName(action.nextStageId)}` : action.nextStageType} (Required: {action.requiredCount})
                                        {action.actionDesc && <span className="block text-sm text-gray-500 ml-4">Description: {action.actionDesc}</span>}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditStage(index)}
                              className={`p-1 text-gray-500 hover:text-purple-600 transition-colors ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                              title="Edit Stage"
                              disabled={loading}
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStage(index)}
                              className={`p-1 text-gray-500 hover:text-red-600 transition-colors ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                              title="Delete Stage"
                              disabled={loading}
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review</h2>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Workflow Details</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workflowName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workflowStatus === 'active' ? 'Active' : 'Inactive'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{workflowDesc}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-4">Stages ({stages.length})</h3>
                <div className="space-y-4">
                  {stages.map((stage, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium">{stage.stageName}</h4>
                      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Actor Type</dt>
                          <dd>{stage.actorType}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">{stage.actorType === 'role' ? 'Role' : 'User'}</dt>
                          <dd>{stage.actorType === 'role' ? getRoleName(stage.roleId) : 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Actor Count</dt>
                          <dd>{stage.actorCount}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Any/All</dt>
                          <dd>{stage.anyAllFlag}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Conflict Check</dt>
                          <dd>{stage.conflictCheck ? 'Yes' : 'No'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Documents Required</dt>
                          <dd>{stage.noOfUploads} ({stage.documentRequired ? 'Yes' : 'No'})</dd>
                        </div>
                        {stage.actions && stage.actions.length > 0 && (
                          <div className="col-span-2">
                            <dt className="text-gray-500">Actions</dt>
                            <dd>
                              <ul className="list-disc list-inside">
                                {stage.actions.map((action, aIndex) => (
                                  <li key={aIndex} className="text-sm">
                                    {action.actionName} → {action.nextStageType === 'specific' ? `Stage: ${getStageName(action.nextStageId)}` : action.nextStageType} (Required: {action.requiredCount})
                                    {action.actionDesc && <span className="block text-sm text-gray-500 ml-4">Description: {action.actionDesc}</span>}
                                  </li>
                                ))}
                              </ul>
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep((prev) => (prev - 1) as WizardStep);
                  setError(null);
                }}
                className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                disabled={loading}
              >
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'}`}
                disabled={loading}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading ? 'bg-gray-400 cursor-not-allowed opacity-50' : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'}`}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                {existingWorkflow ? 'Update Workflow' : 'Save Workflow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowWizard;