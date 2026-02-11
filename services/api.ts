
import { AUTH_API_URL, DATA_API_URL } from '../constants';
import { CalculatorState, EstimateRecord, UserSession } from '../types';

interface ApiResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
}

/**
 * Helper to retrieve session token from local storage
 * Used to inject auth headers into Data API calls
 */
const getSession = (): Partial<UserSession> => {
    try {
        const s = localStorage.getItem('foamProSession');
        return s ? JSON.parse(s) : {};
    } catch {
        return {};
    }
};

/**
 * Helper for making robust fetch requests to GAS
 * routes to either Auth or Data endpoint
 */
const apiRequest = async (target: 'auth' | 'data', payload: any, retries = 2): Promise<ApiResponse> => {
    const url = target === 'auth' ? AUTH_API_URL : DATA_API_URL;

    if (!url || url.includes('INSERT')) {
        return { status: 'error', message: `API Config Missing: ${target.toUpperCase()} URL not set.` };
    }

    // Inject Security Context for Data Calls
    if (target === 'data') {
        const session = getSession();
        if (!session.token || !session.spreadsheetId) {
            return { status: 'error', message: 'Unauthorized: Missing session token.' };
        }
        
        // Ensure the payload wrapper exists
        if (!payload.payload) payload.payload = {};
        
        // Inject credentials into the payload for Script 2 validation
        payload.payload.token = session.token;
        payload.payload.spreadsheetId = session.spreadsheetId;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "text/plain;charset=utf-8", 
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result: ApiResponse = await response.json();
        return result;
    } catch (error: any) {
        if (retries > 0) {
            console.warn(`API Request Failed (${target}), retrying... (${retries} left)`);
            await new Promise(res => setTimeout(res, 1000));
            return apiRequest(target, payload, retries - 1);
        }
        console.error("API Request Failed:", error);
        return { status: 'error', message: error.message || "Network request failed" };
    }
};

// --- DATA OPERATIONS (Script 2) ---

export const syncDown = async (spreadsheetId: string): Promise<Partial<CalculatorState> | null> => {
  // Note: spreadsheetId is redundant here as it's injected by apiRequest, but kept for signature compatibility
  const result = await apiRequest('data', { action: 'SYNC_DOWN', payload: { lastSyncTimestamp: 0 } });
  
  if (result.status === 'success') {
    return result.data;
  } else {
    console.error("Sync Down Error:", result.message);
    return null;
  }
};

export const syncUp = async (state: CalculatorState, spreadsheetId: string): Promise<boolean> => {
  const result = await apiRequest('data', { action: 'SYNC_UP', payload: { state } });
  return result.status === 'success';
};

export const markJobPaid = async (estimateId: string, spreadsheetId: string): Promise<{success: boolean, estimate?: EstimateRecord}> => {
    const result = await apiRequest('data', { action: 'MARK_JOB_PAID', payload: { estimateId } });
    return { success: result.status === 'success', estimate: result.data?.estimate };
};

export const createWorkOrderSheet = async (estimateData: EstimateRecord, folderId: string | undefined, spreadsheetId: string): Promise<string | null> => {
  const result = await apiRequest('data', { action: 'CREATE_WORK_ORDER', payload: { estimateData, folderId } });
  if (result.status === 'success') return result.data.url;
  console.error("Create WO Error:", result.message);
  return null;
};

export const logCrewTime = async (workOrderUrl: string, startTime: string, endTime: string | null, user: string): Promise<boolean> => {
    const result = await apiRequest('data', { action: 'LOG_TIME', payload: { workOrderUrl, startTime, endTime, user } });
    return result.status === 'success';
};

export const completeJob = async (estimateId: string, actuals: any, spreadsheetId: string): Promise<boolean> => {
    const result = await apiRequest('data', { action: 'COMPLETE_JOB', payload: { estimateId, actuals } });
    return result.status === 'success';
};

export const deleteEstimate = async (estimateId: string, spreadsheetId: string): Promise<boolean> => {
    const result = await apiRequest('data', { action: 'DELETE_ESTIMATE', payload: { estimateId } });
    return result.status === 'success';
};

export const savePdfToDrive = async (fileName: string, base64Data: string, estimateId: string | undefined, spreadsheetId: string, folderId?: string) => {
  const result = await apiRequest('data', { action: 'SAVE_PDF', payload: { fileName, base64Data, estimateId, folderId } });
  return result.status === 'success' ? result.data.url : null;
};

export const uploadImage = async (base64Data: string, spreadsheetId: string, fileName: string = 'image.jpg'): Promise<string | null> => {
  const result = await apiRequest('data', { action: 'UPLOAD_IMAGE', payload: { base64Data, fileName } });
  return result.status === 'success' ? result.data.url : null;
};

// --- AUTH OPERATIONS (Script 1) ---

export const loginUser = async (username: string, password: string): Promise<UserSession | null> => {
    const result = await apiRequest('auth', { action: 'LOGIN', payload: { username, password } });
    if (result.status === 'success') return result.data;
    throw new Error(result.message || "Login failed");
};

export const loginCrew = async (username: string, pin: string): Promise<UserSession | null> => {
    const result = await apiRequest('auth', { action: 'CREW_LOGIN', payload: { username, pin } });
    if (result.status === 'success') return result.data;
    throw new Error(result.message || "Crew Login failed");
};

export const signupUser = async (username: string, password: string, companyName: string): Promise<UserSession | null> => {
    const result = await apiRequest('auth', { action: 'SIGNUP', payload: { username, password, companyName } });
    if (result.status === 'success') return result.data;
    throw new Error(result.message || "Signup failed");
};

export const submitTrial = async (name: string, email: string, phone: string): Promise<boolean> => {
    const result = await apiRequest('auth', { action: 'SUBMIT_TRIAL', payload: { name, email, phone } });
    return result.status === 'success';
};
